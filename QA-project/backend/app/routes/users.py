from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from app.database import get_db
from app.models.users import User
from app.dependencies.auth import get_current_user
from app.schemas.users import UserDetail, UserListResponse, UpdateUserRole, UpdateUserProfile
from app.services.log_service import log_activity
from app.services.otp_service import create_otp

router = APIRouter(prefix="/users", tags=["Users"])


def _require_admin(current_user: User):
    """Raise 403 if the current user is not an admin."""
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required",
        )


# ─── List users (admin) ─────────────────────────────────────────────

@router.get("/", response_model=UserListResponse)
async def list_users(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    search: str = Query("", description="Search by name or email"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List all users (admin only)."""
    _require_admin(current_user)

    query = select(User)
    count_query = select(func.count(User.user_id))

    if search:
        pattern = f"%{search}%"
        query = query.where(User.name.ilike(pattern) | User.email.ilike(pattern))
        count_query = count_query.where(User.name.ilike(pattern) | User.email.ilike(pattern))

    total_result = await db.execute(count_query)
    total = total_result.scalar() or 0

    query = query.order_by(User.created_at.desc()).offset((page - 1) * page_size).limit(page_size)
    result = await db.execute(query)
    users = result.scalars().all()

    return UserListResponse(
        users=[UserDetail.model_validate(u) for u in users],
        total=total,
    )


# ─── Get user by ID ─────────────────────────────────────────────────

@router.get("/{user_id}", response_model=UserDetail)
async def get_user(
    user_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get a user by ID. Admins can view any user; regular users can only view themselves."""
    if current_user.role != "admin" and current_user.user_id != user_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")

    result = await db.execute(select(User).where(User.user_id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    return UserDetail.model_validate(user)


# ─── Update user profile (self) ─────────────────────────────────────

@router.patch("/me", response_model=UserDetail)
async def update_my_profile(
    body: UpdateUserProfile,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Update the current user's own profile (name, email)."""
    if body.name is not None:
        current_user.name = body.name
    if body.email is not None:
        # Check uniqueness
        existing = await db.execute(select(User).where(User.email == body.email, User.user_id != current_user.user_id))
        if existing.scalar_one_or_none():
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email already taken")
        current_user.email = body.email

    await db.flush()
    await db.refresh(current_user)
    await log_activity(db, current_user.user_id, "Updated own profile")
    return UserDetail.model_validate(current_user)

@router.get("/me/telegram-link-code")
async def get_telegram_link_code(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Generate a 6-digit code for linking the user's account to Telegram.
    Returns the code, which the user should type in Telegram: /link <code>
    """
    code = await create_otp(db, current_user.email, "telegram_link")
    await db.commit()
    return {"code": code}


# ─── Update user role (admin) ───────────────────────────────────────

@router.patch("/{user_id}/role", response_model=UserDetail)
async def update_user_role(
    user_id: int,
    body: UpdateUserRole,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Change a user's role (admin only)."""
    _require_admin(current_user)

    if body.role not in ("user", "admin"):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Role must be 'user' or 'admin'")

    result = await db.execute(select(User).where(User.user_id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    user.role = body.role
    await db.flush()
    await db.refresh(user)
    await log_activity(db, current_user.user_id, f"Changed user {user_id} role to '{body.role}'")
    return UserDetail.model_validate(user)


# ─── Delete user (admin) ────────────────────────────────────────────

@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_user(
    user_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Delete a user (admin only). Cannot delete yourself."""
    _require_admin(current_user)

    if current_user.user_id == user_id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Cannot delete yourself")

    result = await db.execute(select(User).where(User.user_id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    await db.delete(user)
    await db.flush()
    await log_activity(db, current_user.user_id, f"Deleted user {user_id} ({user.email})")
