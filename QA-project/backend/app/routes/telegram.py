from fastapi import APIRouter, Request, BackgroundTasks
import logging
from app.services.telegram_service import TelegramBotService

router = APIRouter()
logger = logging.getLogger(__name__)

@router.post("/webhook/telegram")
async def telegram_webhook(request: Request, background_tasks: BackgroundTasks):
    """
    Endpoint for Telegram Bot Webhooks.
    Telegram sends a POST request with an Update object in JSON.
    """
    try:
        update_data = await request.json()
        
        # We use background tasks to respond to Telegram quickly (within 200 OK)
        # while processing the bot logic in the background.
        # This prevents Telegram from retrying the request if our AI takes too long.
        background_tasks.add_task(TelegramBotService.process_webhook_update, update_data)
        
        return {"status": "ok"}
    except Exception as e:
        logger.error(f"Error in telegram_webhook: {e}")
        # We still return 200 OK to Telegram so it doesn't keep retrying 
        # unless it's a truly fatal error we want to debug.
        return {"status": "error", "detail": str(e)}
