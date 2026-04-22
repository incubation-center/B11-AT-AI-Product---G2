from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.models.users import User
from app.models.datasets import Dataset


async def check_dataset_access(
    db: AsyncSession, dataset_id: int, user: User
) -> Dataset:
    """Verify that a dataset exists and the requesting user has access.

    - Admins may access any dataset.
    - Regular users may only access datasets they own.

    Returns the Dataset ORM instance on success.

    Raises:
        HTTPException 404 – dataset not found.
        HTTPException 403 – user lacks permission.
    """
    result = await db.execute(
        select(Dataset).where(Dataset.dataset_id == dataset_id)
    )
    dataset = result.scalar_one_or_none()

    if not dataset:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Dataset not found",
        )

    if user.role != "admin" and dataset.user_id != user.user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied",
        )

    return dataset
