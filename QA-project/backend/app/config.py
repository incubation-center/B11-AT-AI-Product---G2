import os
from dotenv import load_dotenv

load_dotenv()


class Settings:
    DATABASE_URL: str = os.getenv("DATABASE_URL", "")
    # Convert postgres:// to postgresql+asyncpg:// for SQLAlchemy async
    ASYNC_DATABASE_URL: str = DATABASE_URL.replace(
        "postgresql://", "postgresql+asyncpg://"
    )
    SYNC_DATABASE_URL: str = DATABASE_URL.replace(
        "postgresql://", "postgresql+psycopg2://"
    )

    PINECONE_API_KEY: str = os.getenv("PINECONE_API_KEY", "")
    PINECONE_INDEX_NAME: str = os.getenv("PINECONE_INDEX_NAME", "qa-ai-documents")

    # CORS
    CORS_ORIGINS: list[str] = [
        "http://localhost:3000",  # Next.js frontend
    ]

    # JWT
    SECRET_KEY: str = os.getenv("SECRET_KEY", "change-me-in-production")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60

    # Email / SMTP
    SMTP_HOST: str = os.getenv("SMTP_HOST", "smtp.gmail.com")
    SMTP_PORT: int = int(os.getenv("SMTP_PORT", "587"))
    SMTP_USER: str = os.getenv("SMTP_USER", "")
    SMTP_PASSWORD: str = os.getenv("SMTP_PASSWORD", "")
    SMTP_FROM_NAME: str = os.getenv("SMTP_FROM_NAME", "QA Analytics")

    # OTP
    OTP_EXPIRE_MINUTES: int = int(os.getenv("OTP_EXPIRE_MINUTES", "5"))


settings = Settings()
