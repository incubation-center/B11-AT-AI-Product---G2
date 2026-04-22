"""
Answer Quality Service — post-generation evaluation for RAG responses.

Provides three systematic verification layers:
1. **Retrieval quality** — measures how relevant the retrieved context was to the
   question (cosine similarity between question and context embeddings).
2. **Groundedness / hallucination check** — detects whether the generated answer
   references data points (bug IDs, modules, severities, dates) that don't appear
   in the provided context, flagging potential hallucinations.
3. **Answer quality signals** — checks for hedging, refusals, excessive length,
   and empty/vague responses.

Results are returned as metadata alongside each AI answer so the frontend and
logs have transparent quality signals.
"""

import logging
import re
from dataclasses import dataclass, field, asdict

from app.services.embedding_service import create_query_embedding

logger = logging.getLogger(__name__)


# ── Thresholds (tunable) ─────────────────────────────────────────────

# Minimum average cosine similarity between the question embedding and the
# retrieved context chunks for us to consider retrieval "good".
RETRIEVAL_SIMILARITY_GOOD = 0.40
RETRIEVAL_SIMILARITY_FAIR = 0.25

# If the answer contains more than this many ungrounded references we flag it.
MAX_UNGROUNDED_REFS = 0

# Answer length bounds (characters).
MIN_ANSWER_LENGTH = 30
MAX_ANSWER_LENGTH = 8000

# Patterns that suggest the model refused or hedged heavily.
_REFUSAL_PATTERNS: list[re.Pattern] = [
    re.compile(r"I (?:don't|do not|cannot|can't) (?:have|find|see|know)", re.I),
    re.compile(r"(?:not enough|insufficient) (?:information|data|context)", re.I),
    re.compile(r"(?:no|without) (?:relevant|available) (?:data|information|context)", re.I),
]

# Patterns for data references the model might fabricate.
_BUG_ID_RE = re.compile(r"\b(?:BUG|DEFECT|ISSUE|TICKET)[_\-#]?\s*\d+\b", re.I)
_MODULE_RE = re.compile(r"\bModule:\s*([^\n|,]+)", re.I)
_SEVERITY_RE = re.compile(r"\bSeverity:\s*([^\n|,]+)", re.I)
_DATE_RE = re.compile(r"\b\d{4}-\d{2}-\d{2}\b")


@dataclass
class QualityResult:
    """Quality evaluation result attached to every AI answer."""

    # Overall grade: "good", "fair", or "poor"
    grade: str = "good"

    # Retrieval quality
    retrieval_score: float = 0.0          # avg cosine sim (question ↔ context)
    retrieval_label: str = "unknown"      # "good" | "fair" | "poor"
    context_chunks_used: int = 0

    # Groundedness
    grounded: bool = True
    ungrounded_refs: list[str] = field(default_factory=list)

    # Answer signals
    is_refusal: bool = False
    is_too_short: bool = False
    is_too_long: bool = False

    # Human-readable notes for logging / frontend tooltips
    notes: list[str] = field(default_factory=list)

    def to_dict(self) -> dict:
        return asdict(self)


# ── Public API ───────────────────────────────────────────────────────

async def evaluate_answer(
    question: str,
    answer: str,
    context_parts: list[str],
    source_scores: list[float] | None = None,
) -> QualityResult:
    """Run all quality checks and return a ``QualityResult``.

    Parameters
    ----------
    question : str
        The user's original question.
    answer : str
        The generated answer text.
    context_parts : list[str]
        The retrieved context chunks that were fed to the LLM.
    source_scores : list[float] | None
        Cosine similarity scores from the vector DB for each context chunk
        (as returned by Pinecone). If provided, we skip re-embedding.
    """
    result = QualityResult(context_chunks_used=len(context_parts))

    # 1. Retrieval quality
    await _evaluate_retrieval(result, question, context_parts, source_scores)

    # 2. Groundedness / hallucination check
    _evaluate_groundedness(result, answer, context_parts)

    # 3. Answer surface-level signals
    _evaluate_answer_signals(result, answer)

    # 4. Compute overall grade
    _compute_grade(result)

    logger.info(
        "Answer quality: grade=%s retrieval=%.2f grounded=%s notes=%s",
        result.grade,
        result.retrieval_score,
        result.grounded,
        result.notes,
    )
    return result


