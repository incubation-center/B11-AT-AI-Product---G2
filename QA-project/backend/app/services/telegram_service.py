import logging
import asyncio
import html
from typing import Optional
from telegram import Update, ForceReply
from telegram.ext import (
    ApplicationBuilder,
    CommandHandler,
    ContextTypes,
    MessageHandler,
    filters,
    Application,
)
from telegram.request import HTTPXRequest
from app.config import settings
from app.services.rag_service import ask_question
from app.database import AsyncSessionLocal
from sqlalchemy import select, and_
from datetime import datetime
from app.models.users import User
from app.models.datasets import Dataset
from app.models.otp_codes import OTPCode

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
            
            app.add_handler(CommandHandler("start", cls.start_command))
            app.add_handler(CommandHandler("help", cls.help_command))
            app.add_handler(CommandHandler("status", cls.status_command))
            app.add_handler(CommandHandler("link", cls.link_command))
            app.add_handler(CommandHandler("datasets", cls.datasets_command))
            app.add_handler(CommandHandler("select", cls.select_command))
            app.add_handler(MessageHandler(filters.TEXT & ~filters.COMMAND, cls.handle_message))
            
            cls._instance = app
            logger.info("Telegram Bot application initialized")
            
        return cls._instance

    @classmethod
    async def start_command(cls, update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
        """Greeting message."""
        welcome_text = (
            f"Hello {update.effective_user.first_name}! 🤖\n\n"
            "I am your **QA Analytics Assistant**.\n\n"
            "**Common Commands:**\n"
            "/ask [question] - Ask about your QA data\n"
            "/status - Summary of your current dataset\n"
            "/link [code] - Connect your Telegram to your account\n"
            "/help - See more"
        )
        await update.message.reply_html(welcome_text)

    @classmethod
    async def help_command(cls, update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
        help_text = (
            "<b>Commands Guide:</b>\n\n"
            "/ask [question] - Context-aware AI analysis\n"
            "/status - Defect distribution overview\n"
            "/datasets - Browse your uploads\n"
            "/select [id] - Change active dataset for AI\n"
            "/link [code] - Link your platform account"
        )
        await update.message.reply_html(help_text)

    @classmethod
    async def _get_active_dataset(cls, db, user_id, context):
        """Helper to get the user's selected or latest dataset."""
        selected_id = context.user_data.get("selected_dataset_id")
        if selected_id:
            res = await db.execute(select(Dataset).where(Dataset.dataset_id == selected_id))
            return res.scalar_one_or_none()
        
        res = await db.execute(
            select(Dataset)
            .where(Dataset.user_id == user_id)
            .order_by(Dataset.uploaded_at.desc())
            .limit(1)
        )
        return res.scalar_one_or_none()

    @classmethod
    async def status_command(cls, update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
        await update.message.reply_chat_action("typing")
        async with AsyncSessionLocal() as db:
            try:
                db_user = await cls._get_linked_user(db, update.effective_user.id)
                
                if not db_user:
                    await update.message.reply_text("Your Telegram is not linked to any account. Use /link [code] to connect.")
                    return

                user_id = db_user.user_id
                dataset = await cls._get_active_dataset(db, user_id, context)
                
                if not dataset:
                    await update.message.reply_text(f"Hello {db_user.name}! You are linked, but you haven't uploaded any datasets yet. Please upload data on the web platform first.")
                    return

                from app.services.analytics_service import get_severity_distribution
                stats = await get_severity_distribution(db, dataset.dataset_id)
                
                filename = html.escape(dataset.file_name)
                msg = f"📊 <b>Status: {filename}</b>\n\n"
                if not stats:
                    msg += "No data found in this dataset."
                else:
                    for s in stats:
                        msg += f"• {s['severity']}: {s['count']} ({s['percentage']}%)\n"
                
                await update.message.reply_html(msg)
            except Exception as e:
                logger.error(f"Status error: {e}")
                await update.message.reply_text("Failed to retrieve status.")

    @classmethod
    async def ask_command(cls, update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
        query = " ".join(context.args).strip()
        if not query:
            await update.message.reply_text("Please provide a question. Example: /ask top bugs")
            return

        await update.message.reply_chat_action("typing")
        async with AsyncSessionLocal() as db:
            try:
                db_user = await cls._get_linked_user(db, update.effective_user.id)
                if not db_user:
                    await update.message.reply_text("Please link your account first using /link [code].")
                    return

                user_id = db_user.user_id
                dataset = await cls._get_active_dataset(db, user_id, context)
                if not dataset:
                    await update.message.reply_text("Please upload a dataset on the web platform first.")
                    return

                history = context.user_data.get("chat_history", [])
                response = await ask_question(db, user_id, dataset.dataset_id, query, chat_history=history)
                
                answer = response.get("answer", "No answer found.")
                history.extend([{"role": "user", "content": query}, {"role": "assistant", "content": answer}])
                context.user_data["chat_history"] = history[-10:]
                
                await update.message.reply_text(f"💡 <b>AI Analysis:</b>\n\n{answer}", parse_mode="HTML")
            except Exception as e:
                logger.error(f"Ask error: {e}")
                await update.message.reply_text("AI Error. Please try again later.")

    @classmethod
    async def handle_message(cls, update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
        if not update.message.text: return
        await update.message.reply_chat_action("typing")
        async with AsyncSessionLocal() as db:
            try:
                db_user = await cls._get_linked_user(db, update.effective_user.id)
                if not db_user:
                    await update.message.reply_text("Please link your account first using /link [code].")
                    return
                
                user_id = db_user.user_id
                dataset = await cls._get_active_dataset(db, user_id, context)
                if not dataset:
                    await update.message.reply_text("Please upload and select a dataset first.")
                    return
                
                history = context.user_data.get("chat_history", [])
                response = await ask_question(db, user_id, dataset.dataset_id, update.message.text, chat_history=history)
                
                answer = response.get("answer", "...")
                history.extend([{"role": "user", "content": update.message.text}, {"role": "assistant", "content": answer}])
                context.user_data["chat_history"] = history[-10:]
                await update.message.reply_text(answer)
            except Exception as e:
                logger.error(f"Chat error: {e}")

    @classmethod
    async def _get_linked_user(cls, db, telegram_id) -> Optional[User]:
        res = await db.execute(select(User).where(User.telegram_id == str(telegram_id)))
        return res.scalar_one_or_none()

    @classmethod
    async def link_command(cls, update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
        if not context.args:
            await update.message.reply_text("Use: /link [code]")
            return
        
        async with AsyncSessionLocal() as db:
            try:
                # 1. Check if Telegram ID already linked
                existing_user = await cls._get_linked_user(db, update.effective_user.id)
                if existing_user:
                    await update.message.reply_text(f"Your account is already linked to {existing_user.name} ({existing_user.email}).")
                    return

                # 2. Check the code
                code = context.args[0].strip()
                otp_res = await db.execute(
                    select(OTPCode).where(
                        and_(OTPCode.otp_code == code, OTPCode.purpose == "telegram_link")
                    ).order_by(OTPCode.created_at.desc())
                )
                otp = otp_res.scalars().first()
                
                if not otp:
                    await update.message.reply_text("Invalid code. Please generate a new one from Settings.")
                    return
                
                if otp.is_used:
                    await update.message.reply_text("This code has already been used. Please generate a new one.")
                    return
                
                if otp.expires_at < datetime.utcnow():
                    await update.message.reply_text("This code has expired. Please generate a new one.")
                    return
                
                # 3. Find user and link
                user_res = await db.execute(select(User).where(User.email == otp.email))
                user = user_res.scalar_one_or_none()
                if not user:
                    await update.message.reply_text("User account not found.")
                    return
                
                user.telegram_id = str(update.effective_user.id)
                otp.is_used = 1
                await db.commit()
                await update.message.reply_text(f"Successfully linked to {user.name}!")
            except Exception as e:
                logger.error(f"Link error: {e}")
                await update.message.reply_text("Linking failed due to a system error.")

    @classmethod
    async def datasets_command(cls, update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
        async with AsyncSessionLocal() as db:
            db_user = await cls._get_linked_user(db, update.effective_user.id)
            if not db_user:
                await update.message.reply_text("Please link your account first using /link [code].")
                return
            
            user_id = db_user.user_id
            res = await db.execute(select(Dataset).where(Dataset.user_id == user_id).order_by(Dataset.uploaded_at.desc()).limit(10))
            datasets = res.scalars().all()
            if not datasets:
                await update.message.reply_text("No datasets found. Please upload one via the web dashboard.")
                return
            
            cur_id = context.user_data.get("selected_dataset_id")
            msg = "<b>📂 Your Data:</b>\n\n"
            for d in datasets:
                active = " ✅" if d.dataset_id == cur_id else ""
                msg += f"ID: <code>{d.dataset_id}</code> - {html.escape(d.file_name)}{active}\n"
            await update.message.reply_html(msg + "\n/select [id]")

    @classmethod
    async def select_command(cls, update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
        if not context.args: return
        async with AsyncSessionLocal() as db:
            db_user = await cls._get_linked_user(db, update.effective_user.id)
            if not db_user:
                await update.message.reply_text("Please link your account first using /link [code].")
                return
                
            user_id = db_user.user_id
            res = await db.execute(select(Dataset).where(and_(Dataset.dataset_id == int(context.args[0]), Dataset.user_id == user_id)))
            ds = res.scalar_one_or_none()
            if ds:
                context.user_data["selected_dataset_id"] = ds.dataset_id
                await update.message.reply_text(f"Dataset active: {ds.file_name}")
            else:
                await update.message.reply_text("Not found.")

async def start_bot():
    try:
        app = await TelegramBotService.get_instance()
        await app.initialize(); await app.start(); await app.updater.start_polling(timeout=30)
        logger.info("Bot Online")
    except Exception as e: logger.error(f"Startup fail: {e}")

async def stop_bot():
    try:
        app = await TelegramBotService.get_instance()
        await app.updater.stop(); await app.stop(); await app.shutdown()
    except Exception: pass
