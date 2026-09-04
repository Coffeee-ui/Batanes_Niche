import logging
from typing import Optional
from sqlalchemy.orm import Session
from app.models.error_report import ErrorReport
from app.repositories.error_report_repository import ErrorReportRepository

logger = logging.getLogger(__name__)


class ErrorLoggingService:
    @staticmethod
    def record_error(
        db: Session,
        error_message: str,
        endpoint: Optional[str] = None,
        username: Optional[str] = None,
        stack_trace: Optional[str] = None,
        request_data: Optional[str] = None,
    ) -> ErrorReport:
        """
        Records a sanitized unhandled 500 error into the error_reports table.
        """
        # Scrub potential secrets from request_data
        sanitized_request_data = request_data
        if request_data:
            for term in ["password", "token", "otp", "secret"]:
                if term in request_data.lower():
                    # Simple heuristic scrub
                    sanitized_request_data = "[REDACTED_REQUEST_DATA]"
                    break

        report = ErrorReport(
            username=username,
            endpoint=endpoint,
            error_message=error_message,
            stack_trace=stack_trace,
            request_data=sanitized_request_data,
        )
        return ErrorReportRepository.create(db, report)
