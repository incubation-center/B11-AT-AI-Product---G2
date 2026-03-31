import logging
from telegram import Update
from telegram.ext import ContextTypes
from app.services.telegram.handlers.start_handler import StartHandler
from app.services.telegram.handlers.menu_handler import MenuHandler
from app.services.telegram.handlers.dataset_handler import DatasetHandler
from app.services.telegram.handlers.link_handler import LinkHandler
from app.services.telegram.handlers.ai_handler import AIHandler

logger = logging.getLogger(__name__)

class CallbackRouter:
    @classmethod
    async def handle_callback(cls, update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
        query = update.callback_query
        await query.answer()
        data = query.data

        if data == "main_menu":
            await StartHandler.start_command(update, context)
        elif data == "status_dashboard":
            await MenuHandler.status_command(update, context)
        elif data == "list_datasets":
            await DatasetHandler.datasets_command(update, context)
        elif data == "show_link_info":
            await LinkHandler.handle_link_instruction(query)
        elif data == "show_upload_guide":
            # Direct reuse of instruction from LinkHandler if upload guide is similar, or create it
            await cls._handle_upload_guide(query)
        elif data == "help_menu":
            await MenuHandler.help_command(update, context)
        elif data == "ai_suggestion": # Legacy support
            await AIHandler.handle_quick_ai_query(update, context, "trends")
        elif data.startswith("ai_query_"):
            await AIHandler.handle_quick_ai_query(update, context, data.replace("ai_query_", ""))
        elif data.startswith("index_ds_"):
            await DatasetHandler.handle_index_action(update, context, int(data.split("_")[-1]))
        elif data.startswith("select_ds_"):
            await DatasetHandler.handle_select_action(update, context, int(data.split("_")[-1]))

    @classmethod
    async def _handle_upload_guide(cls, query):
        from telegram import InlineKeyboardButton, InlineKeyboardMarkup
        text = (
            "<b>Ready to upload data?</b> 📂\n\n"
            "Upload your project data on the web platform using:\n"
            "• Direct CSV/JSON uploads\n"
            "• GitHub Repository sync\n\n"
            "Once uploaded, click <b>Refresh Status</b> below!"
        )
        await query.edit_message_text(text, parse_mode="HTML", reply_markup=InlineKeyboardMarkup([[InlineKeyboardButton("🏠 Back", callback_data="main_menu")]]))
