import logging
import re
from datetime import datetime
from telegram import Update, InlineKeyboardButton, InlineKeyboardMarkup
from telegram.ext import ContextTypes
from sqlalchemy import select, and_
from app.database import AsyncSessionLocal
from app.models.users import User
from app.models.otp_codes import OTPCode
from app.services.telegram.services.ui_service import UIService

logger = logging.getLogger(__name__)

class LinkHandler:
    @classmethod
    async def handle_link_instruction(cls, query):
        text = (
            "<b>Let's get you connected!</b> 🔗\n\n"
            "1. Log in to your web dashboard.\n"
            "2. Open the <b>Profile & Settings</b> menu from the top-right.\n"
            "3. Click <b>Generate Connection Code</b> in the Telegram section.\n\n"
            "👉 <b>Now, just paste the 6-digit code here!</b>"
        )
        await query.edit_message_text(text, parse_mode="HTML", reply_markup=InlineKeyboardMarkup([[InlineKeyboardButton("🏠 Back", callback_data="main_menu")]]))

    @classmethod
    async def handle_auto_link(cls, update: Update, context: ContextTypes.DEFAULT_TYPE, code: str):
        """UX-friendly automatic linking."""
        await update.message.reply_chat_action("typing")
        async with AsyncSessionLocal() as db:
            try:
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
                                             reply_markup=UIService.get_active_keyboard("ready"))
            except Exception as e:
                logger.error(f"Auto-link error: {e}")
                await update.message.reply_text("😕 Something went wrong during the connection. Try again in a bit.")

    @classmethod
    async def link_command(cls, update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
        """Legacy command support."""
        if not context.args:
            await update.message.reply_text("👉 Just paste your 6-digit code here to connect!")
            return
        await cls.handle_auto_link(update, context, context.args[0])
