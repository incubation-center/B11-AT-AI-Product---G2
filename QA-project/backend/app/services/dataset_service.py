import logging
import io
from datetime import datetime
from typing import Optional

import pandas as pd
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.datasets import Dataset
from app.models.defects import Defect

logger = logging.getLogger(__name__)

# Default column name mappings (lowercase). The parser tries these first,
# then falls back to explicit user-provided mapping.
DEFAULT_COLUMN_MAP = {
    "bug_id": ["bug_id", "bug id", "defect_id", "defect id", "id", "ticket", "ticket_id", "test_id", "test id", "testcase_id", "tc_id"],
    "title": ["title", "summary", "description", "defect_title", "bug_title", "name", "test_case", "test case", "scenario", "test_description", "test description", "test_name", "test name"],
    "module": ["module", "component", "area", "feature", "module_name"],
    "severity": ["severity", "sev", "severity_level"],
    "priority": ["priority", "pri", "priority_level"],
    "environment": ["environment", "env", "platform", "test_environment"],
    "status": ["status", "state", "defect_status", "bug_status", "result"],
    "test_steps": ["test_steps", "test steps", "steps", "step_description", "step_desc"],
    "expected_result": ["expected_result", "expected result", "expected_outcome", "expected"],
    "preconditions": ["preconditions", "precondition", "precond", "setup"],
    "created_date": ["created_date", "created", "open_date", "opened", "date_created", "reported_date", "created_at"],
    "resolved_date": ["resolved_date", "resolved", "fixed_date", "fix_date", "resolved_at"],
    "closed_date": ["closed_date", "closed", "close_date", "closed_at"],
}


def _normalize(col: str) -> str:
    """Lowercase, strip, replace spaces/dashes with underscores."""
    return col.strip().lower().replace(" ", "_").replace("-", "_")


def _auto_map_columns(df_columns: list[str], explicit_mapping: Optional[dict] = None) -> dict[str, Optional[str]]:
    """Return a dict  {db_field: df_column_name | None}."""
    normalized = {_normalize(c): c for c in df_columns}
    mapping: dict[str, Optional[str]] = {}

    for db_field, aliases in DEFAULT_COLUMN_MAP.items():
        # Check explicit mapping first
        if explicit_mapping and getattr(explicit_mapping, db_field, None):
            explicit_val = getattr(explicit_mapping, db_field)
            if explicit_val in df_columns or _normalize(explicit_val) in normalized:
                mapping[db_field] = explicit_val if explicit_val in df_columns else normalized[_normalize(explicit_val)]
                continue

        # Auto-detect by alias
        matched = None
        for alias in aliases:
            if alias in normalized:
                matched = normalized[alias]
                break
        mapping[db_field] = matched

    return mapping


def _parse_date(val) -> Optional[datetime]:
    """Try to coerce a value to a naive datetime, return None on failure."""
    if val is None or (isinstance(val, float) and pd.isna(val)):
        return None
    if isinstance(val, datetime):
        return val.replace(tzinfo=None)
    if isinstance(val, pd.Timestamp):
        return val.to_pydatetime().replace(tzinfo=None)
    try:
        return pd.to_datetime(val, dayfirst=False).to_pydatetime().replace(tzinfo=None)
    except Exception:
        return None


def _safe_str(val) -> Optional[str]:
    if val is None or (isinstance(val, float) and pd.isna(val)):
        return None
    return str(val).strip()


async def parse_and_import(
    db: AsyncSession,
    user_id: int,
    file_name: str,
    file_bytes: bytes,
    file_type: str,
    upload_type: str,
    explicit_mapping=None,
) -> tuple[Dataset, int]:
    """
    Parse a CSV or Excel file, create a Dataset record, and bulk-insert Defects.
    Returns (dataset, defect_count).
    """

    # 1. Read into DataFrame
    if file_type in ("csv", "text/csv", "application/csv"):
        df = pd.read_csv(io.BytesIO(file_bytes))
        stored_type = "csv"
    elif file_type in (
        "xlsx", "xls",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "application/vnd.ms-excel",
    ):
        df = pd.read_excel(io.BytesIO(file_bytes), engine="openpyxl")
        stored_type = "excel"
    else:
        raise ValueError(f"Unsupported file type: {file_type}")

    if df.empty:
        raise ValueError("The uploaded file contains no data rows.")

    logger.info(f"Parsed {len(df)} rows, columns: {list(df.columns)}")

    # 2. Map columns
    col_map = _auto_map_columns(list(df.columns), explicit_mapping)
    logger.info(f"Column mapping: {col_map}")

    # Require at least a title column
    if col_map.get("title") is None:
        raise ValueError(
            f"Could not detect a 'title' / 'summary' column. "
            f"Available columns: {list(df.columns)}"
        )

    # 3. Create dataset row
    dataset = Dataset(
        user_id=user_id,
        file_name=file_name,
        file_type=stored_type,
        upload_type=upload_type,
    )
    db.add(dataset)
    await db.flush()  # get dataset_id

    # 4. Bulk-insert defects
    defects: list[Defect] = []
    for _, row in df.iterrows():
        defect = Defect(
            dataset_id=dataset.dataset_id,
            bug_id=_safe_str(row.get(col_map["bug_id"])) if col_map.get("bug_id") else None,
            title=_safe_str(row[col_map["title"]]) or "Untitled",
            module=_safe_str(row.get(col_map["module"])) if col_map.get("module") else None,
            severity=_safe_str(row.get(col_map["severity"])) if col_map.get("severity") else None,
            priority=_safe_str(row.get(col_map["priority"])) if col_map.get("priority") else None,
            environment=_safe_str(row.get(col_map["environment"])) if col_map.get("environment") else None,
            status=_safe_str(row.get(col_map["status"])) if col_map.get("status") else None,
            test_steps=_safe_str(row.get(col_map["test_steps"])) if col_map.get("test_steps") else None,
            expected_result=_safe_str(row.get(col_map["expected_result"])) if col_map.get("expected_result") else None,
            preconditions=_safe_str(row.get(col_map["preconditions"])) if col_map.get("preconditions") else None,
            created_date=_parse_date(row.get(col_map["created_date"])) if col_map.get("created_date") else None,
            resolved_date=_parse_date(row.get(col_map["resolved_date"])) if col_map.get("resolved_date") else None,
            closed_date=_parse_date(row.get(col_map["closed_date"])) if col_map.get("closed_date") else None,
        )
        defects.append(defect)

    db.add_all(defects)
    await db.flush()

    return dataset, len(defects)
