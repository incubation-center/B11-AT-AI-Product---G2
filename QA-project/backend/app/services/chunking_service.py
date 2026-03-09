"""
Chunking Service — splits defect data into text chunks suitable for embedding.

Each chunk represents a meaningful unit of information that can be embedded
and retrieved during RAG Q&A.
"""

import logging
from typing import Optional

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.defects import Defect
from app.models.datasets import Dataset

logger = logging.getLogger(__name__)

# Maximum characters per chunk (Gemini embedding model handles up to ~2048 tokens)
MAX_CHUNK_CHARS = 1500


def _defect_to_text(defect: Defect) -> str:
    """Convert a single defect row into a descriptive text block."""
    parts = []
    if defect.bug_id:
        parts.append(f"Bug ID: {defect.bug_id}")
    parts.append(f"Title: {defect.title}")
    if defect.module:
        parts.append(f"Module: {defect.module}")
    if defect.severity:
        parts.append(f"Severity: {defect.severity}")
    if defect.priority:
        parts.append(f"Priority: {defect.priority}")
    if defect.environment:
        parts.append(f"Environment: {defect.environment}")
    if defect.status:
        parts.append(f"Status: {defect.status}")
    if defect.created_date:
        parts.append(f"Created: {defect.created_date.strftime('%Y-%m-%d')}")
    if defect.resolved_date:
        parts.append(f"Resolved: {defect.resolved_date.strftime('%Y-%m-%d')}")
    if defect.closed_date:
        parts.append(f"Closed: {defect.closed_date.strftime('%Y-%m-%d')}")
    return " | ".join(parts)


def _create_dataset_summary_chunk(dataset: Dataset, defects: list[Defect]) -> str:
    """Create a summary chunk for the entire dataset."""
    total = len(defects)
    severities: dict[str, int] = {}
    modules: dict[str, int] = {}
    statuses: dict[str, int] = {}

    for d in defects:
        sev = d.severity or "Unknown"
        severities[sev] = severities.get(sev, 0) + 1
        mod = d.module or "Unknown"
        modules[mod] = modules.get(mod, 0) + 1
        st = d.status or "Unknown"
        statuses[st] = statuses.get(st, 0) + 1

    lines = [
        f"Dataset Summary: {dataset.file_name}",
        f"Total Defects: {total}",
        f"Severity Breakdown: {', '.join(f'{k}: {v}' for k, v in sorted(severities.items(), key=lambda x: -x[1]))}",
        f"Module Breakdown: {', '.join(f'{k}: {v}' for k, v in sorted(modules.items(), key=lambda x: -x[1]))}",
        f"Status Breakdown: {', '.join(f'{k}: {v}' for k, v in sorted(statuses.items(), key=lambda x: -x[1]))}",
    ]
    return " | ".join(lines)


def chunk_defects(dataset: Dataset, defects: list[Defect]) -> list[str]:
    """
    Create text chunks from a list of defects.

    Strategy:
    1. First chunk = dataset summary
    2. Group defects into chunks of ~MAX_CHUNK_CHARS each
       (multiple defects per chunk for context density)
    """
    if not defects:
        return []

    chunks: list[str] = []

    # Chunk 0: Dataset summary
    summary = _create_dataset_summary_chunk(dataset, defects)
    chunks.append(summary)

    # Group defects into text blocks
    current_block: list[str] = []
    current_length = 0

    for defect in defects:
        text = _defect_to_text(defect)
        if current_length + len(text) > MAX_CHUNK_CHARS and current_block:
            chunks.append("\n".join(current_block))
            current_block = []
            current_length = 0
        current_block.append(text)
        current_length += len(text) + 1  # +1 for newline

    if current_block:
        chunks.append("\n".join(current_block))

    logger.info(f"Created {len(chunks)} chunks from {len(defects)} defects")
    return chunks


async def get_defects_for_chunking(db: AsyncSession, dataset_id: int) -> tuple[Optional[Dataset], list[Defect]]:
    """Fetch dataset and all its defects for chunking."""
    ds_result = await db.execute(
        select(Dataset).where(Dataset.dataset_id == dataset_id)
    )
    dataset = ds_result.scalar_one_or_none()
    if not dataset:
        return None, []

    defect_result = await db.execute(
        select(Defect).where(Defect.dataset_id == dataset_id).order_by(Defect.defect_id)
    )
    defects = defect_result.scalars().all()

    return dataset, list(defects)
