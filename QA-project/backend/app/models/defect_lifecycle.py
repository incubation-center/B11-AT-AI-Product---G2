from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, func
from sqlalchemy.orm import relationship
from app.database import Base


class DefectLifecycle(Base):
    __tablename__ = "defect_lifecycle"

    lifecycle_id = Column(Integer, primary_key=True, autoincrement=True)
    defect_id = Column(Integer, ForeignKey("defects.defect_id", ondelete="CASCADE"), nullable=False)
    from_status = Column(String(50))
    to_status = Column(String(50))
    changed_at = Column(DateTime, server_default=func.now(), nullable=False)
    reopen_count = Column(Integer, server_default="0")
    resolution_days = Column(Integer)

    # Relationships
    defect = relationship("Defect", back_populates="lifecycle")
