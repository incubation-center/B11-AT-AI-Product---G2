from sqlalchemy import Column, Integer, String, Text, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base


class AIDocument(Base):
    """Lightweight reference table in Supabase.
    Actual embedding vectors are stored in Pinecone.
    `pinecone_vector_id` links this row to the Pinecone record.
    """
    __tablename__ = "ai_documents"

    doc_id = Column(Integer, primary_key=True, autoincrement=True)
    dataset_id = Column(Integer, ForeignKey("datasets.dataset_id", ondelete="CASCADE"), nullable=False)
    chunk_text = Column(Text, nullable=False)
    chunk_index = Column(Integer, nullable=False)
    pinecone_vector_id = Column(String(255))

    # Relationships
    dataset = relationship("Dataset", back_populates="ai_documents")
