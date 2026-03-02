from sqlalchemy import Column, Integer, Float, DateTime, ForeignKey, func
from sqlalchemy.orm import relationship
from app.database import Base


class AnalyticsResult(Base):
    __tablename__ = "analytics_results"

    result_id = Column(Integer, primary_key=True, autoincrement=True)
    dataset_id = Column(Integer, ForeignKey("datasets.dataset_id", ondelete="CASCADE"), nullable=False)
    reopen_rate = Column(Float)
    avg_resolution_time = Column(Float)
    defect_leakage_rate = Column(Float)
    computed_at = Column(DateTime, server_default=func.now(), nullable=False)

    # Relationships
    dataset = relationship("Dataset", back_populates="analytics_results")
