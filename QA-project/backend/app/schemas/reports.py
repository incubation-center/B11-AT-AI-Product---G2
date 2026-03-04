"""Pydantic schemas for report endpoints."""

from pydantic import BaseModel
from datetime import datetime
from typing import Optional
from enum import Enum


class ReportFormat(str, Enum):
    pdf = "pdf"
    csv = "csv"
    excel = "excel"


# ─── Request ─────────────────────────────────────────────────────────

class GenerateReportRequest(BaseModel):
    dataset_id: int
    format: ReportFormat = ReportFormat.pdf


# ─── Response ────────────────────────────────────────────────────────

class ReportMeta(BaseModel):
    report_id: int
    dataset_id: int
    report_type: str
    file_name: str
    generated_at: str

    class Config:
        from_attributes = True


class GenerateReportResponse(BaseModel):
    message: str
    report: ReportMeta


class ReportListResponse(BaseModel):
    dataset_id: int
    reports: list[ReportMeta]
    total: int
