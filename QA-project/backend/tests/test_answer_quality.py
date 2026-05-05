"""
Tests for the answer quality evaluation service.

These validate the three verification layers:
  1. Retrieval quality scoring
  2. Groundedness / hallucination detection
  3. Answer surface-level signal checks
"""

import pytest
from app.services.answer_quality_service import (
    QualityResult,
    _evaluate_groundedness,
    _evaluate_answer_signals,
    _compute_grade,
    _cosine_sim,
    evaluate_answer,
)


# ── Cosine similarity helper ────────────────────────────────────────

def test_cosine_sim_identical():
    vec = [1.0, 2.0, 3.0]
    assert _cosine_sim(vec, vec) == pytest.approx(1.0, abs=1e-6)


def test_cosine_sim_orthogonal():
    assert _cosine_sim([1.0, 0.0], [0.0, 1.0]) == pytest.approx(0.0, abs=1e-6)


def test_cosine_sim_zero_vector():
    assert _cosine_sim([0.0, 0.0], [1.0, 1.0]) == 0.0


# ── Groundedness checks ─────────────────────────────────────────────

def test_grounded_answer():
    """Answer that only references data in the context should be grounded."""
    context = ["Bug ID: BUG-101 | Module: Auth | Severity: High | Created: 2025-06-15"]
    answer = "BUG-101 in the Auth module was created on 2025-06-15 and is high severity."

    result = QualityResult()
    _evaluate_groundedness(result, answer, context)

    assert result.grounded is True
    assert result.ungrounded_refs == []


def test_hallucinated_bug_id():
    """Answer fabricating a bug ID not in context should be flagged."""
    context = ["Bug ID: BUG-101 | Module: Auth | Severity: High"]
    answer = "BUG-101 is related to BUG-999 which has the same root cause."

    result = QualityResult()
    _evaluate_groundedness(result, answer, context)

    assert result.grounded is False
    assert "BUG-999" in result.ungrounded_refs


def test_hallucinated_date():
    """Answer inventing a date not in context should be flagged."""
    context = ["Bug ID: BUG-50 | Created: 2025-03-01"]
    answer = "BUG-50 was created on 2025-03-01 and resolved on 2025-04-15."

    result = QualityResult()
    _evaluate_groundedness(result, answer, context)

    assert result.grounded is False
    assert "2025-04-15" in result.ungrounded_refs


def test_grounded_no_specific_refs():
    """Answers that make general statements without specific refs are fine."""
    context = ["Module: Auth | Severity: High"]
    answer = "The Auth module has high-severity defects that need attention."

    result = QualityResult()
    _evaluate_groundedness(result, answer, context)

    assert result.grounded is True


# ── Answer signal checks ────────────────────────────────────────────

def test_refusal_detected():
    result = QualityResult()
    _evaluate_answer_signals(result, "I don't have enough information to answer this question.")

    assert result.is_refusal is True


def test_non_refusal():
    result = QualityResult()
    _evaluate_answer_signals(result, "The Auth module has 15 critical bugs, primarily in the login flow.")

    assert result.is_refusal is False


def test_too_short():
    result = QualityResult()
    _evaluate_answer_signals(result, "Yes.")

    assert result.is_too_short is True


def test_too_long():
    result = QualityResult()
    _evaluate_answer_signals(result, "A" * 9000)

    assert result.is_too_long is True


def test_normal_length():
    result = QualityResult()
    _evaluate_answer_signals(result, "The Auth module has 15 open bugs. Most are high severity.")

    assert result.is_too_short is False
    assert result.is_too_long is False


# ── Grade computation ────────────────────────────────────────────────

def test_grade_good():
    result = QualityResult(retrieval_label="good", grounded=True)
    _compute_grade(result)
    assert result.grade == "good"


def test_grade_fair_moderate_retrieval():
    result = QualityResult(retrieval_label="fair", grounded=True)
    _compute_grade(result)
    assert result.grade == "fair"


def test_grade_poor_hallucinated():
    result = QualityResult(retrieval_label="poor", grounded=False)
    _compute_grade(result)
    assert result.grade == "poor"


def test_grade_poor_ungrounded_with_refusal():
    result = QualityResult(
        retrieval_label="fair", grounded=False, is_refusal=True
    )
    _compute_grade(result)
    assert result.grade == "poor"


# ── Full evaluate_answer (integration, uses pre-supplied scores) ─────

@pytest.mark.asyncio
async def test_evaluate_answer_with_scores():
    """Full pipeline with pre-supplied Pinecone similarity scores."""
    context = ["Bug ID: BUG-10 | Module: Payment | Severity: Critical | Created: 2025-01-10"]
    answer = "BUG-10 in the Payment module is a critical defect created on 2025-01-10."

    result = await evaluate_answer(
        question="What critical bugs exist?",
        answer=answer,
        context_parts=context,
        source_scores=[0.85],
    )

    assert result.grade == "good"
    assert result.retrieval_score == pytest.approx(0.85)
    assert result.grounded is True
    assert result.is_refusal is False


@pytest.mark.asyncio
async def test_evaluate_answer_poor_retrieval():
    """Low similarity scores should produce a poor retrieval label."""
    context = ["Module: UI | Status: Open"]
    answer = "There is not enough information in the provided context to answer this question."

    result = await evaluate_answer(
        question="How many critical bugs are in the Payment module?",
        answer=answer,
        context_parts=context,
        source_scores=[0.10],
    )

    assert result.retrieval_label == "poor"
    assert result.is_refusal is True
