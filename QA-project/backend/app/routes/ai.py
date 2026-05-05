import logging

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.users import User
from app.dependencies.auth import get_current_user
from app.dependencies.authorization import check_dataset_access
from app.services.rag_service import (
    index_dataset,
    ask_question,
    get_suggestions,
    get_query_history,
)
from app.services.log_service import log_activity
from app.schemas.ai import (
    IndexDatasetResponse,
    AskQuestionRequest,
    AskQuestionResponse,
    SuggestionsResponse,
    QueryHistoryItem,
    QueryHistoryResponse,
)

router = APIRouter(prefix="/ai", tags=["AI"])
logger = logging.getLogger(__name__)


# ─── Index dataset (chunk + embed + upsert to Pinecone) ─────────────

@router.post("/index/{dataset_id}", response_model=IndexDatasetResponse)
async def index_dataset_endpoint(
    dataset_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Index a dataset for AI Q&A:
    1. Chunk defect data into text blocks
    2. Generate embeddings via sentence-transformers
    3. Upsert vectors to Pinecone
    4. Save document references in Supabase
    """
    await check_dataset_access(db, dataset_id, current_user)

    try:
        result = await index_dataset(db, dataset_id)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception:
        logger.exception("Dataset indexing failed")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Indexing failed",
        )

    await log_activity(db, current_user.user_id, f"Indexed dataset {dataset_id} for AI ({result['chunks_created']} chunks)")

    return IndexDatasetResponse(
        message=f"Dataset {dataset_id} indexed successfully",
        **result,
    )


# ─── Ask a question (RAG pipeline) ──────────────────────────────────

@router.post("/ask", response_model=AskQuestionResponse)
async def ask_question_endpoint(
    body: AskQuestionRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Ask a question about defect data using RAG:
    1. Embed the question
    2. Search Pinecone for relevant context
    3. Generate answer with OpenRouter
    """
    await check_dataset_access(db, body.dataset_id, current_user)

    try:
        result = await ask_question(
            db=db,
            user_id=current_user.user_id,
            dataset_id=body.dataset_id,
            question=body.question,
            top_k=body.top_k,
        )
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception:
        logger.exception("AI query failed")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="AI query failed",
        )

    await log_activity(db, current_user.user_id, f"AI Q&A on dataset {body.dataset_id}: '{body.question[:50]}...'")

    return AskQuestionResponse(
        query_id=result["query_id"],
        question=result["question"],
        answer=result["answer"],
        sources=result["sources"],
        dataset_name=result.get("dataset_name"),
        quality=result.get("quality"),
    )


# ─── QA Improvement Suggestions ─────────────────────────────────────

@router.get("/suggestions/{dataset_id}", response_model=SuggestionsResponse)
async def get_suggestions_endpoint(
    dataset_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    AI-powered QA improvement suggestions based on defect patterns.
    Requires the dataset to be indexed first.
    """
    await check_dataset_access(db, dataset_id, current_user)

    try:
        result = await get_suggestions(db, dataset_id)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception:
        logger.exception("Suggestion generation failed")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Suggestion generation failed",
        )

    await log_activity(db, current_user.user_id, f"Generated AI suggestions for dataset {dataset_id}")

    return SuggestionsResponse(**result)


# ─── Query History ───────────────────────────────────────────────────

@router.get("/queries/{dataset_id}", response_model=QueryHistoryResponse)
async def get_queries_endpoint(
    dataset_id: int,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get past AI queries for a dataset."""
    await check_dataset_access(db, dataset_id, current_user)

    result = await get_query_history(
        db=db,
        dataset_id=dataset_id,
        page=page,
        page_size=page_size,
    )

    return QueryHistoryResponse(
        items=[QueryHistoryItem(**item) for item in result["items"]],
        total=result["total"],
        page=result["page"],
        page_size=result["page_size"],
    )
