from sqlalchemy import Column, Integer, String, DateTime, func
from app.database import Base


class OTPCode(Base):
    __tablename__ = "otp_codes"

    otp_id = Column(Integer, primary_key=True, autoincrement=True)
    email = Column(String(255), nullable=False, index=True)
    otp_code = Column(String(6), nullable=False)
    purpose = Column(String(50), nullable=False)  # "registration" or "reset_password"
    expires_at = Column(DateTime, nullable=False)
    is_used = Column(Integer, nullable=False, server_default="0")  # 0=unused, 1=used
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
