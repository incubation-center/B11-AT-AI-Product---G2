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
            "<b>Welcome to your AI QA Assistant!</b> 🤖\n\n"
            "I'm here to help you understand your bug reports and project health. Here's a quick guide on how to interact with me:\n\n"
            "💬 <b>Ask Anything:</b> Just type a message! I can answer complex questions like:\n"
            "<i>- 'What are the top 3 high-priority issues?'</i>\n"
            "<i>- 'Which developer has the most open bugs?'</i>\n\n"
            "📊 <b>Dashboard:</b> Click <code>📊 Quick Status</code> in the main menu to see visual severity reports.\n\n"
            "📂 <b>Projects:</b> If you have multiple bug reports, use <code>📂 Switch Project</code> to choose which one I should analyze.\n\n"
            "🚀 <b>Getting Started:</b> If you haven't linked your account yet, just type <b>/link</b> or paste your 6-digit code!"
        )
        markup = InlineKeyboardMarkup([[InlineKeyboardButton("🏠 Main Menu", callback_data="main_menu")]])
        
        if update.callback_query:
            await update.callback_query.edit_message_text(help_text, parse_mode="HTML", reply_markup=markup)
        else:
            await update.message.reply_html(help_text, reply_markup=markup)
