import random
import string
from datetime import datetime, timedelta, timezone
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from app.models.otp_codes import OTPCode
from app.config import settings


def generate_otp(length: int = 6) -> str:
    """Generate a random numeric OTP code."""
    return "".join(random.choices(string.digits, k=length))


async def create_otp(
    db: AsyncSession,
    email: str,
    purpose: str,  # "registration" or "reset_password"
) -> str:
    """Create and store a new OTP code for the given email and purpose."""
    otp_code = generate_otp()
    # Use naive UTC datetime to match TIMESTAMP WITHOUT TIME ZONE column
    expires_at = datetime.utcnow() + timedelta(minutes=settings.OTP_EXPIRE_MINUTES)

    otp = OTPCode(
        email=email,
        otp_code=otp_code,
        purpose=purpose,
        expires_at=expires_at,
    )
    db.add(otp)
    await db.flush()

    return otp_code


async def verify_otp(
    db: AsyncSession,
    email: str,
    otp_code: str,
    purpose: str,
) -> bool:
    """
    Verify an OTP code. Returns True if valid, False otherwise.
    Marks the OTP as used on success.
    """
    result = await db.execute(
        select(OTPCode).where(
            and_(
                OTPCode.email == email,
                OTPCode.otp_code == otp_code,
                OTPCode.purpose == purpose,
                OTPCode.is_used == 0,
                OTPCode.expires_at > datetime.utcnow(),
            )
        ).order_by(OTPCode.created_at.desc())
    )
    otp = result.scalar_one_or_none()

    if otp is None:
        return False

    # Mark as used
    otp.is_used = 1
    await db.flush()
    return True
