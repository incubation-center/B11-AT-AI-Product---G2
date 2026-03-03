from fastapi import APIRouter

router = APIRouter(prefix="/reports", tags=["Reports"])


@router.post("/generate")
async def generate_report():
    """Generate a report (PDF/CSV)."""
    return {"message": "Generate report - to be implemented"}


@router.get("/{dataset_id}")
async def get_reports(dataset_id: int):
    """Get reports for a dataset."""
    return {"message": f"Reports for dataset {dataset_id} - to be implemented"}
