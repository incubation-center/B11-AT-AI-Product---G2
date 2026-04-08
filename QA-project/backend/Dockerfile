# ── Stage 1: Builder ──────────────────────────────────────────────
FROM python:3.11-slim AS builder

WORKDIR /build

# Install build dependencies for native packages (psycopg2, etc.)
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .

# Install CPU-only PyTorch first
RUN pip install --no-cache-dir --prefix=/install torch --index-url https://download.pytorch.org/whl/cpu

# Install remaining dependencies passing the CPU-only registry explicitly so it doesn't try to upgrade torch to GPU
RUN pip install --no-cache-dir --prefix=/install -r requirements.txt --extra-index-url https://download.pytorch.org/whl/cpu


# ── Stage 2: Runtime ──────────────────────────────────────────────
FROM python:3.11-slim

WORKDIR /app

# Install only runtime dependencies (no compilers)
RUN apt-get update && apt-get install -y --no-install-recommends \
    libpq5 \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy installed packages from builder
COPY --from=builder /install /usr/local

# Copy application code
COPY . .

# Create non-root user for security
RUN useradd --create-home --shell /bin/bash appuser
USER appuser

# Expose the port uvicorn will listen on
EXPOSE 8000

# Health check for Coolify
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1

# Environment variables are injected by Coolify at runtime — no ARG/ENV needed here

# Start the FastAPI app with uvicorn
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
