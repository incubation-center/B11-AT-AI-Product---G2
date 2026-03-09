import logging
from pinecone import Pinecone
from app.config import settings

logger = logging.getLogger(__name__)

pc = Pinecone(api_key=settings.PINECONE_API_KEY)

# Get or reference the index
pinecone_index = pc.Index(settings.PINECONE_INDEX_NAME)


async def upsert_chunks(
    vectors: list[dict],
) -> None:
    """
    Upsert embedding vectors into Pinecone.

    Each vector dict should have:
      - id: str (e.g. "doc_123")
      - values: list[float] (embedding)
      - metadata: dict (dataset_id, chunk_text, chunk_index, doc_id)
    """
    pinecone_index.upsert(vectors=vectors)
    logger.info(f"Upserted {len(vectors)} vectors to Pinecone")


async def query_similar_chunks(
    embedding: list[float],
    dataset_id: int,
    top_k: int = 5,
) -> list:
    """Query Pinecone for the most similar chunks filtered by dataset_id."""
    results = pinecone_index.query(
        vector=embedding,
        top_k=top_k,
        include_metadata=True,
        filter={"dataset_id": {"$eq": dataset_id}},
    )
    matches = results.get("matches", [])
    logger.info(f"Pinecone query returned {len(matches)} matches for dataset {dataset_id}")
    return matches


async def delete_dataset_vectors(dataset_id: int) -> None:
    """Delete all Pinecone vectors belonging to a dataset."""
    try:
        # List vector IDs with the dataset filter, then delete by ID
        # For serverless, delete by metadata filter
        pinecone_index.delete(
            filter={"dataset_id": {"$eq": dataset_id}},
        )
        logger.info(f"Deleted vectors for dataset {dataset_id}")
    except Exception as e:
        logger.warning(f"Failed to delete vectors for dataset {dataset_id}: {e}")
