"""
Embedding Service — uses OpenRouter for both embeddings and text generation.

Embeddings: nvidia/llama-nemotron-embed-vl-1b-v2:free via OpenRouter
            (2048-dim native, truncated/requested to 768 for Pinecone)
Generation: OpenRouter API (OpenAI-compatible) with google/gemini-2.0-flash-001
"""

import asyncio
import logging
import json
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
EMBEDDING_MODEL = "google/gemini-embedding-001"

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


async def _generate_with_retry(model: str, messages: list[dict]) -> str:
    """Call OpenRouter with automatic retry on rate limits."""
    if not messages:
        raise ValueError("No messages provided for generation")
        
    last_error: Exception | None = None
    for attempt in range(1 + MAX_RETRIES):
        try:
            response = await openrouter_client.chat.completions.create(
                model=model,
                messages=messages,
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
                logger.error(f"OpenRouter API Error: {e}")
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


async def generate_answer(
    question: str, 
    context: str, 
    dataset_name: str = "",
    chat_history: Optional[list[dict]] = None
) -> str:
    """
    Use OpenRouter to generate an answer using context and history.
    """
    if not settings.OPENROUTER_API_KEY:
        raise ValueError("OPENROUTER_API_KEY is not configured")

    system_prompt = (
        "You are a QA Analytics AI Assistant. Use the provided defect data to answer the user.\n"
        "Rules:\n"
        "- Answer based ONLY on the provided context\n"
        "- If the context is missing, say so\n"
        "- Keep answers professional and data-driven\n"
    )

    messages = [{"role": "system", "content": system_prompt}]
    
    # Add history (limit to last 10 messages)
    if chat_history:
        messages.extend(chat_history[-10:])

    prompt_with_context = (
        f"Dataset Context: {dataset_name}\n\n"
        f"=== DATA ===\n{context}\n=== END DATA ===\n\n"
        f"User Question: {question}"
    )
    
    messages.append({"role": "user", "content": prompt_with_context})

    return await _generate_with_retry(GENERATIVE_MODEL, messages)


async def generate_qa_suggestions(context: str, dataset_name: str = "") -> str:
    """
    Generate QA improvement suggestions.
    """
    if not settings.OPENROUTER_API_KEY:
        raise ValueError("OPENROUTER_API_KEY is not configured")

    prompt = (
        f"Dataset: {dataset_name}\n\n"
        f"=== DEFECT DATA ===\n{context}\n=== END DATA ===\n\n"
        "Provide 3-5 QA improvement recommendations based on these defects."
    )

    return await _generate_with_retry(GENERATIVE_MODEL, [{"role": "user", "content": prompt}])


async def generate_test_cases_json(context: str, dataset_name: str = "") -> list[dict]:
    """
    Generate professional QA test cases as JSON.
    """
    if not settings.OPENROUTER_API_KEY:
        raise ValueError("OPENROUTER_API_KEY is not configured")

    system_prompt = (
        "You are a Lead QA Automation Engineer & Product Analyst with 10+ years of experience in enterprise-grade software testing. "
        "Your goal is to generate HIGH-QUALITY, EXECUTABLE test cases based on the provided defect data.\n\n"
        "STRICT RULES:\n"
        "1. NO VAGUE TERMS: Never use 'valid', 'invalid', or 'some value'. Replace with SPECIFIC, realistic test data (e.g., amount = 50, title = 'Save the Earth').\n"
        "2. FULL SPECTRUM COVERAGE: Include Positive (happy path), Negative (invalid input), and Edge cases (boundaries, empty states, special characters).\n"
        "3. PRECISE EXPECTED RESULTS: Include exact error/success messages, UI behavior (buttons, redirects), and system impact (database changes).\n"
        "4. TEST DATA COLUMN: Every test case must have a specific 'Test Data' field corresponding to the inputs used in the steps.\n"
        "5. TYPE: Must be one of: Positive, Negative, Edge.\n"
        "6. POST-CONDITIONS: Describe the final state of the system after execution.\n\n"
        "Output ONLY a valid JSON list of dictionaries with exactly these keys:\n"
        "- ID: A unique identifier (e.g., TC-001)\n"
        "- Type: Positive, Negative, or Edge\n"
        "- Module: The application module being tested\n"
        "- Title: A concise descriptive title covering the objective\n"
        "- Pre-conditions: System state required before starting\n"
        "- Test Steps: Numbered actionable steps\n"
        "- Test Data: Exact input values used\n"
        "- Expected Result: Clear UI/System outcome\n"
        "- Post-conditions: Final state of the system\n"
        "- Priority: High, Medium, or Low"
    )

    prompt = (
        f"Dataset: {dataset_name}\n\n"
        f"=== DEFECT DATA ===\n{context}\n=== END DATA ===\n\n"
        "Generate 10 comprehensive test cases based on this data. Think like a tester: try to break the system and consider realistic unusual scenarios."
    )

    try:
        resp = await _generate_with_retry(GENERATIVE_MODEL, [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": prompt}
        ])
        
        # Extract JSON if wrapped in code blocks
        s = resp.find("[")
        e = resp.rfind("]")
        if s != -1 and e != -1:
            return json.loads(resp[s:e+1])
        return []
    except Exception as e:
        logger.error(f"Failed to generate test cases JSON: {e}")
        return []