# ── Internal evaluation steps ────────────────────────────────────────

async def _evaluate_retrieval(
    result: QualityResult,
    question: str,
    context_parts: list[str],
    source_scores: list[float] | None,
) -> None:
    """Score how relevant the retrieved context was to the question."""
    if source_scores:
        # Use the vector-DB similarity scores directly (cheaper).
        avg_score = sum(source_scores) / len(source_scores) if source_scores else 0.0
    elif context_parts:
        # Fallback: compute cosine similarity between question and each chunk.
        try:
            q_emb = await create_query_embedding(question)
            from app.services.embedding_service import create_embeddings
            ctx_embs = await create_embeddings(context_parts)
            sims = [_cosine_sim(q_emb, c) for c in ctx_embs]
            avg_score = sum(sims) / len(sims) if sims else 0.0
        except Exception:
            logger.warning("Retrieval scoring fallback failed", exc_info=True)
            avg_score = 0.0
    else:
        avg_score = 0.0

    result.retrieval_score = round(avg_score, 4)

    if avg_score >= RETRIEVAL_SIMILARITY_GOOD:
        result.retrieval_label = "good"
    elif avg_score >= RETRIEVAL_SIMILARITY_FAIR:
        result.retrieval_label = "fair"
        result.notes.append("Context relevance is moderate; answer may lack detail")
    else:
        result.retrieval_label = "poor"
        result.notes.append("Retrieved context has low relevance to the question")


def _evaluate_groundedness(
    result: QualityResult,
    answer: str,
    context_parts: list[str],
) -> None:
    """Check whether data references in the answer actually appear in the context."""
    context_blob = "\n".join(context_parts).lower()

    ungrounded: list[str] = []

    # Check bug IDs mentioned in the answer
    for m in _BUG_ID_RE.finditer(answer):
        ref = m.group(0)
        if ref.lower() not in context_blob:
            ungrounded.append(ref)

    # Check dates mentioned in the answer
    for m in _DATE_RE.finditer(answer):
        ref = m.group(0)
        if ref not in context_blob:
            ungrounded.append(ref)

    if len(ungrounded) > MAX_UNGROUNDED_REFS:
        result.grounded = False
        result.ungrounded_refs = ungrounded
        result.notes.append(
            f"Answer references {len(ungrounded)} data point(s) not found "
            f"in the retrieved context — possible hallucination"
        )


def _evaluate_answer_signals(result: QualityResult, answer: str) -> None:
    """Surface-level answer quality checks."""
    # Refusal / hedging
    for pattern in _REFUSAL_PATTERNS:
        if pattern.search(answer):
            result.is_refusal = True
            result.notes.append("Model indicated insufficient context to answer")
            break

    # Length checks
    if len(answer) < MIN_ANSWER_LENGTH:
        result.is_too_short = True
        result.notes.append("Answer is unusually short")
    elif len(answer) > MAX_ANSWER_LENGTH:
        result.is_too_long = True
        result.notes.append("Answer is unusually long")


def _compute_grade(result: QualityResult) -> None:
    """Derive an overall grade from the individual signals."""
    problems = 0
    if result.retrieval_label == "poor":
        problems += 2
    elif result.retrieval_label == "fair":
        problems += 1
    if not result.grounded:
        problems += 2
    if result.is_refusal:
        problems += 1
    if result.is_too_short:
        problems += 1

    if problems == 0:
        result.grade = "good"
    elif problems <= 2:
        result.grade = "fair"
    else:
        result.grade = "poor"


# ── Helpers ──────────────────────────────────────────────────────────

def _cosine_sim(a: list[float], b: list[float]) -> float:
    """Compute cosine similarity between two vectors."""
    dot = sum(x * y for x, y in zip(a, b))
    norm_a = sum(x * x for x in a) ** 0.5
    norm_b = sum(x * x for x in b) ** 0.5
    if norm_a == 0 or norm_b == 0:
        return 0.0
    return dot / (norm_a * norm_b)
