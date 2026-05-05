# ⚙️ QA Defect Analytics - Backend API

[![Framework](https://img.shields.io/badge/FastAPI-0.100+-009688?logo=fastapi)](https://fastapi.tiangolo.com/)
[![Python](https://img.shields.io/badge/Python-3.10+-3776AB?logo=python)](https://www.python.org/)
[![Database](https://img.shields.io/badge/Database-PostgreSQL-4169E1?logo=postgresql)](https://www.postgresql.org/)
[![ORM](https://img.shields.io/badge/ORM-SQLAlchemy-D71F00)](https://www.sqlalchemy.org/)

The backend engine for the QA Defect Analytics platform, providing high-performance RESTful APIs, AI-powered classification, and real-time Telegram bot services.

---

## 🚀 Getting Started

### Prerequisites
- Python 3.10+
- PostgreSQL
- Virtual Environment (venv/conda)

### Installation

1.  **Navigate to directory**:
    ```bash
    cd QA-project/backend
    ```

2.  **Install Dependencies**:
    ```bash
    pip install -r requirements.txt
    ```

3.  **Start the Server**:
    ```bash
    python -c "import uvicorn; uvicorn.run('app.main:app', host='0.0.0.0', port=8000, reload=True)"
    ```

---

## 🛠️ API Modules & Features

-   **Auth**: Secure JWT-based authentication and user authorization.
-   **Analytics**: AI-driven defect trend analysis and pattern recognition.
-   **NLP/AI**: Automated categorization of QA defects using Large Language Models.
-   **Telegram Service**: Integrated bot handlers for user onboarding and system notifications.
-   **Reporting**: Automated generation of PDF/Excel reports for QA metrics.

---

## 📂 Project Structure

```text
backend/
├── alembic/              # Database migration scripts
├── app/                  # Main Application logic
│   ├── routes/           # API endpoints (FastAPI Routers)
│   ├── services/         # Business logic & 3rd party integrations
│   ├── models/           # SQLAlchemy database models
│   ├── schemas/          # Pydantic data validation models
│   ├── dependencies/     # FastAPI context dependencies
│   └── config.py         # Configuration management
├── reports/              # Storage for generated report files
└── tests/                # Unit and integration tests
```

---

## 📖 API Documentation

Once the server is running, you can access the interactive Swagger documentation at:
-   **Swagger UI**: [http://localhost:8000/docs](http://localhost:8000/docs)
-   **ReDoc**: [http://localhost:8000/redoc](http://localhost:8000/redoc)
