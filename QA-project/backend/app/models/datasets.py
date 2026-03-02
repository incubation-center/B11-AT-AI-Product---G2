from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, func
from sqlalchemy.orm import relationship
from app.database import Base


class Dataset(Base):
    __tablename__ = "datasets"

    dataset_id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.user_id", ondelete="CASCADE"), nullable=False)
    file_name = Column(String(255), nullable=False)
    file_type = Column(String(50), nullable=False)
    upload_type = Column(String(50), nullable=False)
    uploaded_at = Column(DateTime, server_default=func.now(), nullable=False)

    # Relationships
    user = relationship("User", back_populates="datasets")
    defects = relationship("Defect", back_populates="dataset", cascade="all, delete-orphan")
    analytics_results = relationship("AnalyticsResult", back_populates="dataset", cascade="all, delete-orphan")
    module_risk_scores = relationship("ModuleRiskScore", back_populates="dataset", cascade="all, delete-orphan")
    ai_documents = relationship("AIDocument", back_populates="dataset", cascade="all, delete-orphan")
    ai_queries = relationship("AIQuery", back_populates="dataset", cascade="all, delete-orphan")
    reports = relationship("Report", back_populates="dataset", cascade="all, delete-orphan")
