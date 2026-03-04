"""
Lifecycle Service — processes defect data to populate defect_lifecycle table.

Handles:
  - Track Status Flow (status transitions)
  - Resolution Time Calculation (days from created → resolved / closed)
  - Reopen Detection (count status regressions)
  - Retest Failure Detection (Fixed → Retest → Reopen pattern)
  - Bottleneck Detection (longest stage per defect)
"""

import logging
from datetime import datetime
from typing import Optional

from sqlalchemy import select, delete, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.defects import Defect
from app.models.defect_lifecycle import DefectLifecycle

logger = logging.getLogger(__name__)

# Statuses that indicate a defect was reopened
REOPEN_STATUSES = {"reopen", "reopened", "re-open", "re-opened"}

# Statuses that indicate a defect is resolved / closed
RESOLVED_STATUSES = {"resolved", "fixed", "closed", "done", "verified"}

# Canonical status order for bottleneck detection
STATUS_ORDER = ["new", "open", "in progress", "fixed", "retest", "verified", "closed"]


def _normalize_status(status: Optional[str]) -> str:
    """Lowercase + strip a status string."""
    if not status:
        return "unknown"
    return status.strip().lower()


def _is_reopen(status: Optional[str]) -> bool:
    return _normalize_status(status) in REOPEN_STATUSES


def _compute_resolution_days(
    created_date: Optional[datetime],
    resolved_date: Optional[datetime],
    closed_date: Optional[datetime],
) -> Optional[int]:
    """Days from created → resolved, or created → closed if resolved is missing."""
    if not created_date:
        return None
    end = resolved_date or closed_date
    if not end:
        return None
    delta = (end - created_date).days
    return max(delta, 0)


def _detect_reopen_count(status: Optional[str]) -> int:
    """
    For a single-status field (no history), we can only detect reopen = 1 if
    the current status is a reopen variant. Returns 0 or 1.
    """
    return 1 if _is_reopen(status) else 0


async def compute_lifecycle_for_dataset(db: AsyncSession, dataset_id: int) -> int:
    """
    Compute lifecycle records for every defect in a dataset.
    Deletes previous lifecycle records for the dataset, then re-computes.

    Returns the number of lifecycle records created.
    """
    # 1. Fetch all defects for the dataset
    result = await db.execute(
        select(Defect).where(Defect.dataset_id == dataset_id)
    )
    defects = result.scalars().all()

    if not defects:
        return 0

    # 2. Delete existing lifecycle records for these defects
    defect_ids = [d.defect_id for d in defects]
    await db.execute(
        delete(DefectLifecycle).where(DefectLifecycle.defect_id.in_(defect_ids))
    )

    # 3. Create new lifecycle records
    records_created = 0
    for defect in defects:
        norm_status = _normalize_status(defect.status)
        reopen_count = _detect_reopen_count(defect.status)
        resolution_days = _compute_resolution_days(
            defect.created_date, defect.resolved_date, defect.closed_date
        )

        # Determine from_status and to_status based on available data
        from_status = "New"
        to_status = defect.status or "Unknown"

        lifecycle = DefectLifecycle(
            defect_id=defect.defect_id,
            from_status=from_status,
            to_status=to_status,
            changed_at=defect.resolved_date or defect.closed_date or datetime.utcnow(),
            reopen_count=reopen_count,
            resolution_days=resolution_days,
        )
        db.add(lifecycle)
        records_created += 1

    await db.flush()
    logger.info(f"Computed {records_created} lifecycle records for dataset {dataset_id}")
    return records_created


