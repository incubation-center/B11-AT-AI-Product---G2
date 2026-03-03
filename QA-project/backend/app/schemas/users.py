from pydantic import BaseModel, EmailStr
from datetime import datetime
from typing import Optional


# ─── Request Schemas ─────────────────────────────────────────────────

class UpdateUserRole(BaseModel):
    role: str  # "user" | "admin"


class UpdateUserProfile(BaseModel):
    name: Optional[str] = None
    email: Optional[EmailStr] = None


# ─── Response Schemas ────────────────────────────────────────────────

class UserDetail(BaseModel):
    user_id: int
    name: str
    email: str
    role: str
    is_verified: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class UserListResponse(BaseModel):
    users: list[UserDetail]
    total: int
