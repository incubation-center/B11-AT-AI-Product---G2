import logging
import re
from typing import Optional
from telegram import Update
from telegram.ext import (
    ApplicationBuilder,
    CommandHandler,
    ContextTypes,
    MessageHandler,
    CallbackQueryHandler,
    filters,
    Application,
)
from telegram.request import HTTPXRequest
from app.config import settings

# Modular Imports
from app.services.telegram.handlers.start_handler import StartHandler
from app.services.telegram.handlers.menu_handler import MenuHandler
from app.services.telegram.handlers.link_handler import LinkHandler
from app.services.telegram.handlers.dataset_handler import DatasetHandler
from app.services.telegram.handlers.ai_handler import AIHandler
from app.services.telegram.routers.callback_router import CallbackRouter

logger = logging.getLogger(__name__)

class TelegramBotService:
    _instance: Optional[Application] = None

    @classmethod
    async def get_instance(cls) -> Application:
        if cls._instance is None:
            if not settings.TELEGRAM_BOT_TOKEN:
                logger.error("TELEGRAM_BOT_TOKEN not found in settings")
                raise ValueError("TELEGRAM_BOT_TOKEN is missing")
            
            request = HTTPXRequest(connect_timeout=20, read_timeout=20)
            builder = ApplicationBuilder().token(settings.TELEGRAM_BOT_TOKEN).get_updates_request(request)
            
            app = builder.build()
            
            # Command Handlers
            app.add_handler(CommandHandler("start", StartHandler.start_command))
            app.add_handler(CommandHandler("help", MenuHandler.help_command))
            app.add_handler(CommandHandler("status", MenuHandler.status_command))
            app.add_handler(CommandHandler("link", LinkHandler.link_command))
            app.add_handler(CommandHandler("datasets", DatasetHandler.datasets_command))
            
            # Callback Query Handler (Router)
            app.add_handler(CallbackQueryHandler(CallbackRouter.handle_callback))
            
            # Global Message Handler
            app.add_handler(MessageHandler(filters.TEXT & ~filters.COMMAND, cls.handle_message))
            
            cls._instance = app
            
            # Setup Bot UX (Commands, Descriptions)
            await cls._setup_bot_ux(app)
            
            logger.info("Telegram Bot application initialized (Modular + UX Optimized)")
            
        return cls._instance

    @classmethod
    async def _setup_bot_ux(cls, app: Application) -> None:
        """Sets up the bot menu, description, and commands for better UX."""
        try:
            # 1. Set Command Menu (Visible at the bottom left)
            commands = [
                ("start", "🚀 Start / Refresh the bot"),
                ("status", "📊 View project status dashboard"),
                ("datasets", "📂 Switch between projects"),
                ("link", "🔗 Connect your QA platform account"),
                ("help", "❓ Get a quick guide on how to use")
            ]
            await app.bot.set_my_commands(commands)
            
            # 2. Set Short Description (Shown on 'About' page)
            short_desc = "AI-powered QA Assistant to analyze bug reports and project health. 🤖"
            await app.bot.set_my_short_description(short_desc)
            
            # 3. Set Description (Shown BEFORE the user starts the bot)
            full_desc = (
                "👋 Welcome to your AI QA Assistant!\n\n"
                "I help you analyze your bug reports, identify high-risk modules, and track project health with AI.\n\n"
                "🚀 To get started:\n"
                "1. Connect your account with /link\n"
                "2. Upload a bug report (CSV or GitHub)\n"
                "3. Chat with me to explore insights!\n\n"
                "Type /help anytime if you're lost."
            )
            await app.bot.set_my_description(full_desc)
            
            logger.info("Telegram Bot UX (commands and descriptions) configured successfully.")
        except Exception as e:
            logger.error(f"Failed to setup bot UX: {e}")

    @classmethod
    async def handle_message(cls, update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
        """Global dispatcher for text messages."""
        if not update.message or not update.message.text: return
        text = update.message.text.strip()
        
        # 1. Detect 6-digit link code
        if re.match(r"^\d{6}$", text):
            await LinkHandler.handle_auto_link(update, context, text)
            return

        # 2. Default to AI Response
        await AIHandler.perform_ai_response(update, context, text)

async def start_bot():
    try:
        app = await TelegramBotService.get_instance()
        await app.initialize()
        await app.start()
        await app.updater.start_polling(timeout=30)
        logger.info("Bot Online (Modular + UX Optimized)")
    except Exception as e:
        logger.error(f"Startup fail: {e}")

async def stop_bot():
    try:
        app = await TelegramBotService.get_instance()
        await app.updater.stop(); await app.stop(); await app.shutdown()
    except Exception: pass
