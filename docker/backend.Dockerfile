# ============================================================
# Batanes Niche Job Portal - Backend Dockerfile
# Multi-stage production build for FastAPI + SQLAlchemy backend
# ============================================================

# Stage 1: Build & wheels
FROM python:3.11-slim AS builder

WORKDIR /build

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
    gcc \
    && rm -rf /var/lib/apt/lists/*

COPY backend/requirements.txt .
RUN pip wheel --no-cache-dir --no-deps --wheel-dir /build/wheels -r requirements.txt


# Stage 2: Final minimal runtime
FROM python:3.11-slim AS runner

WORKDIR /app

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PORT=8000 \
    PYTHONPATH=/app

RUN apt-get update && apt-get install -y --no-install-recommends \
    libpq5 \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Create unprivileged system user
RUN groupadd -g 1001 appgroup && \
    useradd -u 1001 -g appgroup -s /bin/sh -m appuser

# Install pre-built wheels
COPY --from=builder /build/wheels /wheels
COPY backend/requirements.txt .
RUN pip install --no-cache-dir /wheels/* && rm -rf /wheels

# Copy application source code
COPY --chown=appuser:appgroup backend /app

# Ensure uploads directory exists with correct permissions
RUN mkdir -p /app/uploads /app/static && chown -R appuser:appgroup /app

USER appuser

EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1

# Start gunicorn with uvicorn workers
CMD ["gunicorn", "app.main:app", "-w", "4", "-k", "uvicorn.workers.UvicornWorker", "-b", "0.0.0.0:8000", "--access-logfile", "-", "--error-logfile", "-"]
