from sqlalchemy import Column, Integer, String, DateTime, Boolean, func
from sqlalchemy.orm import relationship
from app.database import Base


class User(Base):
    __tablename__ = "users"

    user_id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(255), nullable=False)
    email = Column(String(255), nullable=False, unique=True)
    password_hash = Column(String(255), nullable=False)
    role = Column(String(50), nullable=False, server_default="user")
    is_verified = Column(Boolean, nullable=False, server_default="false")
    created_at = Column(DateTime, server_default=func.now(), nullable=False)

    # Relationships
    datasets = relationship("Dataset", back_populates="user", cascade="all, delete-orphan")
    ai_queries = relationship("AIQuery", back_populates="user", cascade="all, delete-orphan")
    reports = relationship("Report", back_populates="user", cascade="all, delete-orphan")
    logs = relationship("Log", back_populates="user", cascade="all, delete-orphan")
