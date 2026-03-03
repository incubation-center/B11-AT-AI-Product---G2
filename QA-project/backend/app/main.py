from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.routes import auth, users, datasets, defects, analytics, ai, reports

app = FastAPI(
    title="QA Analytics API",
    description="Backend API for QA Defect Analytics with AI-powered insights",
    version="1.0.0",
)

# CORS middleware — allows Next.js frontend to call the API
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(auth.router, prefix="/api")
app.include_router(users.router, prefix="/api")
app.include_router(datasets.router, prefix="/api")
app.include_router(defects.router, prefix="/api")
app.include_router(analytics.router, prefix="/api")
app.include_router(ai.router, prefix="/api")
app.include_router(reports.router, prefix="/api")


@app.get("/")
async def root():
    return {"message": "QA Analytics API is running"}


@app.get("/health")
async def health_check():
    return {"status": "healthy"}
