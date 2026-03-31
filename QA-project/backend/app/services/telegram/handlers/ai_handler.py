import logging
import re
from telegram import Update, InlineKeyboardButton, InlineKeyboardMarkup
from telegram.ext import ContextTypes
from app.database import AsyncSessionLocal
from app.services.rag_service import ask_question
from app.services.telegram.services.state_service import StateService
from app.services.telegram.services.ui_service import UIService

logger = logging.getLogger(__name__)

class AIHandler:
    @classmethod
    async def handle_quick_ai_query(cls, update: Update, context: ContextTypes.DEFAULT_TYPE, query_type: str):
        prompts = {
            "high_priority": "Identify all high-priority and critical bugs that need immediate attention.",
            "weekly": "Provide a summary of the defect trends and project progress from the last 7 days.",
            "risk": "Analyze the dataset and identify the modules or areas with the highest risk of failure.",
            "trends": "Explain the current bug patterns and severity distribution to help me understand project health."
        }
        prompt = prompts.get(query_type, "Summarize the project status.")
        await cls.perform_ai_response(update, context, prompt)

    @classmethod
    async def perform_ai_response(cls, update: Update, context: ContextTypes.DEFAULT_TYPE, text: str):
        """Unified AI response engine with premium formatting."""
        query_msg = update.callback_query.message if update.callback_query else update.message
        await query_msg.reply_chat_action("typing")
        
        async with AsyncSessionLocal() as db:
            ctx = await StateService.get_user_context(db, update.effective_user.id, context)
            if ctx["state"] == "unlinked":
                await query_msg.reply_html("😕 I don't know who you are yet. Let's connect your account first!", reply_markup=UIService.get_active_keyboard("unlinked"))
                return
            if ctx["state"] == "no_data":
                await query_msg.reply_html("📂 I don't have any data to analyze yet. Upload a bug report on the web platform first!", reply_markup=UIService.get_active_keyboard("no_data"))
                return
            
            dataset = ctx["dataset"]
            user_id = ctx["user"].user_id
            
            try:
                history = context.user_data.get("chat_history", [])
                response = await ask_question(db, user_id, dataset.dataset_id, text, chat_history=history)
                answer = response.get("answer", "No answer found.")

                if "No indexed data found" in answer:
                    text_msg = "⚡ <b>I need to prepare your data before I can analyze it.</b> Do you want me to do it now?"
                    markup = InlineKeyboardMarkup([[InlineKeyboardButton("⚡ Prepare Data Now", callback_data=f"index_ds_{dataset.dataset_id}")]])
                    await query_msg.reply_html(text_msg, reply_markup=markup)
                    return

                history.extend([{"role": "user", "content": text}, {"role": "assistant", "content": answer}])
                context.user_data["chat_history"] = history[-10:]
                
                # Post-process AI response
                cleaned_answer = re.sub(r"\*\*(.*?)\*\*", r"<b>\1</b>", answer)
                cleaned_answer = re.sub(r"^\s*\*\s+", r"• ", cleaned_answer, flags=re.MULTILINE)
                
                header = f"🤖 <b>QA Insight</b>\n{UIService.format_context_header(dataset)}"
                formatted_answer = f"{header}{cleaned_answer}\n\n" + ("━" * 10) + "\n<i>Ask me anything else 👇</i>"
                
                await query_msg.reply_html(formatted_answer, reply_markup=UIService.get_active_keyboard("ready", dataset))
            except Exception as e:
                logger.error(f"AI response error: {e}")
                await query_msg.reply_text("😕 I couldn't get an answer from the AI right now. Try a simpler question?")
