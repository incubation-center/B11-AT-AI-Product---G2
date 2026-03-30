"""
RAG Service — orchestrates the full Retrieval-Augmented Generation pipeline.

Flow:
1. Index: chunk defects → embed → upsert to Pinecone + save references in Supabase
2. Query: embed question → search Pinecone → build context → OpenRouter generates answer
3. Suggestions: retrieve all chunks → OpenRouter generates QA improvement suggestions
"""

import logging
from typing import Optional

from sqlalchemy import select, delete, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.ai_documents import AIDocument
from app.models.ai_queries import AIQuery
from app.models.datasets import Dataset
from app.services.chunking_service import chunk_defects, get_defects_for_chunking
from app.services.embedding_service import (
    create_embeddings,
    create_query_embedding,
    generate_answer,
    generate_qa_suggestions,
)
from app.services.pinecone_service import (
    upsert_chunks,
    query_similar_chunks,
    delete_dataset_vectors,
)

logger = logging.getLogger(__name__)


async def index_dataset(db: AsyncSession, dataset_id: int) -> dict:
    """
    Full indexing pipeline for a dataset:
    1. Fetch defects and chunk them
    2. Generate embeddings via sentence-transformers
    3. Upsert to Pinecone
    4. Save document references in Supabase (ai_documents table)

    Returns summary dict.
    """
    # 1. Get data and chunk it
    dataset, defects = await get_defects_for_chunking(db, dataset_id)
    if not dataset:
        raise ValueError(f"Dataset {dataset_id} not found")
    if not defects:
        raise ValueError(f"Dataset {dataset_id} has no defects to index")

    chunks = chunk_defects(dataset, defects)
    logger.info(f"Dataset {dataset_id}: {len(chunks)} chunks from {len(defects)} defects")

    # 2. Generate embeddings
    embeddings = await create_embeddings(chunks)

    # 3. Delete old vectors and document references
    try:
        await delete_dataset_vectors(dataset_id)
    except Exception as e:
        logger.warning(f"Failed to delete old Pinecone vectors: {e}")

    await db.execute(
        delete(AIDocument).where(AIDocument.dataset_id == dataset_id)
    )

    # 4. Upsert to Pinecone and save references
    vectors = []
    doc_records = []
    for i, (chunk_text, embedding) in enumerate(zip(chunks, embeddings)):
        vector_id = f"ds{dataset_id}_chunk{i}"

        vectors.append({
            "id": vector_id,
            "values": embedding,
            "metadata": {
                "dataset_id": dataset_id,
                "chunk_index": i,
                "chunk_text": chunk_text[:1000],  # Pinecone metadata limit
            },
        })

        doc = AIDocument(
            dataset_id=dataset_id,
            chunk_text=chunk_text,
            chunk_index=i,
            pinecone_vector_id=vector_id,
        )
        doc_records.append(doc)

    # Upsert to Pinecone in batches of 100
    batch_size = 100
    for j in range(0, len(vectors), batch_size):
        batch = vectors[j : j + batch_size]
        await upsert_chunks(batch)

    # Save document references to Supabase
    db.add_all(doc_records)
    await db.flush()

    logger.info(f"Indexed dataset {dataset_id}: {len(vectors)} vectors upserted")

    return {
        "dataset_id": dataset_id,
        "chunks_created": len(chunks),
        "vectors_upserted": len(vectors),
        "defects_processed": len(defects),
    }


