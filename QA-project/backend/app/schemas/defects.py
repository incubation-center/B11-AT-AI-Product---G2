from pydantic import BaseModel
from datetime import datetime
from typing import Optional


# ─── Request Schemas ─────────────────────────────────────────────────

class DefectCreate(BaseModel):
    dataset_id: int
    bug_id: Optional[str] = None
    title: str
    module: Optional[str] = None
    severity: Optional[str] = None
    priority: Optional[str] = None
    environment: Optional[str] = None
    status: Optional[str] = None
    created_date: Optional[datetime] = None
    resolved_date: Optional[datetime] = None
    closed_date: Optional[datetime] = None


class DefectUpdate(BaseModel):
    bug_id: Optional[str] = None
    title: Optional[str] = None
    module: Optional[str] = None
    severity: Optional[str] = None
    priority: Optional[str] = None
    environment: Optional[str] = None
    status: Optional[str] = None
    created_date: Optional[datetime] = None
    resolved_date: Optional[datetime] = None
    closed_date: Optional[datetime] = None


# ─── Response Schemas ────────────────────────────────────────────────

class DefectResponse(BaseModel):
    defect_id: int
    dataset_id: int
    bug_id: Optional[str] = None
    title: str
    module: Optional[str] = None
    severity: Optional[str] = None
    priority: Optional[str] = None
    environment: Optional[str] = None
    status: Optional[str] = None
    created_date: Optional[datetime] = None
    resolved_date: Optional[datetime] = None
    closed_date: Optional[datetime] = None

    model_config = {"from_attributes": True}


class DefectListResponse(BaseModel):
    defects: list[DefectResponse]
    total: int
    page: int
    page_size: int
