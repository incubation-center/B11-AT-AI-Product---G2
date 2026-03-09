"""Pydantic schemas for AI endpoints."""

from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


# ─── Index Request / Response ────────────────────────────────────────

class IndexDatasetResponse(BaseModel):
    message: str
    dataset_id: int
    chunks_created: int
    vectors_upserted: int
    defects_processed: int


# ─── Ask Question ────────────────────────────────────────────────────

class AskQuestionRequest(BaseModel):
    dataset_id: int
    question: str = Field(..., min_length=3, max_length=1000, description="Question about defect data")
    top_k: int = Field(5, ge=1, le=20, description="Number of context chunks to retrieve")


class AskQuestionResponse(BaseModel):
    query_id: int
    question: str
    answer: str
    sources: list[str]
    dataset_name: Optional[str] = None


# ─── QA Suggestions ─────────────────────────────────────────────────

class SuggestionsResponse(BaseModel):
    dataset_id: int
    dataset_name: Optional[str] = None
    suggestions: str
    chunks_analyzed: int


# ─── Query History ───────────────────────────────────────────────────

class QueryHistoryItem(BaseModel):
    query_id: int
    question: str
    answer: Optional[str] = None
    source_reference: Optional[str] = None
    asked_at: Optional[str] = None


class QueryHistoryResponse(BaseModel):
    items: list[QueryHistoryItem]
    total: int
    page: int
    page_size: int


# ─── Simple Message ─────────────────────────────────────────────────

class AIMessageResponse(BaseModel):
    message: str
