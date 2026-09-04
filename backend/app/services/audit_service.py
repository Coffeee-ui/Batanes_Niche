import json
import logging
from typing import Any, Dict, Optional
from sqlalchemy.orm import Session
from app.models.audit_log import AuditLog
from app.repositories.audit_log_repository import AuditLogRepository

logger = logging.getLogger(__name__)


class AuditService:
    @staticmethod
    def log_event(
        db: Session,
        action: str,
        actor_role: str,
        actor_id: Optional[int] = None,
        ip_address: Optional[str] = None,
        target_type: Optional[str] = None,
        target_id: Optional[int] = None,
        details: Optional[Dict[str, Any]] = None,
    ) -> AuditLog:
        """
        Creates an append-only audit log entry.
        Sanitizes details to ensure zero secrets or passwords are recorded.
        """
        sanitized_details = None
        if details:
            cleaned = {}
            for k, v in details.items():
                if any(secret_term in k.lower() for secret_term in ["password", "token", "otp", "secret", "hash"]):
                    cleaned[k] = "[REDACTED]"
                else:
                    cleaned[k] = v
            try:
                sanitized_details = json.dumps(cleaned)
            except Exception:
                sanitized_details = str(cleaned)

        audit_entry = AuditLog(
            actor_id=actor_id,
            actor_role=actor_role,
            ip_address=ip_address,
            action=action,
            target_type=target_type,
            target_id=target_id,
            details=sanitized_details,
        )
        return AuditLogRepository.create(db, audit_entry)
