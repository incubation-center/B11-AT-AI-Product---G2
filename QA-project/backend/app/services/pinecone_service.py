from pinecone import Pinecone
from app.config import settings

pc = Pinecone(api_key=settings.PINECONE_API_KEY)

# Get or reference the index (create it in the Pinecone dashboard first)
pinecone_index = pc.index(settings.PINECONE_INDEX_NAME)


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
    return results.get("matches", [])


async def delete_dataset_vectors(dataset_id: int) -> None:
    """Delete all Pinecone vectors belonging to a dataset."""
    pinecone_index.delete(
        filter={"dataset_id": {"$eq": dataset_id}},
    )
