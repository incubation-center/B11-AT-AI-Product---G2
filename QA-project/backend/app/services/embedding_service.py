"""
Embedding Service — uses sentence-transformers for embeddings and OpenRouter for text generation.

Embeddings: all-MiniLM-L6-v2 (384-dim, padded to 768 for Pinecone compatibility)
Generation: OpenRouter API (OpenAI-compatible) with google/gemini-2.0-flash-001
"""

import asyncio
import logging
import json
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
        return embedding
    except Exception as e:
        logger.error(f"Query embedding error: {e}")
        raise


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
