import logging
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.logs import Log

logger = logging.getLogger(__name__)


async def log_activity(db: AsyncSession, user_id: int, action: str) -> None:
    """Write an activity record to the logs table."""
    try:
        entry = Log(user_id=user_id, action=action)
        db.add(entry)
        await db.flush()
    except Exception as e:
        logger.warning(f"Failed to write activity log: {e}")
