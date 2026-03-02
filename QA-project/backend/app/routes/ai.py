from fastapi import APIRouter

router = APIRouter(prefix="/ai", tags=["AI"])


@router.post("/ask")
async def ask_question():
    """Ask a question about defect data (RAG pipeline)."""
    return {"message": "AI Q&A endpoint - to be implemented"}


@router.get("/queries/{dataset_id}")
async def get_queries(dataset_id: int):
    """Get past AI queries for a dataset."""
    return {"message": f"AI queries for dataset {dataset_id} - to be implemented"}
