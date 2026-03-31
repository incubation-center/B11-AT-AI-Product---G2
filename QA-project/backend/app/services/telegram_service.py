import logging
import asyncio
import html
from typing import Optional
from telegram import Update, ForceReply, InlineKeyboardButton, InlineKeyboardMarkup
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
            app.add_handler(CallbackQueryHandler(cls.handle_callback))
            app.add_handler(MessageHandler(filters.TEXT & ~filters.COMMAND, cls.handle_message))
            
            cls._instance = app
            logger.info("Telegram Bot application initialized")
            
        return cls._instance

    # --- STATE HELPERS ---

    @classmethod
    async def _get_user_context(cls, db, telegram_id, context):
        """Centralized source of truth for user state and data."""
        user = await cls._get_linked_user(db, telegram_id)
        if not user:
            return {"state": "unlinked", "user": None, "dataset": None}
        
        dataset = await cls._get_active_dataset(db, user.user_id, context)
        if not dataset:
            return {"state": "no_data", "user": user, "dataset": None}
        
        return {"state": "ready", "user": user, "dataset": dataset}

    @classmethod
    async def _get_active_keyboard(cls, state, dataset=None):
        """Generates the appropriate interactive keyboard based on state."""
        keyboard = []
        
        if state == "unlinked":
            keyboard.append([InlineKeyboardButton("🔗 Connect My Account", callback_data="show_link_info")])
        elif state == "no_data":
            keyboard.append([InlineKeyboardButton("📂 How to Upload Data", callback_data="show_upload_guide")])
            keyboard.append([InlineKeyboardButton("🔄 Refresh Status", callback_data="main_menu")])
        else:
            # Ready state buttons
            keyboard = [
                [InlineKeyboardButton("📊 Quick Status", callback_data="status_dashboard"), 
                 InlineKeyboardButton("📂 Switch Project", callback_data="list_datasets")],
                [InlineKeyboardButton("🔴 High Priority", callback_data="ai_query_high_priority"),
                 InlineKeyboardButton("📅 Weekly Summary", callback_data="ai_query_weekly")],
                [InlineKeyboardButton("⚠️ Risk Report", callback_data="ai_query_risk")],
                [InlineKeyboardButton("💡 Explain Trends", callback_data="ai_query_trends")]
            ]

        keyboard.append([InlineKeyboardButton("🏠 Main Menu", callback_data="main_menu")])
        return InlineKeyboardMarkup(keyboard)

    @classmethod
    def _format_context_header(cls, dataset):
        """Standard header for all major responses."""
        if not dataset: return ""
        return f"📂 <b>Active Project:</b> <code>{html.escape(dataset.file_name)}</code>\n" + ("━" * 20) + "\n\n"

    # --- COMMANDS ---

    @classmethod
    async def start_command(cls, update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
        """Guided entry point."""
        query = update.callback_query
        user = update.effective_user
        
        async with AsyncSessionLocal() as db:
            ctx = await cls._get_user_context(db, user.id, context)
            state = ctx["state"]
            db_user = ctx["user"]
            dataset = ctx["dataset"]

            if state == "unlinked":
                text = (
                    f"Hello {user.first_name}! 🤖\n\n"
                    "I am your **QA Assistant**, ready to help you analyze your bug reports and project health with AI.\n\n"
                    "First, let's connect your account so I can see your data 👇"
                )
            elif state == "no_data":
                text = (
                    f"Welcome, {db_user.name}! 🚀\n\n"
                    "Your account is connected successfully. Currently, I don't see any bug reports or datasets in your dashboard.\n\n"
                    "**Ready to start?** Upload your first CSV or GitHub URL on the web platform, and I'll be here to analyze it."
                )
            else:
                text = (
                    f"Welcome back, {db_user.name}! 🤖\n\n"
                    f"{cls._format_context_header(dataset)}"
                    "What would you like to explore today? You can use the buttons below or just ask me a question!"
                )

            markup = await cls._get_active_keyboard(state, dataset)
            if query:
                await query.edit_message_text(text, parse_mode="HTML", reply_markup=markup)
            else:
                await update.message.reply_html(text, reply_markup=markup)

    @classmethod
    async def help_command(cls, update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
        help_text = (
            "<b>How to use your QA Assistant:</b>\n\n"
            "💬 <b>Chat:</b> Just type a question! Try: <i>'What are our most critical modules?'</i>\n\n"
            "📊 <b>Status:</b> Use the dashboard for quick severity charts.\n\n"
            "📂 <b>Projects:</b> Switch between different bug reports easily.\n\n"
            "🔗 <b>Connect:</b> Paste your 6-digit code anytime to link your account."
        )
        await update.message.reply_html(help_text, reply_markup=InlineKeyboardMarkup([[InlineKeyboardButton("🏠 Main Menu", callback_data="main_menu")]]))

    # --- CALLBACKS & ROUTING ---

    @classmethod
    async def handle_callback(cls, update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
        query = update.callback_query
        await query.answer()
        data = query.data

        if data == "main_menu":
            await cls.start_command(update, context)
        elif data == "status_dashboard":
            await cls.status_command(update, context)
        elif data == "list_datasets":
            await cls.datasets_command(update, context)
        elif data == "show_link_info":
            await cls._handle_link_instruction(query)
        elif data == "show_upload_guide":
            await cls._handle_upload_guide(query)
        elif data == "help_menu":
            await cls.help_command(update, context)
        elif data == "ai_suggestion":
            await cls._handle_quick_ai_query(update, context, "trends")
        elif data.startswith("ai_query_"):
            await cls._handle_quick_ai_query(update, context, data.replace("ai_query_", ""))
        elif data.startswith("index_ds_"):
            await cls._handle_index_action(update, context, int(data.split("_")[-1]))
        elif data.startswith("select_ds_"):
            await cls._handle_select_action(update, context, int(data.split("_")[-1]))

    @classmethod
    async def _handle_link_instruction(cls, query):
        text = (
            "<b>Let's get you connected!</b> 🔗\n\n"
            "1. Log in to your web dashboard.\n"
            "2. Go to <b>Settings > Telegram Link</b>.\n"
            "3. Copy your 6-digit connection code.\n\n"
            "👉 <b>Now, just paste the code here in our chat!</b>"
        )
        await query.edit_message_text(text, parse_mode="HTML", reply_markup=InlineKeyboardMarkup([[InlineKeyboardButton("🏠 Back", callback_data="main_menu")]]))

    @classmethod
    async def _handle_upload_guide(cls, query):
        text = (
            "<b>Ready to upload data?</b> 📂\n\n"
            "Upload your project data on the web platform using:\n"
            "• Direct CSV/JSON uploads\n"
            "• GitHub Repository sync\n\n"
            "Once uploaded, click <b>Refresh Status</b> below!"
        )
        await query.edit_message_text(text, parse_mode="HTML", reply_markup=InlineKeyboardMarkup([[InlineKeyboardButton("🏠 Back", callback_data="main_menu")]]))

    @classmethod
    async def _handle_quick_ai_query(cls, update, context, query_type):
        prompts = {
            "high_priority": "Identify all high-priority and critical bugs that need immediate attention.",
            "weekly": "Provide a summary of the defect trends and project progress from the last 7 days.",
            "risk": "Analyze the dataset and identify the modules or areas with the highest risk of failure.",
            "trends": "Explain the current bug patterns and severity distribution to help me understand project health."
        }
        prompt = prompts.get(query_type, "Summarize the project status.")
        await cls._perform_ai_response(update, context, prompt)

    @classmethod
    async def _handle_index_action(cls, update, context, ds_id):
        query = update.callback_query
        await query.edit_message_text("⏳ <b>Preparing your data...</b> I'm analyzing the project details for AI search. One moment!", parse_mode="HTML")
        try:
            from app.services.rag_service import index_dataset
            async with AsyncSessionLocal() as db:
                await index_dataset(db, ds_id)
                await query.edit_message_text("✅ <b>Project Ready!</b> Your data is now fully prepared for AI analysis.", 
                                            parse_mode="HTML",
                                            reply_markup=await cls._get_active_keyboard("ready"))
        except Exception as e:
            logger.error(f"Index error: {e}")
            await query.edit_message_text("😕 I couldn't finish preparing the data. Please try again or check the web platform.", 
                                        reply_markup=InlineKeyboardMarkup([[InlineKeyboardButton("🏠 Main Menu", callback_data="main_menu")]]))

    @classmethod
    async def _handle_select_action(cls, update, context, ds_id):
        query = update.callback_query
        async with AsyncSessionLocal() as db:
            res = await db.execute(select(Dataset).where(Dataset.dataset_id == ds_id))
            ds = res.scalar_one_or_none()
            if ds:
                context.user_data["selected_dataset_id"] = ds.dataset_id
                await query.edit_message_text(f"✅ <b>Active Project Changed:</b> {ds.file_name}", parse_mode="HTML",
                                            reply_markup=await cls._get_active_keyboard("ready", ds))

    # --- MESSAGE PROCESSING ---

    @classmethod
    async def handle_message(cls, update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
        if not update.message or not update.message.text: return
        text = update.message.text.strip()
        
        # 1. Detect if it's a 6-digit link code
        import re
        if re.match(r"^\d{6}$", text):
            await cls._handle_auto_link(update, context, text)
            return

        # 2. Otherwise treat as AI Question
        await cls._perform_ai_response(update, context, text)

    @classmethod
    async def _handle_auto_link(cls, update, context, code):
        """UX-friendly automatic linking."""
        await update.message.reply_chat_action("typing")
        async with AsyncSessionLocal() as db:
            try:
                # Reuse the linking logic but with friendly errors
                otp_res = await db.execute(select(OTPCode).where(and_(OTPCode.otp_code == code, OTPCode.purpose == "telegram_link")).order_by(OTPCode.created_at.desc()))
                otp = otp_res.scalars().first()
                
                if not otp or otp.is_used or otp.expires_at < datetime.utcnow():
                    await update.message.reply_text("😕 That code seems invalid or expired. Could you generate a new one from Settings?", 
                                                 reply_markup=InlineKeyboardMarkup([[InlineKeyboardButton("🔄 Try Again", callback_data="show_link_info")]]))
                    return

                user_res = await db.execute(select(User).where(User.email == otp.email))
                user = user_res.scalar_one_or_none()
                if not user:
                    await update.message.reply_text("😕 I couldn't find your account. Please contact support.")
                    return
                
                user.telegram_id = str(update.effective_user.id)
                otp.is_used = 1
                await db.commit()
                
                await update.message.reply_html(f"🎉 <b>Successfully Connected!</b> Welcome to the team, {user.name}.", 
                                             reply_markup=await cls._get_active_keyboard("ready"))
            except Exception as e:
                logger.error(f"Auto-link error: {e}")
                await update.message.reply_text("😕 Something went wrong during the connection. Try again in a bit.")

    @classmethod
    async def _perform_ai_response(cls, update, context, text):
        """Unified AI response engine with premium formatting."""
        query_msg = update.callback_query.message if update.callback_query else update.message
        await query_msg.reply_chat_action("typing")
        
        async with AsyncSessionLocal() as db:
            ctx = await cls._get_user_context(db, update.effective_user.id, context)
            if ctx["state"] == "unlinked":
                await query_msg.reply_html("😕 I don't know who you are yet. Let's connect your account first!", reply_markup=await cls._get_active_keyboard("unlinked"))
                return
            if ctx["state"] == "no_data":
                await query_msg.reply_html("📂 I don't have any data to analyze yet. Upload a bug report on the web platform first!", reply_markup=await cls._get_active_keyboard("no_data"))
                return
            
            dataset = ctx["dataset"]
            user_id = ctx["user"].user_id
            
            try:
                history = context.user_data.get("chat_history", [])
                response = await ask_question(db, user_id, dataset.dataset_id, text, chat_history=history)
                answer = response.get("answer", "No answer found.")

                if "No indexed data found" in answer:
                    text = "⚡ <b>I need to prepare your data before I can analyze it.</b> Do you want me to do it now?"
                    markup = InlineKeyboardMarkup([[InlineKeyboardButton("⚡ Prepare Data Now", callback_data=f"index_ds_{dataset.dataset_id}")]])
                    await query_msg.reply_html(text, reply_markup=markup)
                    return

                history.extend([{"role": "user", "content": text}, {"role": "assistant", "content": answer}])
                context.user_data["chat_history"] = history[-10:]

                # Post-process AI response: Convert Markdown to Telegram-friendly HTML
                import re
                # 1. Convert **Bold** to <b>Bold</b>
                cleaned_answer = re.sub(r"\*\*(.*?)\*\*", r"<b>\1</b>", answer)
                # 2. Standardize bullet points and remove raw markdown markers
                cleaned_answer = re.sub(r"^\s*\*\s+", r"• ", cleaned_answer, flags=re.MULTILINE)
                # 3. Escape HTML if characters are broken? (No, answer is already safe mostly)
                
                header = f"🤖 <b>QA Insight</b>\n{cls._format_context_header(dataset)}"
                formatted_answer = f"{header}{cleaned_answer}\n\n" + ("━" * 10) + "\n<i>Ask me anything else 👇</i>"
                
                await query_msg.reply_html(formatted_answer, reply_markup=await cls._get_active_keyboard("ready", dataset))
            except Exception as e:
                logger.error(f"AI response error: {e}")
                await query_msg.reply_text("😕 I couldn't get an answer from the AI right now. Try a simpler question?")

    # --- OTHER ACTIONS ---

    @classmethod
    async def status_command(cls, update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
        query = update.callback_query if update.callback_query else update.message
        await query.reply_chat_action("typing") if not update.callback_query else None
        
        async with AsyncSessionLocal() as db:
            ctx = await cls._get_user_context(db, update.effective_user.id, context)
            if ctx["state"] != "ready":
                await query.reply_text("😕 I couldn't find any project data to report on.", reply_markup=await cls._get_active_keyboard(ctx["state"]))
                return

            dataset = ctx["dataset"]
            try:
                from app.services.analytics_service import get_severity_distribution
                stats = await get_severity_distribution(db, dataset.dataset_id)
                
                msg = f"📊 <b>Project Status:</b> <code>{html.escape(dataset.file_name)}</code>\n\n"
                
                if not stats:
                    msg += "⚠️ <i>No bug records found in this project.</i>"
                else:
                    emoji_map = {"High": "🔴", "Medium": "🟡", "Low": "🔵"}
                    for s in stats:
                        emoji = emoji_map.get(s['severity'], "⚪")
                        filled = int(s['percentage'] / 10)
                        bar = "█" * filled + "░" * (10 - filled)
                        msg += f"{emoji} <b>{s['severity']}:</b> {s['count']} ({s['percentage']}%)\n"
                        msg += f"<code>{bar}</code>\n\n"
                
                msg += "━" * 10 + "\n<i>Want deeper insights? Try one of these suggestions 👇</i>"
                markup = await cls._get_active_keyboard("ready", dataset)
                
                if update.callback_query: await query.edit_message_text(msg, parse_mode="HTML", reply_markup=markup)
                else: await update.message.reply_html(msg, reply_markup=markup)
            except Exception as e:
                logger.error(f"Status error: {e}")
                await query.reply_text("😕 I couldn't load your project data. Please try again.")

    @classmethod
    async def datasets_command(cls, update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
        query = update.callback_query if update.callback_query else update.message
        async with AsyncSessionLocal() as db:
            ctx = await cls._get_user_context(db, update.effective_user.id, context)
            if ctx["state"] == "unlinked":
                await query.reply_text("😕 Please connect your account first.")
                return
            
            res = await db.execute(select(Dataset).where(Dataset.user_id == ctx["user"].user_id).order_by(Dataset.uploaded_at.desc()).limit(8))
            datasets = res.scalars().all()
            
            if not datasets:
                await query.reply_text("😕 You haven't uploaded any projects yet.", reply_markup=await cls._get_active_keyboard("no_data"))
                return
            
            cur_id = context.user_data.get("selected_dataset_id")
            msg = "<b>📂 Switch Active Project</b>\nSelect a project below to change the context for my AI analysis."
            
            keyboard = []
            for d in datasets:
                label = f"✅ {d.file_name}" if d.dataset_id == cur_id else d.file_name
                keyboard.append([InlineKeyboardButton(label, callback_data=f"select_ds_{d.dataset_id}")])
            
            keyboard.append([InlineKeyboardButton("🏠 Main Menu", callback_data="main_menu")])
            
            if update.callback_query: await query.edit_message_text(msg, parse_mode="HTML", reply_markup=InlineKeyboardMarkup(keyboard))
            else: await query.reply_html(msg, reply_markup=InlineKeyboardMarkup(keyboard))

    # --- HELPERS ---

    @classmethod
    async def _get_linked_user(cls, db, telegram_id) -> Optional[User]:
        res = await db.execute(select(User).where(User.telegram_id == str(telegram_id)))
        return res.scalar_one_or_none()

    @classmethod
    async def _get_active_dataset(cls, db, user_id, context):
        selected_id = context.user_data.get("selected_dataset_id")
        if selected_id:
            res = await db.execute(select(Dataset).where(Dataset.dataset_id == selected_id))
            return res.scalar_one_or_none()
        
        res = await db.execute(select(Dataset).where(Dataset.user_id == user_id).order_by(Dataset.uploaded_at.desc()).limit(1))
        return res.scalar_one_or_none()

    @classmethod
    async def link_command(cls, update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
        """Legacy command support."""
        if not context.args:
            await update.message.reply_text("👉 Just paste your 6-digit code here to connect!")
            return
        await cls._handle_auto_link(update, context, context.args[0])

    @classmethod
    async def select_command(cls, update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
        """Legacy command support."""
        await cls.datasets_command(update, context)

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
