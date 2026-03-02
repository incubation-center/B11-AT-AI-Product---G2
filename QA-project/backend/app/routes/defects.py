from fastapi import APIRouter

router = APIRouter(prefix="/defects", tags=["Defects"])


@router.get("/")
async def get_defects():
    """Get all defects."""
    return {"message": "Defects endpoint - to be implemented"}


@router.get("/{defect_id}")
async def get_defect(defect_id: int):
    """Get a specific defect by ID."""
    return {"message": f"Get defect {defect_id} - to be implemented"}
