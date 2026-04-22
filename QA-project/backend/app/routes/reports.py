import logging
from pathlib import Path

from fastapi import APIRouter, Depends, HTTPException, status, Response
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.users import User
from app.dependencies.auth import get_current_user
from app.dependencies.authorization import check_dataset_access
from app.services.report_service import generate_report, list_reports, get_report_by_id, get_s3_client
from app.services.log_service import log_activity
from app.schemas.reports import (
    GenerateReportRequest,
    GenerateReportResponse,
    ReportMeta,
    ReportListResponse,
)

router = APIRouter(prefix="/reports", tags=["Reports"])
logger = logging.getLogger(__name__)


@router.post("/generate", response_model=GenerateReportResponse)
async def generate_report_endpoint(
    body: GenerateReportRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Generate a report (PDF, CSV, or Excel) for a dataset."""
    await check_dataset_access(db, body.dataset_id, current_user)

    try:
        report = await generate_report(
            db=db,
            user_id=current_user.user_id,
            dataset_id=body.dataset_id,
            report_format=body.format.value,
        )
        await db.commit()

        await log_activity(
            db, current_user.user_id,
            f"Generated {body.format.value.upper()} report for dataset {body.dataset_id}",
        )

        file_name = Path(report.file_path).name if report.file_path else "report"
        return GenerateReportResponse(
            message=f"{body.format.value.upper()} report generated successfully",
            report=ReportMeta(
                report_id=report.report_id,
                dataset_id=report.dataset_id,
                report_type=report.report_type,
                file_name=file_name,
                generated_at=str(report.generated_at),
            ),
        )
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception:
        await db.rollback()
        logger.exception("Report generation failed")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Report generation failed",
        )


@router.get("/{dataset_id}", response_model=ReportListResponse)
async def get_reports(
    dataset_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List all reports for a dataset."""
    await check_dataset_access(db, dataset_id, current_user)

    reports = await list_reports(db, dataset_id)
    return ReportListResponse(
        dataset_id=dataset_id,
        reports=[
            ReportMeta(
                report_id=r.report_id,
                dataset_id=r.dataset_id,
                report_type=r.report_type,
                file_name=Path(r.file_path).name if r.file_path else "unknown",
                generated_at=str(r.generated_at),
            )
            for r in reports
        ],
        total=len(reports),
    )


@router.get("/download/{report_id}")
async def download_report(
    report_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Download a generated report file for the authenticated user."""

    report = await get_report_by_id(db, report_id)
    if not report:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Report not found")

    # Access check
    if current_user.role != "admin" and report.user_id != current_user.user_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")

    if not report.file_path:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Report file path not found in database",
        )

    media_types = {
        "pdf": "application/pdf",
        "csv": "text/csv",
        "excel": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    }
    media_type = media_types.get(report.report_type, "application/octet-stream")
    file_name = report.file_path

    try:
        s3 = get_s3_client()
        # Fetch object content
        response = s3.get_object(Bucket='reports', Key=file_name)
        res = response['Body'].read()
    except Exception as e:
        logger.error(f"Failed to download from Supabase S3 Storage: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Could not download file from storage.")

    return Response(
        content=res,
        media_type=media_type,
        headers={"Content-Disposition": f'attachment; filename="{file_name}"'},
    )
