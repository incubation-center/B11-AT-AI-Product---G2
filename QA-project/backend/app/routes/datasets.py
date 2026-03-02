from fastapi import APIRouter

router = APIRouter(prefix="/datasets", tags=["Datasets"])


@router.get("/")
async def get_datasets():
    """Get all datasets."""
    return {"message": "Datasets endpoint - to be implemented"}


@router.post("/upload")
async def upload_dataset():
    """Upload a new dataset (CSV/Excel)."""
    return {"message": "Upload dataset - to be implemented"}
