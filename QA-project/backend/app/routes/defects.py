from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from typing import Optional

from app.database import get_db
from app.models.users import User
from app.models.defects import Defect
from app.models.datasets import Dataset
from app.dependencies.auth import get_current_user
from app.schemas.defects import DefectResponse, DefectListResponse, DefectCreate, DefectUpdate

router = APIRouter(prefix="/defects", tags=["Defects"])


async def _check_dataset_access(db: AsyncSession, dataset_id: int, user: User) -> Dataset:
    """Verify the dataset exists and the user has access."""
    result = await db.execute(select(Dataset).where(Dataset.dataset_id == dataset_id))
    dataset = result.scalar_one_or_none()
    if not dataset:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Dataset not found")
    if user.role != "admin" and dataset.user_id != user.user_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")
    return dataset


# ─── List defects (with filter + pagination) ─────────────────────────

@router.get("/", response_model=DefectListResponse)
async def list_defects(
    dataset_id: int = Query(..., description="Filter by dataset ID"),
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=200),
    module: Optional[str] = Query(None),
    severity: Optional[str] = Query(None),
    priority: Optional[str] = Query(None),
    status_filter: Optional[str] = Query(None, alias="status"),
    search: Optional[str] = Query(None, description="Search in title or bug_id"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List defects for a given dataset with optional filtering and pagination."""
    await _check_dataset_access(db, dataset_id, current_user)

    query = select(Defect).where(Defect.dataset_id == dataset_id)
    count_query = select(func.count(Defect.defect_id)).where(Defect.dataset_id == dataset_id)

    # Apply filters
    if module:
        query = query.where(Defect.module.ilike(f"%{module}%"))
        count_query = count_query.where(Defect.module.ilike(f"%{module}%"))
    if severity:
        query = query.where(Defect.severity.ilike(severity))
        count_query = count_query.where(Defect.severity.ilike(severity))
    if priority:
        query = query.where(Defect.priority.ilike(priority))
        count_query = count_query.where(Defect.priority.ilike(priority))
    if status_filter:
        query = query.where(Defect.status.ilike(status_filter))
        count_query = count_query.where(Defect.status.ilike(status_filter))
    if search:
        pattern = f"%{search}%"
        query = query.where(Defect.title.ilike(pattern) | Defect.bug_id.ilike(pattern))
        count_query = count_query.where(Defect.title.ilike(pattern) | Defect.bug_id.ilike(pattern))

    total_result = await db.execute(count_query)
    total = total_result.scalar() or 0

    query = query.order_by(Defect.defect_id.desc()).offset((page - 1) * page_size).limit(page_size)
    result = await db.execute(query)
    defects = result.scalars().all()

    return DefectListResponse(
        defects=[DefectResponse.model_validate(d) for d in defects],
        total=total,
        page=page,
        page_size=page_size,
    )


# ─── Get single defect ──────────────────────────────────────────────

@router.get("/{defect_id}", response_model=DefectResponse)
async def get_defect(
    defect_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get a specific defect by ID."""
    result = await db.execute(select(Defect).where(Defect.defect_id == defect_id))
    defect = result.scalar_one_or_none()
    if not defect:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Defect not found")

    # Check dataset access
    await _check_dataset_access(db, defect.dataset_id, current_user)

    return DefectResponse.model_validate(defect)


# ─── Create defect manually ─────────────────────────────────────────

@router.post("/", response_model=DefectResponse, status_code=status.HTTP_201_CREATED)
async def create_defect(
    body: DefectCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Manually create a defect within a dataset."""
    await _check_dataset_access(db, body.dataset_id, current_user)

    defect = Defect(**body.model_dump())
    db.add(defect)
    await db.flush()
    await db.refresh(defect)
    return DefectResponse.model_validate(defect)


# ─── Update defect ──────────────────────────────────────────────────

@router.patch("/{defect_id}", response_model=DefectResponse)
async def update_defect(
    defect_id: int,
    body: DefectUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Update a defect's fields."""
    result = await db.execute(select(Defect).where(Defect.defect_id == defect_id))
    defect = result.scalar_one_or_none()
    if not defect:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Defect not found")

    await _check_dataset_access(db, defect.dataset_id, current_user)

    update_data = body.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(defect, field, value)

    await db.flush()
    await db.refresh(defect)
    return DefectResponse.model_validate(defect)


# ─── Delete defect ──────────────────────────────────────────────────

@router.delete("/{defect_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_defect(
    defect_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Delete a single defect."""
    result = await db.execute(select(Defect).where(Defect.defect_id == defect_id))
    defect = result.scalar_one_or_none()
    if not defect:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Defect not found")

    await _check_dataset_access(db, defect.dataset_id, current_user)

    await db.delete(defect)
    await db.flush()
