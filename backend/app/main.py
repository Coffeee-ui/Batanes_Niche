from datetime import datetime, timezone
import os
from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from slowapi.errors import RateLimitExceeded
from sqlalchemy import text

from app.core.config import settings
from app.database.session import SessionLocal
from app.api.v1 import api_router
from app.admin import admin_router
from app.api.deps import limiter
from app.middleware.logging_middleware import StructuredLoggingMiddleware
from app.middleware.error_handler import global_exception_handler


app = FastAPI(
    title=settings.APP_NAME,
    description="Hyper-localized employment platform for Batanes, Philippines.",
    version="2.0.0",
    docs_url="/docs" if settings.DEBUG else None,
    redoc_url=None,
)

# Attach SlowAPI limiter state
app.state.limiter = limiter


@app.exception_handler(RateLimitExceeded)
async def rate_limit_handler(request: Request, exc: RateLimitExceeded):
    return JSONResponse(
        status_code=status.HTTP_429_TOO_MANY_REQUESTS,
        content={"detail": "Rate limit exceeded. Please try again shortly."},
    )


# Attach global 500 unhandled exception handler
app.add_exception_handler(Exception, global_exception_handler)

# Structured Logging Middleware
app.add_middleware(StructuredLoggingMiddleware)

# CORS Middleware
origins = settings.ALLOWED_ORIGINS if isinstance(settings.ALLOWED_ORIGINS, list) else [settings.ALLOWED_ORIGINS]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)


# Security Headers Middleware (Section 26.8)
@app.middleware("http")
async def add_security_headers(request: Request, call_next):
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    if settings.ENVIRONMENT == "production":
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
    return response


# --- Health & Readiness Endpoints (Section 34) ---

@app.get("/health", tags=["Health"])
def health_check():
    """Liveness probe: verifies process is responsive."""
    return {
        "status": "healthy",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "app": settings.APP_NAME,
        "version": "2.0.0",
    }


@app.get("/ready", tags=["Health"])
def readiness_check():
    """Readiness probe: verifies database connectivity."""
    db = SessionLocal()
    try:
        db.execute(text("SELECT 1"))
        return {
            "status": "ready",
            "database": "connected",
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }
    except Exception as exc:
        return JSONResponse(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            content={
                "status": "not_ready",
                "database": "disconnected",
                "error": str(exc),
            },
        )
    finally:
        db.close()


# Mount Static Files for Admin UI
admin_static_dir = os.path.join(os.path.dirname(__file__), "admin", "static")
if os.path.exists(admin_static_dir):
    app.mount("/admin/static", StaticFiles(directory=admin_static_dir), name="admin_static")

# Mount Routers
app.include_router(api_router)
app.include_router(admin_router)
