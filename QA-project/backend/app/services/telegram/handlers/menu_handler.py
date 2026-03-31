import logging
import html
from telegram import Update, InlineKeyboardButton, InlineKeyboardMarkup
from telegram.ext import ContextTypes
from app.database import AsyncSessionLocal
from app.services.telegram.services.state_service import StateService
from app.services.telegram.services.ui_service import UIService

logger = logging.getLogger(__name__)

class MenuHandler:
    @classmethod
    async def status_command(cls, update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
        query = update.callback_query if update.callback_query else update.message
        await query.reply_chat_action("typing") if not update.callback_query else None
        
        async with AsyncSessionLocal() as db:
            ctx = await StateService.get_user_context(db, update.effective_user.id, context)
            if ctx["state"] != "ready":
                await query.reply_text("😕 I couldn't find any project data to report on.", reply_markup=UIService.get_active_keyboard(ctx["state"]))
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
                markup = UIService.get_active_keyboard("ready", dataset)
                
                if update.callback_query: await query.edit_message_text(msg, parse_mode="HTML", reply_markup=markup)
                else: await update.message.reply_html(msg, reply_markup=markup)
            except Exception as e:
                logger.error(f"Status error: {e}")
                await query.reply_text("😕 I couldn't load your project data. Please try again.")

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
