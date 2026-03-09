"""
Analytics Service — computes dataset-level aggregate metrics.

Handles:
  - Defect Summary Overview (total, open, closed, reopened)
  - Severity Distribution (count per severity level)
  - Reopen Rate (reopened / total × 100)
  - Resolution Time Analysis (avg, median, min, max fix time)
  - Defect Leakage Indicator (production/UAT environment defects)
"""

import logging
from typing import Optional

from sqlalchemy import select, func, case, delete
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.defects import Defect
from app.models.defect_lifecycle import DefectLifecycle
from app.models.analytics_results import AnalyticsResult

logger = logging.getLogger(__name__)

# Environment values that indicate post-release / production defects (leakage)
PRODUCTION_ENVS = {
    "production", "prod", "uat", "staging", "live",
    "pre-production", "pre-prod", "post-release",
}

# Status values considered "open"
OPEN_STATUSES = {"new", "open", "in progress", "assigned", "reopen", "reopened", "re-open"}

# Status values considered "closed"
CLOSED_STATUSES = {"closed", "done", "verified", "resolved", "fixed"}

# Status values considered "reopened"
REOPEN_STATUSES = {"reopen", "reopened", "re-open", "re-opened"}


async def compute_analytics(db: AsyncSession, dataset_id: int) -> AnalyticsResult:
    """
    Compute (or re-compute) analytics for a dataset and persist to analytics_results.
    """
    # Fetch all defects
    result = await db.execute(
        select(Defect).where(Defect.dataset_id == dataset_id)
    )
    defects = result.scalars().all()
    total = len(defects)

    if total == 0:
        # Delete any old result and store zero values
        await db.execute(
            delete(AnalyticsResult).where(AnalyticsResult.dataset_id == dataset_id)
        )
        analytics = AnalyticsResult(
            dataset_id=dataset_id,
            reopen_rate=0.0,
            avg_resolution_time=0.0,
            defect_leakage_rate=0.0,
        )
        db.add(analytics)
        await db.flush()
        await db.refresh(analytics)
        return analytics

    # Count reopened defects
    reopened_count = sum(
        1 for d in defects
        if d.status and d.status.strip().lower() in REOPEN_STATUSES
    )
    reopen_rate = round((reopened_count / total) * 100, 2)

    # Average resolution time from lifecycle records
    lc_result = await db.execute(
        select(func.avg(DefectLifecycle.resolution_days))
        .join(Defect, DefectLifecycle.defect_id == Defect.defect_id)
        .where(Defect.dataset_id == dataset_id)
        .where(DefectLifecycle.resolution_days.isnot(None))
    )
    avg_resolution = lc_result.scalar()
    avg_resolution_time = round(float(avg_resolution), 2) if avg_resolution else 0.0

    # Defect leakage rate — defects found in production-like environments
    leakage_count = sum(
        1 for d in defects
        if d.environment and d.environment.strip().lower() in PRODUCTION_ENVS
    )
    leakage_rate = round((leakage_count / total) * 100, 2)

    # Delete previous analytics result for this dataset
    await db.execute(
        delete(AnalyticsResult).where(AnalyticsResult.dataset_id == dataset_id)
    )

    analytics = AnalyticsResult(
        dataset_id=dataset_id,
        reopen_rate=reopen_rate,
        avg_resolution_time=avg_resolution_time,
        defect_leakage_rate=leakage_rate,
    )
    db.add(analytics)
    await db.flush()
    await db.refresh(analytics)

    logger.info(
        f"Analytics computed for dataset {dataset_id}: "
        f"reopen={reopen_rate}%, avg_resolution={avg_resolution_time}d, leakage={leakage_rate}%"
    )
    return analytics


async def get_summary(db: AsyncSession, dataset_id: int) -> dict:
    """
    Defect Summary Overview:
      total, open, closed, reopened, in_progress, unresolved counts.
    """
    result = await db.execute(
        select(Defect).where(Defect.dataset_id == dataset_id)
    )
    defects = result.scalars().all()
    total = len(defects)

    open_count = 0
    closed_count = 0
    reopened_count = 0
    in_progress_count = 0

    for d in defects:
        s = d.status.strip().lower() if d.status else ""
        if s in REOPEN_STATUSES:
            reopened_count += 1
        elif s in CLOSED_STATUSES:
            closed_count += 1
        elif s in OPEN_STATUSES:
            if s == "in progress":
                in_progress_count += 1
            else:
                open_count += 1
        else:
            open_count += 1  # unknown statuses count as open

    return {
        "dataset_id": dataset_id,
        "total": total,
        "open": open_count,
        "in_progress": in_progress_count,
        "closed": closed_count,
        "reopened": reopened_count,
        "unresolved": total - closed_count,
    }


