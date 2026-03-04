"""
Risk Service — computes per-module risk scores.

Formula:
  risk_score = (bug_count_weight × normalized_bug_count) +
               (reopen_weight × reopen_rate) +
               (severity_weight × high_severity_ratio)

Stores results in module_risk_scores table.
"""

import logging
from typing import Optional

from sqlalchemy import select, func, delete
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.defects import Defect
from app.models.defect_lifecycle import DefectLifecycle
from app.models.module_risk_scores import ModuleRiskScore

logger = logging.getLogger(__name__)

# Weights for risk score calculation (total = 1.0)
BUG_COUNT_WEIGHT = 0.40
REOPEN_WEIGHT = 0.35
SEVERITY_WEIGHT = 0.25

# Severities considered "high"
HIGH_SEVERITIES = {"critical", "high", "blocker", "major"}

# Status values considered "reopened"
REOPEN_STATUSES = {"reopen", "reopened", "re-open", "re-opened"}


async def compute_module_risks(db: AsyncSession, dataset_id: int) -> list[ModuleRiskScore]:
    """
    Compute risk scores per module for a dataset.
    Deletes previous scores, then re-computes.
    Returns list of ModuleRiskScore records.
    """
    # 1. Get defects grouped by module
    result = await db.execute(
        select(Defect).where(Defect.dataset_id == dataset_id)
    )
    defects = result.scalars().all()

    if not defects:
        return []

    # Group defects by module
    module_defects: dict[str, list[Defect]] = {}
    for d in defects:
        module = d.module or "Unknown"
        module_defects.setdefault(module, []).append(d)

    total_defects = len(defects)

    # Find max bug count for normalization
    max_bug_count = max(len(defs) for defs in module_defects.values())

    # Delete previous risk scores
    await db.execute(
        delete(ModuleRiskScore).where(ModuleRiskScore.dataset_id == dataset_id)
    )

    scores: list[ModuleRiskScore] = []
    for module_name, defs in module_defects.items():
        bug_count = len(defs)

        # Reopen rate for this module
        reopened = sum(
            1 for d in defs
            if d.status and d.status.strip().lower() in REOPEN_STATUSES
        )
        module_reopen_rate = (reopened / bug_count * 100) if bug_count > 0 else 0.0

        # High severity ratio for this module
        high_sev_count = sum(
            1 for d in defs
            if d.severity and d.severity.strip().lower() in HIGH_SEVERITIES
        )
        high_sev_ratio = (high_sev_count / bug_count * 100) if bug_count > 0 else 0.0

        # Normalize bug count to 0-100 scale
        normalized_bug_count = (bug_count / max_bug_count * 100) if max_bug_count > 0 else 0.0

        # Compute weighted risk score (0-100)
        risk_score = round(
            (BUG_COUNT_WEIGHT * normalized_bug_count) +
            (REOPEN_WEIGHT * module_reopen_rate) +
            (SEVERITY_WEIGHT * high_sev_ratio),
            2,
        )

        record = ModuleRiskScore(
            dataset_id=dataset_id,
            module_name=module_name,
            bug_count=bug_count,
            reopen_rate=round(module_reopen_rate, 2),
            risk_score=risk_score,
        )
        db.add(record)
        scores.append(record)

    await db.flush()
    # Refresh to get computed_at etc.
    for s in scores:
        await db.refresh(s)

    # Sort by risk_score descending
    scores.sort(key=lambda s: s.risk_score or 0, reverse=True)

    logger.info(f"Computed {len(scores)} module risk scores for dataset {dataset_id}")
    return scores


async def get_module_risks(db: AsyncSession, dataset_id: int) -> list[dict]:
    """Fetch stored module risk scores for a dataset, ordered by risk_score desc."""
    result = await db.execute(
        select(ModuleRiskScore)
        .where(ModuleRiskScore.dataset_id == dataset_id)
        .order_by(ModuleRiskScore.risk_score.desc())
    )
    records = result.scalars().all()

    return [
        {
            "risk_id": r.risk_id,
            "module_name": r.module_name,
            "bug_count": r.bug_count,
            "reopen_rate": r.reopen_rate,
            "risk_score": r.risk_score,
            "risk_level": (
                "Low" if (r.risk_score or 0) < 25
                else "Medium" if (r.risk_score or 0) < 50
                else "High" if (r.risk_score or 0) < 75
                else "Critical"
            ),
            "computed_at": r.computed_at.isoformat() if r.computed_at else None,
        }
        for r in records
    ]
