import html
from telegram import InlineKeyboardButton, InlineKeyboardMarkup

class UIService:
    @classmethod
    def get_active_keyboard(cls, state, dataset=None):
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
                [InlineKeyboardButton("💬 Ask a Question", callback_data="ask_question_help")],
                [InlineKeyboardButton("📝 Generate QA Test Cases (Excel)", callback_data="generate_test_cases_excel")],
                [InlineKeyboardButton("🔴 High Priority", callback_data="ai_query_high_priority"),
                 InlineKeyboardButton("📅 Weekly Summary", callback_data="ai_query_weekly")],
                [InlineKeyboardButton("⚠️ Risk Report", callback_data="ai_query_risk"),
                 InlineKeyboardButton("💡 Explain Trends", callback_data="ai_query_trends")],
                [InlineKeyboardButton("❓ Quick Guide", callback_data="show_help")]
            ]

        keyboard.append([InlineKeyboardButton("🏠 Main Menu", callback_data="main_menu")])
        return InlineKeyboardMarkup(keyboard)

    @classmethod
    def format_context_header(cls, dataset):
        """Standard header for all major responses."""
        if not dataset: return ""
        return f"📂 <b>Active Project:</b> <code>{html.escape(dataset.file_name)}</code>\n" + ("━" * 20) + "\n\n"
