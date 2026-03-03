from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, func
from sqlalchemy.orm import relationship
from app.database import Base


class ModuleRiskScore(Base):
    __tablename__ = "module_risk_scores"

    risk_id = Column(Integer, primary_key=True, autoincrement=True)
    dataset_id = Column(Integer, ForeignKey("datasets.dataset_id", ondelete="CASCADE"), nullable=False)
    module_name = Column(String(255), nullable=False)
    bug_count = Column(Integer, server_default="0")
    reopen_rate = Column(Float)
    risk_score = Column(Float)
    computed_at = Column(DateTime, server_default=func.now(), nullable=False)

    # Relationships
    dataset = relationship("Dataset", back_populates="module_risk_scores")
