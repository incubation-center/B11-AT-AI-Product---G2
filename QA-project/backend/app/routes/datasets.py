from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from typing import Optional

from app.database import get_db
from app.models.users import User
from app.models.datasets import Dataset
from app.models.defects import Defect
from app.dependencies.auth import get_current_user
from app.schemas.datasets import DatasetResponse, DatasetListResponse, DatasetUploadResponse, GenerateFromGithubRequest
from app.services.dataset_service import parse_and_import
from app.services.github_to_dataset_service import generate_dataset_from_github
from app.services.log_service import log_activity

router = APIRouter(prefix="/datasets", tags=["Datasets"])

ALLOWED_EXTENSIONS = {".csv", ".xlsx", ".xls"}


# ─── Upload dataset ─────────────────────────────────────────────────

@router.post("/upload", response_model=DatasetUploadResponse, status_code=status.HTTP_201_CREATED)
async def upload_dataset(
    file: UploadFile = File(...),
    upload_type: str = Form("manual", description="manual | jira | azure_devops"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Upload a CSV or Excel file to create a dataset and import defects."""

    # Validate file
    if not file.filename:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No file uploaded")

    ext = "." + file.filename.rsplit(".", 1)[-1].lower() if "." in file.filename else ""
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported file extension '{ext}'. Allowed: {', '.join(ALLOWED_EXTENSIONS)}",
        )

    file_bytes = await file.read()
    if len(file_bytes) == 0:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Uploaded file is empty")

    # 10 MB max
    if len(file_bytes) > 10 * 1024 * 1024:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="File too large (max 10 MB)")

    try:
        dataset, defect_count = await parse_and_import(
            db=db,
            user_id=current_user.user_id,
            file_name=file.filename,
            file_bytes=file_bytes,
            file_type=ext.lstrip("."),
            upload_type=upload_type,
        )
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(e))

    await log_activity(db, current_user.user_id, f"Uploaded dataset '{file.filename}' ({defect_count} defects)")

    resp = DatasetResponse(
        dataset_id=dataset.dataset_id,
        user_id=dataset.user_id,
        file_name=dataset.file_name,
        file_type=dataset.file_type,
        upload_type=dataset.upload_type,
        uploaded_at=dataset.uploaded_at,
        defect_count=defect_count,
    )

    return DatasetUploadResponse(
        dataset=resp,
        defects_imported=defect_count,
        message=f"Successfully imported {defect_count} defects from '{file.filename}'",
    )


@router.post(
    "/generate-from-github",
    response_model=DatasetUploadResponse,
    status_code=status.HTTP_201_CREATED,
)
async def generate_from_github(
    body: GenerateFromGithubRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Generate a testcase document from a GitHub repository URL.

    Note: This creates a Dataset + related Defect rows so it appears in the app
    as a "Testcase Document".
    """
    try:
        dataset, defect_count = await generate_dataset_from_github(
            db=db,
            user_id=current_user.user_id,
            clone_url=body.clone_url,
            branch=body.branch,
            max_files=body.max_files,
            max_defects=body.max_defects,
        )
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(e))

    await log_activity(
        db,
        current_user.user_id,
        f"Generated dataset from GitHub '{body.clone_url}' ({defect_count} testcases)",
    )

    resp = DatasetResponse(
        dataset_id=dataset.dataset_id,
        user_id=dataset.user_id,
        file_name=dataset.file_name,
        file_type=dataset.file_type,
        upload_type=dataset.upload_type,
        uploaded_at=dataset.uploaded_at,
        defect_count=defect_count,
    )

    return DatasetUploadResponse(
        dataset=resp,
        defects_imported=defect_count,
        message=f"Successfully generated {defect_count} test cases from '{body.clone_url}'",
    )


# ─── List datasets ──────────────────────────────────────────────────

@router.get("/", response_model=DatasetListResponse)
async def list_datasets(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List datasets belonging to the current user (admins see all)."""

    base = select(Dataset)
    count_base = select(func.count(Dataset.dataset_id))

    if current_user.role != "admin":
        base = base.where(Dataset.user_id == current_user.user_id)
        count_base = count_base.where(Dataset.user_id == current_user.user_id)

    total_result = await db.execute(count_base)
    total = total_result.scalar() or 0

    query = base.order_by(Dataset.uploaded_at.desc()).offset((page - 1) * page_size).limit(page_size)
    result = await db.execute(query)
    datasets = result.scalars().all()

    # Attach defect counts
    items: list[DatasetResponse] = []
    for ds in datasets:
        cnt_result = await db.execute(
            select(func.count(Defect.defect_id)).where(Defect.dataset_id == ds.dataset_id)
        )
        cnt = cnt_result.scalar() or 0
        items.append(DatasetResponse(
            dataset_id=ds.dataset_id,
            user_id=ds.user_id,
            file_name=ds.file_name,
            file_type=ds.file_type,
            upload_type=ds.upload_type,
            uploaded_at=ds.uploaded_at,
            defect_count=cnt,
        ))

    return DatasetListResponse(datasets=items, total=total)


# ─── Get single dataset ─────────────────────────────────────────────

@router.get("/{dataset_id}", response_model=DatasetResponse)
async def get_dataset(
    dataset_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get a single dataset by ID."""
    result = await db.execute(select(Dataset).where(Dataset.dataset_id == dataset_id))
    dataset = result.scalar_one_or_none()
    if not dataset:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Dataset not found")

    if current_user.role != "admin" and dataset.user_id != current_user.user_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")

    cnt_result = await db.execute(
        select(func.count(Defect.defect_id)).where(Defect.dataset_id == dataset_id)
    )
    cnt = cnt_result.scalar() or 0

    return DatasetResponse(
        dataset_id=dataset.dataset_id,
        user_id=dataset.user_id,
        file_name=dataset.file_name,
        file_type=dataset.file_type,
        upload_type=dataset.upload_type,
        uploaded_at=dataset.uploaded_at,
        defect_count=cnt,
    )


# ─── Delete dataset ─────────────────────────────────────────────────

@router.delete("/{dataset_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_dataset(
    dataset_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Delete a dataset and all its associated defects (cascade)."""
    result = await db.execute(select(Dataset).where(Dataset.dataset_id == dataset_id))
    dataset = result.scalar_one_or_none()
    if not dataset:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Dataset not found")

    if current_user.role != "admin" and dataset.user_id != current_user.user_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")

    await db.delete(dataset)
    await db.flush()
    await log_activity(db, current_user.user_id, f"Deleted dataset {dataset_id} ('{dataset.file_name}')")
