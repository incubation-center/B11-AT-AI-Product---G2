from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession


from app.database import get_db
from app.models.users import User
from app.dependencies.auth import get_current_user
from app.dependencies.authorization import check_dataset_access
from app.services.lifecycle_service import (
    compute_lifecycle_for_dataset,
    get_lifecycle_summary,
    get_lifecycle_per_defect,
    get_severity_vs_resolution,
)
from app.services.analytics_service import (
    compute_analytics,
    get_summary,
    get_severity_distribution,
    get_resolution_time_stats,
    get_reopen_rate,
    get_defect_leakage,
)
from app.services.risk_service import compute_module_risks, get_module_risks
from app.services.log_service import log_activity
from app.schemas.analytics import (
    ComputeAnalyticsResponse,
    DefectSummaryResponse,
    SeverityDistributionResponse,
    SeverityItem,
    ResolutionTimeResponse,
    ReopenRateResponse,
    DefectLeakageResponse,
    EnvironmentBreakdownItem,
    ModuleRiskResponse,
    ModuleRiskItem,
    LifecycleSummaryResponse,
    StatusFlowItem,
    LifecycleDefectListResponse,
    LifecycleDefectItem,
    SeverityResolutionResponse,
    SeverityResolutionItem,
)

router = APIRouter(prefix="/analytics", tags=["Analytics"])


# ─── Compute all analytics for a dataset ─────────────────────────────

@router.post("/compute/{dataset_id}", response_model=ComputeAnalyticsResponse)
async def compute_dataset_analytics(
    dataset_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Trigger computation of all analytics for a dataset:
      1. Lifecycle records (status transitions, resolution days, reopen detection)
      2. Aggregate analytics (reopen rate, avg resolution, leakage rate)
      3. Module risk scores
    """
    await check_dataset_access(db, dataset_id, current_user)

    # Step 1: Lifecycle
    lifecycle_count = await compute_lifecycle_for_dataset(db, dataset_id)

    # Step 2: Analytics
    analytics = await compute_analytics(db, dataset_id)

    # Step 3: Module risks
    risks = await compute_module_risks(db, dataset_id)

    await log_activity(db, current_user.user_id, f"Computed analytics for dataset {dataset_id}")

    return ComputeAnalyticsResponse(
        message=f"Analytics computed successfully for dataset {dataset_id}",
        dataset_id=dataset_id,
        lifecycle_records=lifecycle_count,
        reopen_rate=analytics.reopen_rate,
        avg_resolution_time=analytics.avg_resolution_time,
        defect_leakage_rate=analytics.defect_leakage_rate,
        module_risks_computed=len(risks),
    )


# ─── Defect Summary Overview ────────────────────────────────────────

@router.get("/{dataset_id}/summary", response_model=DefectSummaryResponse)
async def get_defect_summary(
    dataset_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Show total bugs, open, closed, reopened (main dashboard card)."""
    await check_dataset_access(db, dataset_id, current_user)
    data = await get_summary(db, dataset_id)
    return DefectSummaryResponse(**data)


# ─── Severity Distribution ──────────────────────────────────────────

@router.get("/{dataset_id}/severity", response_model=SeverityDistributionResponse)
async def get_severity_dist(
    dataset_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Show bug count by severity (pie or bar chart data)."""
    await check_dataset_access(db, dataset_id, current_user)
    dist = await get_severity_distribution(db, dataset_id)
    total = sum(item["count"] for item in dist)
    return SeverityDistributionResponse(
        dataset_id=dataset_id,
        distribution=[SeverityItem(**item) for item in dist],
        total=total,
    )


# ─── Resolution Time Analysis ───────────────────────────────────────

@router.get("/{dataset_id}/resolution-time", response_model=ResolutionTimeResponse)
async def get_resolution_time(
    dataset_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Show average bug fix time (based on lifecycle data)."""
    await check_dataset_access(db, dataset_id, current_user)
    data = await get_resolution_time_stats(db, dataset_id)
    return ResolutionTimeResponse(**data)


# ─── Reopen Rate Analysis ───────────────────────────────────────────

@router.get("/{dataset_id}/reopen-rate", response_model=ReopenRateResponse)
async def get_reopen_rate_endpoint(
    dataset_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Show percentage of reopened bugs (quality indicator)."""
    await check_dataset_access(db, dataset_id, current_user)
    data = await get_reopen_rate(db, dataset_id)
    return ReopenRateResponse(**data)


# ─── Defect Leakage Indicator ───────────────────────────────────────

@router.get("/{dataset_id}/leakage", response_model=DefectLeakageResponse)
async def get_leakage(
    dataset_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Show bugs found after release (based on environment field)."""
    await check_dataset_access(db, dataset_id, current_user)
    data = await get_defect_leakage(db, dataset_id)
    return DefectLeakageResponse(
        dataset_id=data["dataset_id"],
        total_defects=data["total_defects"],
        leaked_count=data["leaked_count"],
        leakage_rate_percent=data["leakage_rate_percent"],
        environment_breakdown=[EnvironmentBreakdownItem(**e) for e in data["environment_breakdown"]],
        risk_level=data["risk_level"],
    )


# ─── Module Risk Scores ─────────────────────────────────────────────

@router.get("/{dataset_id}/module-risks", response_model=ModuleRiskResponse)
async def get_module_risks_endpoint(
    dataset_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Show high-risk modules based on bug count & reopen rate."""
    await check_dataset_access(db, dataset_id, current_user)
    data = await get_module_risks(db, dataset_id)
    return ModuleRiskResponse(
        dataset_id=dataset_id,
        modules=[ModuleRiskItem(**item) for item in data],
        total_modules=len(data),
    )


# ─── Lifecycle Summary ──────────────────────────────────────────────

@router.get("/{dataset_id}/lifecycle", response_model=LifecycleSummaryResponse)
async def get_lifecycle(
    dataset_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Lifecycle summary: reopen count, resolution stats, status flow."""
    await check_dataset_access(db, dataset_id, current_user)
    data = await get_lifecycle_summary(db, dataset_id)
    return LifecycleSummaryResponse(
        dataset_id=dataset_id,
        total_tracked=data["total_tracked"],
        total_reopened=data["total_reopened"],
        avg_resolution_days=data["avg_resolution_days"],
        max_resolution_days=data["max_resolution_days"],
        min_resolution_days=data["min_resolution_days"],
        status_flow=[StatusFlowItem(**f) for f in data["status_flow"]],
    )


# ─── Lifecycle per Defect ───────────────────────────────────────────

@router.get("/{dataset_id}/lifecycle/defects", response_model=LifecycleDefectListResponse)
async def get_lifecycle_defects(
    dataset_id: int,
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=200),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Paginated lifecycle records for individual defects."""
    await check_dataset_access(db, dataset_id, current_user)
    data = await get_lifecycle_per_defect(db, dataset_id, page, page_size)
    return LifecycleDefectListResponse(
        dataset_id=dataset_id,
        items=[LifecycleDefectItem(**item) for item in data["items"]],
        total=data["total"],
        page=data["page"],
        page_size=data["page_size"],
    )


# ─── Severity vs Resolution Time ────────────────────────────────────

@router.get("/{dataset_id}/severity-resolution", response_model=SeverityResolutionResponse)
async def get_sev_resolution(
    dataset_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Compare fix time by severity level (prioritize resources)."""
    await check_dataset_access(db, dataset_id, current_user)
    data = await get_severity_vs_resolution(db, dataset_id)
    return SeverityResolutionResponse(
        dataset_id=dataset_id,
        data=[SeverityResolutionItem(**item) for item in data],
    )
