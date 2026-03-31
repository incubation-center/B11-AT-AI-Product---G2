import logging
from telegram import Update, InlineKeyboardButton, InlineKeyboardMarkup
from telegram.ext import ContextTypes
from sqlalchemy import select
from app.database import AsyncSessionLocal
from app.models.datasets import Dataset
from app.services.telegram.services.state_service import StateService
from app.services.telegram.services.ui_service import UIService

logger = logging.getLogger(__name__)

class DatasetHandler:
    @classmethod
    async def datasets_command(cls, update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
        query = update.callback_query if update.callback_query else update.message
        async with AsyncSessionLocal() as db:
            ctx = await StateService.get_user_context(db, update.effective_user.id, context)
            if ctx["state"] == "unlinked":
                await query.reply_text("😕 Please connect your account first.")
                return
            
            res = await db.execute(select(Dataset).where(Dataset.user_id == ctx["user"].user_id).order_by(Dataset.uploaded_at.desc()).limit(8))
            datasets = res.scalars().all()
            
            if not datasets:
                await query.reply_text("😕 You haven't uploaded any projects yet.", reply_markup=UIService.get_active_keyboard("no_data"))
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

    @classmethod
    async def handle_select_action(cls, update: Update, context: ContextTypes.DEFAULT_TYPE, ds_id: int):
        query = update.callback_query
        async with AsyncSessionLocal() as db:
            res = await db.execute(select(Dataset).where(Dataset.dataset_id == ds_id))
            ds = res.scalar_one_or_none()
            if ds:
                context.user_data["selected_dataset_id"] = ds.dataset_id
                await query.edit_message_text(f"✅ <b>Active Project Changed:</b> {ds.file_name}", parse_mode="HTML",
                                            reply_markup=UIService.get_active_keyboard("ready", ds))

    @classmethod
    async def handle_index_action(cls, update: Update, context: ContextTypes.DEFAULT_TYPE, ds_id: int):
        query = update.callback_query
        await query.edit_message_text("⏳ <b>Preparing your data...</b> I'm analyzing the project details for AI search. One moment!", parse_mode="HTML")
        try:
            from app.services.rag_service import index_dataset
            async with AsyncSessionLocal() as db:
                await index_dataset(db, ds_id)
                await query.edit_message_text("✅ <b>Project Ready!</b> Your data is now fully prepared for AI analysis.", 
                                            parse_mode="HTML",
                                            reply_markup=UIService.get_active_keyboard("ready"))
        except Exception as e:
            logger.error(f"Index error: {e}")
            await query.edit_message_text("😕 I couldn't finish preparing the data. Please try again or check the web platform.", 
                                        reply_markup=InlineKeyboardMarkup([[InlineKeyboardButton("🏠 Main Menu", callback_data="main_menu")]]))
