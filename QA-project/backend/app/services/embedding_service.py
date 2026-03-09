"""
Embedding Service — uses Google Gemini API to create text embeddings.

Uses the `gemini-embedding-001` model with output_dimensionality=768.
"""

import asyncio
import logging
import re
from typing import Optional

from google import genai
from google.genai import types
from google.genai.errors import ClientError
from app.config import settings

logger = logging.getLogger(__name__)

# Initialise the Gemini client once at module level
client = genai.Client(api_key=settings.GEMINI_API_KEY)

# Gemini embedding model — output truncated to 768 dimensions for Pinecone
EMBEDDING_MODEL = "gemini-embedding-001"
EMBEDDING_DIM = 768

# Gemini generative model for Q&A
GENERATIVE_MODEL = "gemini-2.0-flash"

# Retry config for rate-limit (per-minute) errors
MAX_RETRIES = 2
RETRY_BASE_DELAY = 15  # seconds


def _extract_retry_delay(error: ClientError) -> float | None:
    """Extract the retry delay from a 429 error message, if present."""
    match = re.search(r"retry in ([\d.]+)s", str(error))
    return float(match.group(1)) if match else None


def _is_daily_quota_exhausted(error: ClientError) -> bool:
    """Check whether the 429 error is a daily (unrecoverable) quota limit."""
    return "PerDay" in str(error)


async def _generate_with_retry(model: str, contents: str) -> str:
    """Call generate_content with automatic retry on per-minute rate limits."""
    last_error: Exception | None = None
    for attempt in range(1 + MAX_RETRIES):
        try:
            response = client.models.generate_content(model=model, contents=contents)
            return response.text.strip()
        except ClientError as e:
            if e.code != 429:
                raise
            # Daily quota → no point retrying
            if _is_daily_quota_exhausted(e):
                raise ValueError(
                    "Gemini daily quota exhausted.  Please wait until the quota resets "
                    "(usually midnight PT) or upgrade to a paid plan."
                ) from e
            # Per-minute quota → back off and retry
            delay = _extract_retry_delay(e) or (RETRY_BASE_DELAY * (attempt + 1))
            logger.warning(
                f"Rate-limited (attempt {attempt + 1}/{1 + MAX_RETRIES}), "
                f"retrying in {delay:.0f}s …"
            )
            last_error = e
            await asyncio.sleep(delay)
    raise last_error  # type: ignore[misc]


async def create_embeddings(texts: list[str]) -> list[list[float]]:
    """
    Create embeddings for a list of text strings using Gemini.
    Returns a list of embedding vectors (768-dim each).
    """
    if not texts:
        return []

    if not settings.GEMINI_API_KEY:
        raise ValueError("GEMINI_API_KEY is not configured")

    embeddings: list[list[float]] = []

    try:
        # google-genai supports batch embedding via embed_content
        result = client.models.embed_content(
            model=EMBEDDING_MODEL,
            contents=texts,
            config=types.EmbedContentConfig(output_dimensionality=EMBEDDING_DIM),
        )
        embeddings = [e.values for e in result.embeddings]
        logger.info(f"Created {len(embeddings)} embeddings (dim={len(embeddings[0]) if embeddings else 0})")
    except Exception as e:
        logger.error(f"Gemini embedding error: {e}")
        raise

    return embeddings


async def create_query_embedding(query: str) -> list[float]:
    """
    Create a single embedding for a search query.
    """
    if not settings.GEMINI_API_KEY:
        raise ValueError("GEMINI_API_KEY is not configured")

    try:
        result = client.models.embed_content(
            model=EMBEDDING_MODEL,
            contents=query,
            config=types.EmbedContentConfig(output_dimensionality=EMBEDDING_DIM),
        )
        embedding = result.embeddings[0].values
        logger.info(f"Created query embedding (dim={len(embedding)})")
        return embedding
    except Exception as e:
        logger.error(f"Gemini query embedding error: {e}")
        raise


async def generate_answer(question: str, context: str, dataset_name: str = "") -> str:
    """
    Use Gemini to generate an answer to a question using the provided context.
    """
    if not settings.GEMINI_API_KEY:
        raise ValueError("GEMINI_API_KEY is not configured")

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
        logger.error(f"Gemini generation error: {e}")
        raise


async def generate_qa_suggestions(context: str, dataset_name: str = "") -> str:
    """
    Use Gemini to generate QA improvement suggestions based on defect patterns.
    """
    if not settings.GEMINI_API_KEY:
        raise ValueError("GEMINI_API_KEY is not configured")

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
        logger.error(f"Gemini suggestion error: {e}")
        raise
