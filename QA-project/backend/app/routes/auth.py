from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database import get_db
from app.config import settings
from app.models.users import User
from app.schemas.auth import (
    UserRegister,
    VerifyOTP,
    UserLogin,
    ForgotPasswordRequest,
    ResetPasswordRequest,
    UserResponse,
    AuthResponse,
    MessageResponse,
)
from app.services.auth_service import hash_password, verify_password, create_access_token
from app.services.otp_service import create_otp, verify_otp
from app.services.email_service import send_otp_email
from app.dependencies.auth import get_current_user

router = APIRouter(prefix="/auth", tags=["Authentication"])


def _set_auth_cookie(response: Response, access_token: str) -> None:
    response.set_cookie(
        key=settings.AUTH_COOKIE_NAME,
        value=access_token,
        httponly=True,
        secure=settings.COOKIE_SECURE,
        samesite=settings.COOKIE_SAMESITE,
        max_age=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        path="/",
    )


# ─── Registration (2-step: register → verify OTP) ───────────────────

@router.post("/register", response_model=MessageResponse, status_code=status.HTTP_201_CREATED)
async def register(body: UserRegister, db: AsyncSession = Depends(get_db)):
    """Step 1: Register a new user and send OTP to their email."""

    # Check if email already exists and is verified
    result = await db.execute(select(User).where(User.email == body.email))
    existing_user = result.scalar_one_or_none()
    if existing_user and existing_user.is_verified:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Email already registered",
        )

    if existing_user and not existing_user.is_verified:
        # Update existing unverified user's details
        existing_user.name = body.name
        existing_user.password_hash = hash_password(body.password)
    else:
        # Create unverified user
        new_user = User(
            name=body.name,
            email=body.email,
            password_hash=hash_password(body.password),
            role="user",
        )
        db.add(new_user)

    await db.flush()

    # Generate and send OTP
    otp_code = await create_otp(db, body.email, purpose="registration")
    await send_otp_email(body.email, otp_code, purpose="registration")

    return MessageResponse(message="OTP sent to your email. Please verify to complete registration.")


@router.post("/verify-registration", response_model=AuthResponse)
async def verify_registration(
    body: VerifyOTP,
    response: Response,
    db: AsyncSession = Depends(get_db),
):
    """Step 2: Verify OTP to activate the account."""

    # Verify OTP
    is_valid = await verify_otp(db, body.email, body.otp_code, purpose="registration")
    if not is_valid:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired OTP",
        )

    # Activate user
    result = await db.execute(select(User).where(User.email == body.email))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )

    user.is_verified = True
    await db.flush()
    await db.refresh(user)

    # Generate token
    access_token = create_access_token(data={"user_id": user.user_id, "email": user.email})
    _set_auth_cookie(response, access_token)

    return AuthResponse(
        user=UserResponse.model_validate(user),
    )


# ─── Login ───────────────────────────────────────────────────────────

@router.post("/login", response_model=AuthResponse)
async def login(
    body: UserLogin,
    response: Response,
    db: AsyncSession = Depends(get_db),
):
    """Login with email and password. Account must be verified."""

    result = await db.execute(select(User).where(User.email == body.email))
    user = result.scalar_one_or_none()

    if not user or not verify_password(body.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    if not user.is_verified:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Email not verified. Please verify your email first.",
        )

    access_token = create_access_token(data={"user_id": user.user_id, "email": user.email})
    _set_auth_cookie(response, access_token)

    return AuthResponse(
        user=UserResponse.model_validate(user),
    )


# ─── Forgot / Reset Password (2-step: request OTP → reset) ──────────

@router.post("/forgot-password", response_model=MessageResponse)
async def forgot_password(body: ForgotPasswordRequest, db: AsyncSession = Depends(get_db)):
    """Step 1: Send an OTP to the user's email for password reset."""

    result = await db.execute(select(User).where(User.email == body.email))
    user = result.scalar_one_or_none()

    if not user:
        # Don't reveal whether the email exists
        return MessageResponse(message="If this email is registered, you will receive an OTP.")

    otp_code = await create_otp(db, body.email, purpose="reset_password")
    await send_otp_email(body.email, otp_code, purpose="reset_password")

    return MessageResponse(message="If this email is registered, you will receive an OTP.")


@router.post("/reset-password", response_model=MessageResponse)
async def reset_password(body: ResetPasswordRequest, db: AsyncSession = Depends(get_db)):
    """Step 2: Verify OTP and set a new password."""

    # Verify OTP
    is_valid = await verify_otp(db, body.email, body.otp_code, purpose="reset_password")
    if not is_valid:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired OTP",
        )

    # Update password
    result = await db.execute(select(User).where(User.email == body.email))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )

    user.password_hash = hash_password(body.new_password)
    await db.flush()

    return MessageResponse(message="Password reset successfully. You can now login with your new password.")


# ─── Resend OTP ──────────────────────────────────────────────────────

@router.post("/resend-otp", response_model=MessageResponse)
async def resend_otp(body: ForgotPasswordRequest, db: AsyncSession = Depends(get_db)):
    """Resend OTP for registration verification (uses email field)."""

    result = await db.execute(select(User).where(User.email == body.email))
    user = result.scalar_one_or_none()

    if not user:
        return MessageResponse(message="If this email is registered, you will receive an OTP.")

    purpose = "registration" if not user.is_verified else "reset_password"
    otp_code = await create_otp(db, body.email, purpose=purpose)
    await send_otp_email(body.email, otp_code, purpose=purpose)

    return MessageResponse(message="OTP has been resent to your email.")


# ─── Current User ────────────────────────────────────────────────────

@router.get("/me", response_model=UserResponse)
async def get_me(current_user: User = Depends(get_current_user)):
    """Get the currently authenticated user's profile."""
    return UserResponse.model_validate(current_user)


@router.post("/logout", response_model=MessageResponse)
async def logout(response: Response):
    """Clear the auth session cookie."""
    response.delete_cookie(
        settings.AUTH_COOKIE_NAME, 
        path="/",
        secure=settings.COOKIE_SECURE,
        samesite=settings.COOKIE_SAMESITE,
    )
    return MessageResponse(message="Logged out successfully")