async def ask_question(
    db: AsyncSession,
    user_id: int,
    dataset_id: int,
    question: str,
    top_k: int = 5,
    chat_history: Optional[list[dict]] = None,
) -> dict:
    """
    RAG Q&A pipeline:
    1. Embed the question
    2. Search Pinecone for relevant chunks
    3. Build context from matched chunks
    4. Generate answer with OpenRouter
    5. Save query to ai_queries table

    Returns answer dict with source references.
    """
    # 1. Embed the question
    query_embedding = await create_query_embedding(question)

    # 2. Search Pinecone
    matches = await query_similar_chunks(query_embedding, dataset_id, top_k=top_k)

    if not matches:
        # Fallback: try to get chunks from Supabase directly
        result = await db.execute(
            select(AIDocument)
            .where(AIDocument.dataset_id == dataset_id)
            .order_by(AIDocument.chunk_index)
            .limit(top_k)
        )
        docs = result.scalars().all()
        if not docs:
            # Save the query with no answer
            query_record = AIQuery(
                user_id=user_id,
                dataset_id=dataset_id,
                question=question,
                answer="No indexed data found for this dataset. Please index the dataset first using POST /api/ai/index/{dataset_id}.",
                source_reference="none",
            )
            db.add(query_record)
            await db.flush()
            return {
                "question": question,
                "answer": query_record.answer,
                "sources": [],
                "query_id": query_record.query_id,
            }
        context_parts = [doc.chunk_text for doc in docs]
        source_refs = [f"chunk_{doc.chunk_index}" for doc in docs]
    else:
        # Extract context from Pinecone matches
        context_parts = []
        source_refs = []
        for match in matches:
            metadata = match.get("metadata", {})
            chunk_text = metadata.get("chunk_text", "")
            if chunk_text:
                context_parts.append(chunk_text)
                source_refs.append(match.get("id", "unknown"))

    # 3. Build context
    context = "\n\n".join(context_parts)

    # 4. Get dataset name for context
    ds_result = await db.execute(
        select(Dataset.file_name).where(Dataset.dataset_id == dataset_id)
    )
    dataset_name = ds_result.scalar() or f"Dataset {dataset_id}"

    # 5. Generate answer
    answer = await generate_answer(question, context, dataset_name, chat_history)

    # 6. Save query record
    query_record = AIQuery(
        user_id=user_id,
        dataset_id=dataset_id,
        question=question,
        answer=answer,
        source_reference=", ".join(source_refs[:5]),
    )
    db.add(query_record)
    await db.flush()
    await db.refresh(query_record)

    return {
        "question": question,
        "answer": answer,
        "sources": source_refs,
        "query_id": query_record.query_id,
        "dataset_name": dataset_name,
    }


async def get_suggestions(db: AsyncSession, dataset_id: int) -> dict:
    """
    Generate QA improvement suggestions based on all defect data.
    Uses the stored chunks for context.
    """
    # Get all chunks for the dataset
    result = await db.execute(
        select(AIDocument)
        .where(AIDocument.dataset_id == dataset_id)
        .order_by(AIDocument.chunk_index)
    )
    docs = result.scalars().all()

    if not docs:
        raise ValueError(
            f"No indexed data for dataset {dataset_id}. "
            "Please index the dataset first using POST /api/ai/index/{dataset_id}."
        )

    # Build context from all chunks (limit to avoid token overflow)
    context = "\n\n".join(doc.chunk_text for doc in docs[:20])

    # Get dataset name
    ds_result = await db.execute(
        select(Dataset.file_name).where(Dataset.dataset_id == dataset_id)
    )
    dataset_name = ds_result.scalar() or f"Dataset {dataset_id}"

    suggestions = await generate_qa_suggestions(context, dataset_name)

    return {
        "dataset_id": dataset_id,
        "dataset_name": dataset_name,
        "suggestions": suggestions,
        "chunks_analyzed": len(docs),
    }


async def get_query_history(
    db: AsyncSession,
    dataset_id: int,
    user_id: Optional[int] = None,
    page: int = 1,
    page_size: int = 20,
) -> dict:
    """Get past AI queries for a dataset."""
    base = select(AIQuery).where(AIQuery.dataset_id == dataset_id)
    count_base = select(func.count(AIQuery.query_id)).where(AIQuery.dataset_id == dataset_id)

    if user_id:
        base = base.where(AIQuery.user_id == user_id)
        count_base = count_base.where(AIQuery.user_id == user_id)

    total_result = await db.execute(count_base)
    total = total_result.scalar() or 0

    query = base.order_by(AIQuery.asked_at.desc()).offset((page - 1) * page_size).limit(page_size)
    result = await db.execute(query)
    queries = result.scalars().all()

    return {
        "items": [
            {
                "query_id": q.query_id,
                "question": q.question,
                "answer": q.answer,
                "source_reference": q.source_reference,
                "asked_at": q.asked_at.isoformat() if q.asked_at else None,
            }
            for q in queries
        ],
        "total": total,
        "page": page,
        "page_size": page_size,
    }