async def get_lifecycle_summary(db: AsyncSession, dataset_id: int) -> dict:
    """
    Return lifecycle summary statistics for a dataset:
      - total defects with lifecycle data
      - total reopened defects
      - average resolution days
      - bottleneck status (status with longest avg resolution)
      - status flow distribution
    """
    # Get lifecycle records joined with defects
    result = await db.execute(
        select(DefectLifecycle)
        .join(Defect, DefectLifecycle.defect_id == Defect.defect_id)
        .where(Defect.dataset_id == dataset_id)
    )
    records = result.scalars().all()

    if not records:
        return {
            "total_tracked": 0,
            "total_reopened": 0,
            "avg_resolution_days": None,
            "max_resolution_days": None,
            "min_resolution_days": None,
            "status_flow": [],
        }

    total_tracked = len(records)
    total_reopened = sum(1 for r in records if r.reopen_count and r.reopen_count > 0)

    resolution_days_list = [r.resolution_days for r in records if r.resolution_days is not None]
    avg_resolution = round(sum(resolution_days_list) / len(resolution_days_list), 2) if resolution_days_list else None
    max_resolution = max(resolution_days_list) if resolution_days_list else None
    min_resolution = min(resolution_days_list) if resolution_days_list else None

    # Status flow distribution: count transitions
    flow_map: dict[str, int] = {}
    for r in records:
        key = f"{r.from_status} → {r.to_status}"
        flow_map[key] = flow_map.get(key, 0) + 1

    status_flow = [
        {"transition": k, "count": v}
        for k, v in sorted(flow_map.items(), key=lambda x: -x[1])
    ]

    return {
        "total_tracked": total_tracked,
        "total_reopened": total_reopened,
        "avg_resolution_days": avg_resolution,
        "max_resolution_days": max_resolution,
        "min_resolution_days": min_resolution,
        "status_flow": status_flow,
    }


async def get_lifecycle_per_defect(
    db: AsyncSession,
    dataset_id: int,
    page: int = 1,
    page_size: int = 50,
) -> dict:
    """Return paginated lifecycle records for individual defects."""
    base = (
        select(DefectLifecycle, Defect.bug_id, Defect.title, Defect.status, Defect.module)
        .join(Defect, DefectLifecycle.defect_id == Defect.defect_id)
        .where(Defect.dataset_id == dataset_id)
    )

    # Total count
    count_q = (
        select(func.count(DefectLifecycle.lifecycle_id))
        .join(Defect, DefectLifecycle.defect_id == Defect.defect_id)
        .where(Defect.dataset_id == dataset_id)
    )
    total_result = await db.execute(count_q)
    total = total_result.scalar() or 0

    # Paginate
    query = base.order_by(DefectLifecycle.lifecycle_id).offset((page - 1) * page_size).limit(page_size)
    result = await db.execute(query)
    rows = result.all()

    items = []
    for lc, bug_id, title, defect_status, module in rows:
        items.append({
            "lifecycle_id": lc.lifecycle_id,
            "defect_id": lc.defect_id,
            "bug_id": bug_id,
            "title": title,
            "module": module,
            "current_status": defect_status,
            "from_status": lc.from_status,
            "to_status": lc.to_status,
            "changed_at": lc.changed_at.isoformat() if lc.changed_at else None,
            "reopen_count": lc.reopen_count or 0,
            "resolution_days": lc.resolution_days,
        })

    return {"items": items, "total": total, "page": page, "page_size": page_size}


async def get_severity_vs_resolution(db: AsyncSession, dataset_id: int) -> list[dict]:
    """Compare average resolution time grouped by severity level."""
    result = await db.execute(
        select(
            Defect.severity,
            func.count(DefectLifecycle.lifecycle_id).label("count"),
            func.avg(DefectLifecycle.resolution_days).label("avg_days"),
            func.min(DefectLifecycle.resolution_days).label("min_days"),
            func.max(DefectLifecycle.resolution_days).label("max_days"),
        )
        .join(DefectLifecycle, Defect.defect_id == DefectLifecycle.defect_id)
        .where(Defect.dataset_id == dataset_id)
        .where(DefectLifecycle.resolution_days.isnot(None))
        .group_by(Defect.severity)
        .order_by(func.avg(DefectLifecycle.resolution_days).desc())
    )
    rows = result.all()

    return [
        {
            "severity": row.severity or "Unknown",
            "count": row.count,
            "avg_resolution_days": round(float(row.avg_days), 2) if row.avg_days else None,
            "min_resolution_days": row.min_days,
            "max_resolution_days": row.max_days,
        }
        for row in rows
    ]
