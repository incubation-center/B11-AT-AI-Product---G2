import logging
from fastapi_mail import FastMail, MessageSchema, ConnectionConfig, MessageType
from app.config import settings

logger = logging.getLogger(__name__)

mail_config = ConnectionConfig(
    MAIL_USERNAME=settings.SMTP_USER,
    MAIL_PASSWORD=settings.SMTP_PASSWORD,
    MAIL_FROM=settings.SMTP_USER or "noreply@example.com",
    MAIL_PORT=settings.SMTP_PORT,
    MAIL_SERVER=settings.SMTP_HOST,
    MAIL_FROM_NAME=settings.SMTP_FROM_NAME,
    MAIL_STARTTLS=True,
    MAIL_SSL_TLS=False,
    USE_CREDENTIALS=bool(settings.SMTP_USER),
    VALIDATE_CERTS=True,
)

fast_mail = FastMail(mail_config)


async def send_otp_email(email: str, otp_code: str, purpose: str) -> None:
    """Send an OTP code to the user's email.
    Falls back to logging the OTP if SMTP is not configured or fails.
    """

    if purpose == "registration":
        subject = "Verify your email — QA Analytics"
        body = f"""
        <h2>Email Verification</h2>
        <p>Your OTP code is:</p>
        <h1 style="letter-spacing: 8px; font-size: 36px; color: #4F46E5;">{otp_code}</h1>
        <p>This code expires in {settings.OTP_EXPIRE_MINUTES} minutes.</p>
        <p>If you didn't request this, please ignore this email.</p>
        """
    else:
        subject = "Reset your password — QA Analytics"
        body = f"""
        <h2>Password Reset</h2>
        <p>Your OTP code is:</p>
        <h1 style="letter-spacing: 8px; font-size: 36px; color: #4F46E5;">{otp_code}</h1>
        <p>This code expires in {settings.OTP_EXPIRE_MINUTES} minutes.</p>
        <p>If you didn't request this, please ignore this email.</p>
        """

    message = MessageSchema(
        subject=subject,
        recipients=[email],
        body=body,
        subtype=MessageType.html,
    )

    try:
        await fast_mail.send_message(message)
        logger.info(f"OTP email sent to {email}")
    except Exception as e:
        # In development: log OTP to console so you can still test
        logger.warning(
            f"Failed to send email to {email}: {e}. "
            f"[DEV] OTP code for {purpose}: {otp_code}"
        )
