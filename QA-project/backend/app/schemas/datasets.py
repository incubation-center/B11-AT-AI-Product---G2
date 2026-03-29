from pydantic import BaseModel
from datetime import datetime
from typing import Optional


# ─── Response Schemas ────────────────────────────────────────────────

class DatasetResponse(BaseModel):
    dataset_id: int
    user_id: int
    file_name: str
    file_type: str
    upload_type: str
    uploaded_at: datetime
    defect_count: Optional[int] = None

    model_config = {"from_attributes": True}


class DatasetListResponse(BaseModel):
    datasets: list[DatasetResponse]
    total: int


class DatasetUploadResponse(BaseModel):
    dataset: DatasetResponse
    defects_imported: int
    message: str


class ColumnMappingRequest(BaseModel):
    """Optional column mapping when CSV/Excel headers don't match defaults."""
    bug_id: Optional[str] = None
    title: Optional[str] = None
    module: Optional[str] = None
    severity: Optional[str] = None
    priority: Optional[str] = None
    environment: Optional[str] = None
    status: Optional[str] = None
    created_date: Optional[str] = None
    resolved_date: Optional[str] = None
    closed_date: Optional[str] = None


class GenerateFromGithubRequest(BaseModel):
    clone_url: str
    branch: Optional[str] = None
    max_files: int = 20
    max_defects: int = 50
