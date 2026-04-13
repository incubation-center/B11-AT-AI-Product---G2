import logging
import re
from telegram import Update, InlineKeyboardButton, InlineKeyboardMarkup
from telegram.ext import ContextTypes
from app.database import AsyncSessionLocal
from app.services.rag_service import ask_question, get_test_cases
from app.services.excel_service import create_test_case_excel
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
    async def handle_ask_question_help(cls, update: Update, context: ContextTypes.DEFAULT_TYPE):
        """Instructs the user on how to ask custom questions."""
        query = update.callback_query
        await query.answer()
        
        async with AsyncSessionLocal() as db:
            ctx = await StateService.get_user_context(db, update.effective_user.id, context)
            header = UIService.format_context_header(ctx.get("dataset"))
            
        text = (
            f"{header}"
            "💬 <b>Ask me anything!</b>\n\n"
            "You can type any question about your project directly in the chat. For example:\n"
            "• <i>'Which module has the most critical bugs?'</i>\n"
            "• <i>'What is the resolution rate for the Auth module?'</i>\n"
            "• <i>'Summarize all bugs related to the database.'</i>\n\n"
            "I will analyze your dataset and provide a data-driven answer."
        )
        await query.message.reply_html(text, reply_markup=UIService.get_active_keyboard("ready", ctx.get("dataset")))

    @classmethod
    async def handle_generate_test_cases_excel(cls, update: Update, context: ContextTypes.DEFAULT_TYPE):
        """Generates QA test cases and sends as an Excel document."""
        query = update.callback_query
        await query.answer("Generating Excel file... This may take a few seconds.")
        
        loading_msg = await query.message.reply_html("⏳ <b>Generating QA Test Cases...</b>\n<i>I'm analyzing your defect data to build professional test scenarios.</i>")
        await query.message.reply_chat_action("upload_document")

        async with AsyncSessionLocal() as db:
            ctx = await StateService.get_user_context(db, update.effective_user.id, context)
            if ctx["state"] != "ready":
                await loading_msg.edit_text("😕 I need a project with data to generate test cases.")
                return
            
            dataset = ctx["dataset"]
            try:
                result = await get_test_cases(db, dataset.dataset_id)
                test_cases = result.get("test_cases", [])
                
                if not test_cases:
                    await loading_msg.edit_text("😕 I couldn't generate any test cases from this dataset.")
                    return
                
                excel_file = create_test_case_excel(test_cases)
                file_name = f"QA_TestCases_{dataset.file_name.split('.')[0]}.xlsx"
                
                await query.message.reply_document(
                    document=excel_file,
                    filename=file_name,
                    caption=f"✅ <b>QA Test Cases Generated</b>\nProject: <code>{dataset.file_name}</code>\nGenerated 10 scenarios based on your defect data.",
                    parse_mode="HTML"
                )
                await loading_msg.delete()
            except ValueError as ve:
                logger.warning(f"Excel generation check: {ve}")
                text_msg = "⚡ <b>I need to prepare your data before I can generate test cases.</b> Do you want me to do it now?"
                markup = InlineKeyboardMarkup([[InlineKeyboardButton("⚡ Prepare Data Now", callback_data=f"index_ds_{dataset.dataset_id}")]])
                await loading_msg.edit_text(text_msg, reply_markup=markup)
            except Exception as e:
                logger.error(f"Excel generation error: {e}")
                await loading_msg.edit_text("😕 Something went wrong while generating the Excel file.")

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
