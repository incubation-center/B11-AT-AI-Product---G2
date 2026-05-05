import logging
from typing import Optional
from sqlalchemy import select
from app.models.users import User
from app.models.datasets import Dataset
from app.database import AsyncSessionLocal

logger = logging.getLogger(__name__)

class StateService:
    @classmethod
    async def get_user_context(cls, db, telegram_id, context):
        """Centralized source of truth for user state and data."""
        user = await cls.get_linked_user(db, telegram_id)
        if not user:
            return {"state": "unlinked", "user": None, "dataset": None}
        
        dataset = await cls.get_active_dataset(db, user.user_id, context)
        if not dataset:
            return {"state": "no_data", "user": user, "dataset": None}
        
        return {"state": "ready", "user": user, "dataset": dataset}

    @classmethod
    async def get_linked_user(cls, db, telegram_id) -> Optional[User]:
        res = await db.execute(select(User).where(User.telegram_id == str(telegram_id)))
        return res.scalar_one_or_none()

    @classmethod
    async def get_active_dataset(cls, db, user_id, context):
        selected_id = context.user_data.get("selected_dataset_id")
        if selected_id:
            res = await db.execute(select(Dataset).where(Dataset.dataset_id == selected_id))
            return res.scalar_one_or_none()
        
        res = await db.execute(select(Dataset).where(Dataset.user_id == user_id).order_by(Dataset.uploaded_at.desc()).limit(1))
        return res.scalar_one_or_none()
