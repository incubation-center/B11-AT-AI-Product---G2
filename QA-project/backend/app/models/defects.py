from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base


class Defect(Base):
    __tablename__ = "defects"

    defect_id = Column(Integer, primary_key=True, autoincrement=True)
    dataset_id = Column(Integer, ForeignKey("datasets.dataset_id", ondelete="CASCADE"), nullable=False)
    bug_id = Column(String(100))
    title = Column(String(500), nullable=False)
    module = Column(String(255))
    severity = Column(String(50))
    priority = Column(String(50))
    environment = Column(String(100))
    status = Column(String(50))
    created_date = Column(DateTime)
    resolved_date = Column(DateTime)
    closed_date = Column(DateTime)

    # Relationships
    dataset = relationship("Dataset", back_populates="defects")
    lifecycle = relationship("DefectLifecycle", back_populates="defect", cascade="all, delete-orphan")
