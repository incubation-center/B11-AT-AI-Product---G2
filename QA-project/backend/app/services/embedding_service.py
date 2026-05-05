"""
Embedding Service — uses OpenRouter for both embeddings and text generation.

Embeddings: nvidia/llama-nemotron-embed-vl-1b-v2:free via OpenRouter
            (2048-dim native, truncated/requested to 768 for Pinecone)
Generation: OpenRouter API (OpenAI-compatible) with google/gemini-2.0-flash-001
"""

import asyncio
import logging
from typing import Optional

from openai import AsyncOpenAI
from app.config import settings

logger = logging.getLogger(__name__)

# Initialise OpenRouter client (OpenAI-compatible)
openrouter_client = AsyncOpenAI(
    base_url="https://openrouter.ai/api/v1",
    api_key=settings.OPENROUTER_API_KEY,
)

# ---------------------------------------------------------------------------
# Embedding configuration
# ---------------------------------------------------------------------------
EMBEDDING_DIM = 768

# Free-tier embedding model via OpenRouter.
# If :free is throttled or retired, swap to:
#   "openai/text-embedding-3-small"  (paid, 1536-dim native, supports dimensions=768)
EMBEDDING_MODEL = "nvidia/llama-nemotron-embed-vl-1b-v2:free"

# Max texts per single API call (stay within free-tier rate limits)
_EMBED_BATCH_SIZE = 32

# OpenRouter generative model
GENERATIVE_MODEL = "google/gemini-2.0-flash-001"

# Retry config for rate-limit errors
MAX_RETRIES = 2
RETRY_BASE_DELAY = 15  # seconds


# ---------------------------------------------------------------------------
# Internal helpers
# ---------------------------------------------------------------------------


async def _embed_with_retry(
    texts: list[str],
    input_type: str = "search_document",
) -> object:
    """Call OpenRouter embeddings endpoint with automatic retry on 429."""
    last_error: Exception | None = None
    for attempt in range(1 + MAX_RETRIES):
        try:
            response = await openrouter_client.embeddings.create(
                model=EMBEDDING_MODEL,
                input=texts,
                dimensions=EMBEDDING_DIM,
                extra_body={"input_type": input_type},
            )
            return response
        except Exception as e:
            error_str = str(e)
            if "429" in error_str or "rate" in error_str.lower():
                delay = RETRY_BASE_DELAY * (attempt + 1)
                logger.warning(
                    f"Embedding rate-limited (attempt {attempt + 1}/{1 + MAX_RETRIES}), "
                    f"retrying in {delay:.0f}s …"
                )
                last_error = e
                await asyncio.sleep(delay)
            else:
                raise
    raise last_error  # type: ignore[misc]


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


# ---------------------------------------------------------------------------
# Public API — embeddings
# ---------------------------------------------------------------------------


async def create_embeddings(texts: list[str]) -> list[list[float]]:
    """
    Create embeddings for a list of text strings via OpenRouter.
    Returns a list of 768-dim embedding vectors.

    Texts are batched to _EMBED_BATCH_SIZE and sent sequentially to respect
    free-tier rate limits.
    """
    if not texts:
        return []

    all_vectors: list[list[float]] = []

    for start in range(0, len(texts), _EMBED_BATCH_SIZE):
        batch = texts[start : start + _EMBED_BATCH_SIZE]
        resp = await _embed_with_retry(batch, input_type="search_document")
        # Sort by index to guarantee order matches input
        sorted_data = sorted(resp.data, key=lambda item: item.index)
        vectors = [item.embedding[:EMBEDDING_DIM] for item in sorted_data]
        all_vectors.extend(vectors)

    logger.info(
        f"Created {len(all_vectors)} embeddings "
        f"(dim={len(all_vectors[0]) if all_vectors else 0})"
    )
    return all_vectors


async def create_query_embedding(query: str) -> list[float]:
    """
    Create a single embedding for a search query via OpenRouter.
    Uses input_type='search_query' for asymmetric retrieval.
    """
    resp = await _embed_with_retry([query], input_type="search_query")
    vec = resp.data[0].embedding[:EMBEDDING_DIM]
    logger.info(f"Created query embedding (dim={len(vec)})")
    return vec


# ---------------------------------------------------------------------------
# Public API — generation (unchanged)
# ---------------------------------------------------------------------------


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
