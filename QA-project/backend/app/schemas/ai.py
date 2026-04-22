"""Pydantic schemas for AI endpoints."""

from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


# ─── Answer Quality ─────────────────────────────────────────────────

class AnswerQuality(BaseModel):
    """Quality evaluation metadata returned alongside every AI answer."""
    grade: str = Field(description="Overall quality grade: 'good', 'fair', or 'poor'")
    retrieval_score: float = Field(description="Avg cosine similarity between question and retrieved context")
    retrieval_label: str = Field(description="Retrieval quality label: 'good', 'fair', 'poor', or 'unknown'")
    context_chunks_used: int = Field(description="Number of context chunks fed to the LLM")
    grounded: bool = Field(description="Whether the answer is grounded in the retrieved context")
    ungrounded_refs: list[str] = Field(default_factory=list, description="Data references in the answer not found in context")
    is_refusal: bool = Field(default=False, description="Whether the model refused or hedged")
    is_too_short: bool = Field(default=False)
    is_too_long: bool = Field(default=False)
    notes: list[str] = Field(default_factory=list, description="Human-readable quality notes")



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
    quality: Optional[AnswerQuality] = Field(None, description="Answer quality evaluation metadata")


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
