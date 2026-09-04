import json
import logging
import time
import uuid
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response

logger = logging.getLogger("api_structured_logger")
logging.basicConfig(level=logging.INFO)

SENSITIVE_KEYS = {"password", "token", "access_token", "refresh_token", "otp", "otp_code", "otp_hash", "authorization", "credentials"}


def scrub_dict(data: dict) -> dict:
    """Recursively redacts sensitive keys from a dictionary."""
    scrubbed = {}
    for k, v in data.items():
        if k.lower() in SENSITIVE_KEYS:
            scrubbed[k] = "[REDACTED]"
        elif isinstance(v, dict):
            scrubbed[k] = scrub_dict(v)
        elif isinstance(v, list):
            scrubbed[k] = [scrub_dict(item) if isinstance(item, dict) else item for item in v]
        else:
            scrubbed[k] = v
    return scrubbed


class StructuredLoggingMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        trace_id = request.headers.get("X-Trace-ID") or str(uuid.uuid4())[:8]
        start_time = time.time()

        response: Response = await call_next(request)

        duration_ms = round((time.time() - start_time) * 1000, 2)
        user_id = getattr(request.state, "user_id", None)

        log_payload = {
            "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
            "level": "INFO",
            "service": "api",
            "endpoint": request.url.path,
            "method": request.method,
            "status_code": response.status_code,
            "duration_ms": duration_ms,
            "user_id": user_id,
            "trace_id": trace_id,
        }

        # Print single-line JSON
        logger.info(json.dumps(log_payload))

        response.headers["X-Trace-ID"] = trace_id
        return response
