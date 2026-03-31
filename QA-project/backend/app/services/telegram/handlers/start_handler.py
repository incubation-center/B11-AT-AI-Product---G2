from telegram import Update
from telegram.ext import ContextTypes
from app.database import AsyncSessionLocal
from app.services.telegram.services.state_service import StateService
from app.services.telegram.services.ui_service import UIService

class StartHandler:
    @classmethod
    async def start_command(cls, update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
        """Guided entry point."""
        query = update.callback_query
        user = update.effective_user
        
        async with AsyncSessionLocal() as db:
            ctx = await StateService.get_user_context(db, user.id, context)
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
                    f"{UIService.format_context_header(dataset)}"
                    "What would you like to explore today? You can use the buttons below or just ask me a question!"
                )

            markup = UIService.get_active_keyboard(state, dataset)
            if query:
                await query.edit_message_text(text, parse_mode="HTML", reply_markup=markup)
            else:
                await update.message.reply_html(text, reply_markup=markup)
