"""Pydantic schemas for analytics endpoints."""

from pydantic import BaseModel
from datetime import datetime
from typing import Optional


# ─── Compute Response ────────────────────────────────────────────────

class ComputeAnalyticsResponse(BaseModel):
    message: str
    dataset_id: int
    lifecycle_records: int
    reopen_rate: Optional[float] = None
    avg_resolution_time: Optional[float] = None
    defect_leakage_rate: Optional[float] = None
    module_risks_computed: int


# ─── Defect Summary ─────────────────────────────────────────────────

class DefectSummaryResponse(BaseModel):
    dataset_id: int
    total: int
    open: int
    in_progress: int
    closed: int
    reopened: int
    unresolved: int


# ─── Severity Distribution ──────────────────────────────────────────

class SeverityItem(BaseModel):
    severity: str
    count: int
    percentage: float


class SeverityDistributionResponse(BaseModel):
    dataset_id: int
    distribution: list[SeverityItem]
    total: int


# ─── Resolution Time ────────────────────────────────────────────────

class ResolutionTimeResponse(BaseModel):
    dataset_id: int
    total_resolved: int
    avg_days: Optional[float] = None
    median_days: Optional[float] = None
    min_days: Optional[int] = None
    max_days: Optional[int] = None
    percentile_90: Optional[int] = None


# ─── Reopen Rate ────────────────────────────────────────────────────

class ReopenRateResponse(BaseModel):
    dataset_id: int
    total_defects: int
    reopened_count: int
    reopen_rate_percent: float
    quality_indicator: str


# ─── Defect Leakage ─────────────────────────────────────────────────

class EnvironmentBreakdownItem(BaseModel):
    environment: str
    count: int


class DefectLeakageResponse(BaseModel):
    dataset_id: int
    total_defects: int
    leaked_count: int
    leakage_rate_percent: float
    environment_breakdown: list[EnvironmentBreakdownItem]
    risk_level: str


# ─── Module Risk Scores ─────────────────────────────────────────────

class ModuleRiskItem(BaseModel):
    risk_id: int
    module_name: str
    bug_count: int
    reopen_rate: Optional[float] = None
    risk_score: Optional[float] = None
    risk_level: str
    computed_at: Optional[str] = None


class ModuleRiskResponse(BaseModel):
    dataset_id: int
    modules: list[ModuleRiskItem]
    total_modules: int


# ─── Lifecycle ───────────────────────────────────────────────────────

class StatusFlowItem(BaseModel):
    transition: str
    count: int


class LifecycleSummaryResponse(BaseModel):
    dataset_id: int
    total_tracked: int
    total_reopened: int
    avg_resolution_days: Optional[float] = None
    max_resolution_days: Optional[int] = None
    min_resolution_days: Optional[int] = None
    status_flow: list[StatusFlowItem]


class LifecycleDefectItem(BaseModel):
    lifecycle_id: int
    defect_id: int
    bug_id: Optional[str] = None
    title: Optional[str] = None
    module: Optional[str] = None
    current_status: Optional[str] = None
    from_status: Optional[str] = None
    to_status: Optional[str] = None
    changed_at: Optional[str] = None
    reopen_count: int = 0
    resolution_days: Optional[int] = None


class LifecycleDefectListResponse(BaseModel):
    dataset_id: int
    items: list[LifecycleDefectItem]
    total: int
    page: int
    page_size: int


# ─── Severity vs Resolution Time ────────────────────────────────────

class SeverityResolutionItem(BaseModel):
    severity: str
    count: int
    avg_resolution_days: Optional[float] = None
    min_resolution_days: Optional[int] = None
    max_resolution_days: Optional[int] = None


class SeverityResolutionResponse(BaseModel):
    dataset_id: int
    data: list[SeverityResolutionItem]
