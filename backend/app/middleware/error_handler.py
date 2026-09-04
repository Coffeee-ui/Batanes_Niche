import traceback
import uuid
import logging
from fastapi import Request, status
from fastapi.responses import JSONResponse
from app.database.session import SessionLocal
from app.services.error_logging_service import ErrorLoggingService

logger = logging.getLogger(__name__)


async def global_exception_handler(request: Request, exc: Exception):
    """
    Catches all unhandled 500 exceptions (Section 27.3):
    1. Generates sanitized trace_id
    2. Writes scrubbed incident to error_reports table
    3. Returns clean user error response
    4. Never leaks Python tracebacks to clients
    """
    trace_id = str(uuid.uuid4())[:8]
    error_msg = str(exc)
    stack_trace = traceback.format_exc()

    logger.error(f"[TRACE_ID: {trace_id}] Unhandled Exception on {request.method} {request.url.path}: {error_msg}")

    # Record to error_reports table in a isolated session
    try:
        db = SessionLocal()
        try:
            username = getattr(request.state, "username", None)
            ErrorLoggingService.record_error(
                db=db,
                error_message=f"[{trace_id}] {error_msg}",
                endpoint=request.url.path,
                username=username,
                stack_trace=stack_trace,
            )
        finally:
            db.close()
    except Exception as db_exc:
        logger.error(f"Failed to record incident to error_reports table: {db_exc}")

    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "detail": "An internal error occurred. Please contact support.",
            "trace_id": trace_id,
        },
        headers={"X-Trace-ID": trace_id},
    )
