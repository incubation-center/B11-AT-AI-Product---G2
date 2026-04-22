import os
from dotenv import load_dotenv

load_dotenv()


class Settings:
    DATABASE_URL: str = os.getenv("DATABASE_URL", "")

    # Debug mode — controls SQL echo, verbose logging, etc.
    DEBUG: bool = os.getenv("DEBUG", "false").lower() in ("true", "1", "yes")
    # Convert postgres:// to postgresql+asyncpg:// for SQLAlchemy async
    ASYNC_DATABASE_URL: str = DATABASE_URL.replace(
        "postgresql://", "postgresql+asyncpg://"
    )
    SYNC_DATABASE_URL: str = DATABASE_URL.replace(
        "postgresql://", "postgresql+psycopg2://"
    )

    PINECONE_API_KEY: str = os.getenv("PINECONE_API_KEY", "")
    PINECONE_INDEX_NAME: str = os.getenv("PINECONE_INDEX_NAME", "qa-ai-documents")

    # OpenRouter AI
    OPENROUTER_API_KEY: str = os.getenv("OPENROUTER_API_KEY", "")

    # Supabase Storage (S3 Compatibility)
    SUPABASE_URL: str = os.getenv("SUPABASE_URL", "")
    SUPABASE_ACCESS_KEY: str = os.getenv("SUPABASE_ACCESS_KEY", "")
    SUPABASE_SECRET_KEY: str = os.getenv("SUPABASE_SECRET_KEY", "")

    # CORS — extend with EXTRA_CORS_ORIGINS env var (comma-separated)
    _extra = os.getenv("EXTRA_CORS_ORIGINS", "")
    CORS_ORIGINS: list[str] = [
        "http://localhost:3000",
        "http://localhost:3001",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:3001",
        "https://qa-project-one.vercel.app",
        "https://qa-project-n7gd0bd8i-seththavareakhours-projects.vercel.app",
    ] + [o.strip() for o in _extra.split(",") if o.strip()]

    # JWT
    SECRET_KEY: str = os.getenv("SECRET_KEY", "change-me-in-production")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    AUTH_COOKIE_NAME: str = os.getenv("AUTH_COOKIE_NAME", "access_token")
    COOKIE_SECURE: bool = os.getenv("COOKIE_SECURE", "false").lower() == "true"
    COOKIE_SAMESITE: str = os.getenv("COOKIE_SAMESITE", "lax")

    # Email / SMTP
    SMTP_HOST: str = os.getenv("SMTP_HOST", "smtp.gmail.com")
    SMTP_PORT: int = int(os.getenv("SMTP_PORT", "587"))
    SMTP_USER: str = os.getenv("SMTP_USER", "")
    SMTP_PASSWORD: str = os.getenv("SMTP_PASSWORD", "")
    SMTP_FROM_NAME: str = os.getenv("SMTP_FROM_NAME", "QA Analytics")

    # OTP
    OTP_EXPIRE_MINUTES: int = int(os.getenv("OTP_EXPIRE_MINUTES", "5"))


settings = Settings()