async def get_severity_distribution(db: AsyncSession, dataset_id: int) -> list[dict]:
    """
    Severity Distribution — count per severity level.
    Returns list of {severity, count, percentage}.
    """
    sev_col = func.coalesce(Defect.severity, "Unknown").label("severity")
    result = await db.execute(
        select(
            sev_col,
            func.count(Defect.defect_id).label("count"),
        )
        .where(Defect.dataset_id == dataset_id)
        .group_by(sev_col)
        .order_by(func.count(Defect.defect_id).desc())
    )
    rows = result.all()

    total = sum(r.count for r in rows)
    return [
        {
            "severity": row.severity,
            "count": row.count,
            "percentage": round((row.count / total) * 100, 2) if total > 0 else 0,
        }
        for row in rows
    ]


async def get_resolution_time_stats(db: AsyncSession, dataset_id: int) -> dict:
    """
    Resolution Time Analysis — avg, median, min, max fix time.
    """
    result = await db.execute(
        select(DefectLifecycle.resolution_days)
        .join(Defect, DefectLifecycle.defect_id == Defect.defect_id)
        .where(Defect.dataset_id == dataset_id)
        .where(DefectLifecycle.resolution_days.isnot(None))
        .order_by(DefectLifecycle.resolution_days)
    )
    days_list = [row[0] for row in result.all()]

    if not days_list:
        return {
            "dataset_id": dataset_id,
            "total_resolved": 0,
            "avg_days": None,
            "median_days": None,
            "min_days": None,
            "max_days": None,
            "percentile_90": None,
        }

    n = len(days_list)
    avg_days = round(sum(days_list) / n, 2)
    median_days = days_list[n // 2] if n % 2 == 1 else round((days_list[n // 2 - 1] + days_list[n // 2]) / 2, 2)
    p90_index = int(n * 0.9)
    percentile_90 = days_list[min(p90_index, n - 1)]

    return {
        "dataset_id": dataset_id,
        "total_resolved": n,
        "avg_days": avg_days,
        "median_days": median_days,
        "min_days": min(days_list),
        "max_days": max(days_list),
        "percentile_90": percentile_90,
    }


async def get_reopen_rate(db: AsyncSession, dataset_id: int) -> dict:
    """
    Reopen Rate Analysis — percentage of reopened bugs + details.
    """
    result = await db.execute(
        select(Defect).where(Defect.dataset_id == dataset_id)
    )
    defects = result.scalars().all()
    total = len(defects)

    reopened = [
        d for d in defects
        if d.status and d.status.strip().lower() in REOPEN_STATUSES
    ]
    reopened_count = len(reopened)

    # Also check lifecycle reopen_count > 0
    lc_result = await db.execute(
        select(func.count(DefectLifecycle.lifecycle_id))
        .join(Defect, DefectLifecycle.defect_id == Defect.defect_id)
        .where(Defect.dataset_id == dataset_id)
        .where(DefectLifecycle.reopen_count > 0)
    )
    lifecycle_reopened = lc_result.scalar() or 0

    # Use the higher of both counts
    effective_reopened = max(reopened_count, lifecycle_reopened)

    reopen_rate = round((effective_reopened / total) * 100, 2) if total > 0 else 0.0

    return {
        "dataset_id": dataset_id,
        "total_defects": total,
        "reopened_count": effective_reopened,
        "reopen_rate_percent": reopen_rate,
        "quality_indicator": (
            "Good" if reopen_rate < 5
            else "Acceptable" if reopen_rate < 15
            else "Needs Improvement" if reopen_rate < 30
            else "Critical"
        ),
    }


async def get_defect_leakage(db: AsyncSession, dataset_id: int) -> dict:
    """
    Defect Leakage Indicator — bugs found after release (production/UAT env).
    """
    result = await db.execute(
        select(Defect).where(Defect.dataset_id == dataset_id)
    )
    defects = result.scalars().all()
    total = len(defects)

    leaked = [
        d for d in defects
        if d.environment and d.environment.strip().lower() in PRODUCTION_ENVS
    ]
    leaked_count = len(leaked)
    leakage_rate = round((leaked_count / total) * 100, 2) if total > 0 else 0.0

    # Breakdown by environment
    env_breakdown: dict[str, int] = {}
    for d in leaked:
        env = d.environment.strip() if d.environment else "Unknown"
        env_breakdown[env] = env_breakdown.get(env, 0) + 1

    return {
        "dataset_id": dataset_id,
        "total_defects": total,
        "leaked_count": leaked_count,
        "leakage_rate_percent": leakage_rate,
        "environment_breakdown": [
            {"environment": k, "count": v}
            for k, v in sorted(env_breakdown.items(), key=lambda x: -x[1])
        ],
        "risk_level": (
            "Low" if leakage_rate < 5
            else "Medium" if leakage_rate < 15
            else "High" if leakage_rate < 30
            else "Critical"
        ),
    }
