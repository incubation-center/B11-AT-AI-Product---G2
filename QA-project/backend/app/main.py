from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
import logging

from app.config import settings
from app.routes import auth, users, datasets, defects, analytics, ai, reports, telegram
from app.services.telegram_service import start_bot, stop_bot

logger = logging.getLogger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Start Telegram Bot
    await start_bot()
    yield
    # Shutdown: Stop Telegram Bot
    await stop_bot()

app = FastAPI(
    title="QA Analytics API",
    description="Backend API for QA Defect Analytics with AI-powered insights",
    version="1.0.0",
    lifespan=lifespan,
)

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Global Error in {request.url.path}: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error. Please check backend logs."},
    )

# CORS middleware — allows Next.js frontend to call the API
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["*"],
    expose_headers=["*"],
    max_age=3600,
)

# Register routers
app.include_router(auth.router, prefix="/api")
app.include_router(users.router, prefix="/api")
app.include_router(datasets.router, prefix="/api")
app.include_router(defects.router, prefix="/api")
app.include_router(analytics.router, prefix="/api")
app.include_router(ai.router, prefix="/api")
app.include_router(reports.router, prefix="/api")
app.include_router(telegram.router, prefix="/api")


@app.get("/")
async def root():
    return {"message": "QA Analytics API is running"}


@app.get("/health")
async def health_check():
    return {"status": "healthy"}
