from pydantic import BaseModel, EmailStr
from datetime import datetime


# ─── Request Schemas ─────────────────────────────────────────────────

class UserRegister(BaseModel):
    name: str
    email: EmailStr
    password: str


class VerifyOTP(BaseModel):
    email: EmailStr
    otp_code: str


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ResetPasswordRequest(BaseModel):
    email: EmailStr
    otp_code: str
    new_password: str


# ─── Response Schemas ────────────────────────────────────────────────

class UserResponse(BaseModel):
    user_id: int
    name: str
    email: str
    role: str
    is_verified: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class AuthResponse(BaseModel):
    user: UserResponse
    token: TokenResponse


class MessageResponse(BaseModel):
    message: str
