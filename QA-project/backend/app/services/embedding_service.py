"""
Embedding Service — uses sentence-transformers for embeddings and OpenRouter for text generation.

Embeddings: all-MiniLM-L6-v2 (384-dim, padded to 768 for Pinecone compatibility)
Generation: OpenRouter API (OpenAI-compatible) with google/gemini-2.0-flash-001
"""

import asyncio
import logging
from typing import Optional

from openai import AsyncOpenAI
from sentence_transformers import SentenceTransformer
from app.config import settings

logger = logging.getLogger(__name__)

# Initialise OpenRouter client (OpenAI-compatible)
openrouter_client = AsyncOpenAI(
    base_url="https://openrouter.ai/api/v1",
    api_key=settings.OPENROUTER_API_KEY,
)

# Local embedding model — produces 384-dim vectors, padded to 768 for Pinecone
_embedding_model: SentenceTransformer | None = None
EMBEDDING_DIM = 768

# OpenRouter generative model
GENERATIVE_MODEL = "google/gemini-2.0-flash-001"

# Retry config for rate-limit errors
MAX_RETRIES = 2
RETRY_BASE_DELAY = 15  # seconds


def _get_embedding_model() -> SentenceTransformer:
    """Lazy-load the sentence-transformers model."""
    global _embedding_model
    if _embedding_model is None:
        _embedding_model = SentenceTransformer("all-MiniLM-L6-v2")
    return _embedding_model


def _pad_embedding(vec: list[float], target_dim: int = EMBEDDING_DIM) -> list[float]:
    """Pad or truncate an embedding vector to target_dim."""
    if len(vec) >= target_dim:
        return vec[:target_dim]
    return vec + [0.0] * (target_dim - len(vec))


async def _generate_with_retry(model: str, prompt: str) -> str:
    """Call OpenRouter with automatic retry on rate limits."""
    last_error: Exception | None = None
    for attempt in range(1 + MAX_RETRIES):
        try:
            response = await openrouter_client.chat.completions.create(
                model=model,
                messages=[{"role": "user", "content": prompt}],
            )
            return response.choices[0].message.content.strip()
        except Exception as e:
            error_str = str(e)
            if "429" in error_str or "rate" in error_str.lower():
                delay = RETRY_BASE_DELAY * (attempt + 1)
                logger.warning(
                    f"Rate-limited (attempt {attempt + 1}/{1 + MAX_RETRIES}), "
                    f"retrying in {delay:.0f}s …"
                )
                last_error = e
                await asyncio.sleep(delay)
            else:
                raise
    raise last_error  # type: ignore[misc]


async def create_embeddings(texts: list[str]) -> list[list[float]]:
    """
    Create embeddings for a list of text strings using sentence-transformers.
    Returns a list of embedding vectors (768-dim each, zero-padded).
    """
    if not texts:
        return []

    model = _get_embedding_model()

    try:
        raw_embeddings = model.encode(texts, show_progress_bar=False)
        embeddings = [_pad_embedding(vec.tolist()) for vec in raw_embeddings]
        logger.info(f"Created {len(embeddings)} embeddings (dim={len(embeddings[0]) if embeddings else 0})")
        return embeddings
    except Exception as e:
        logger.error(f"Embedding error: {e}")
        raise


async def create_query_embedding(query: str) -> list[float]:
    """
    Create a single embedding for a search query.
    """
    model = _get_embedding_model()

    try:
        raw = model.encode([query], show_progress_bar=False)
        embedding = _pad_embedding(raw[0].tolist())
        logger.info(f"Created query embedding (dim={len(embedding)})")
        return embedding
    except Exception as e:
        logger.error(f"Query embedding error: {e}")
        raise


async def generate_answer(question: str, context: str, dataset_name: str = "") -> str:
    """
    Use OpenRouter to generate an answer to a question using the provided context.
    """
    if not settings.OPENROUTER_API_KEY:
        raise ValueError("OPENROUTER_API_KEY is not configured")

    system_prompt = (
        "You are a QA Analytics AI Assistant. You analyze software defect data "
        "to provide insights about bug trends, quality metrics, and testing improvements.\n\n"
        "Rules:\n"
        "- Answer based ONLY on the provided defect data context\n"
        "- If the context doesn't contain enough information, say so clearly\n"
        "- Be specific — reference bug IDs, modules, severities when available\n"
        "- Provide actionable insights when possible\n"
        "- Keep answers concise but thorough\n"
    )

    prompt = (
        f"{system_prompt}\n"
        f"Dataset: {dataset_name}\n\n"
        f"=== DEFECT DATA CONTEXT ===\n{context}\n"
        f"=== END CONTEXT ===\n\n"
        f"Question: {question}\n\n"
        f"Answer:"
    )

    try:
        answer = await _generate_with_retry(GENERATIVE_MODEL, prompt)
        logger.info(f"Generated AI answer ({len(answer)} chars)")
        return answer
    except Exception as e:
        logger.error(f"OpenRouter generation error: {e}")
        raise


async def generate_qa_suggestions(context: str, dataset_name: str = "") -> str:
    """
    Use OpenRouter to generate QA improvement suggestions based on defect patterns.
    """
    if not settings.OPENROUTER_API_KEY:
        raise ValueError("OPENROUTER_API_KEY is not configured")

    prompt = (
        "You are a QA Analytics AI Assistant specialized in software quality improvement.\n\n"
        f"Dataset: {dataset_name}\n\n"
        f"=== DEFECT DATA ===\n{context}\n=== END DATA ===\n\n"
        "Based on the defect data above, provide:\n"
        "1. Top 3-5 areas that need the most testing attention (highest risk modules)\n"
        "2. Patterns you notice in the defect data (common severity, recurring modules)\n"
        "3. Specific testing improvement recommendations\n"
        "4. Suggested test priorities for the next sprint\n\n"
        "Be specific and reference actual data points from the defects."
    )

    try:
        return await _generate_with_retry(GENERATIVE_MODEL, prompt)
    except Exception as e:
        logger.error(f"OpenRouter suggestion error: {e}")
        raise
