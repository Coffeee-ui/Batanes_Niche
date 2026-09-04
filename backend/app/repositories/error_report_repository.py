from typing import List
from sqlalchemy import select
from sqlalchemy.orm import Session
from app.models.error_report import ErrorReport


class ErrorReportRepository:
    @staticmethod
    def create(db: Session, error_report: ErrorReport) -> ErrorReport:
        db.add(error_report)
        db.commit()
        db.refresh(error_report)
        return error_report

    @staticmethod
    def list_reports(db: Session, limit: int = 50, offset: int = 0) -> List[ErrorReport]:
        stmt = select(ErrorReport).order_by(ErrorReport.timestamp.desc()).offset(offset).limit(limit)
        return list(db.scalars(stmt).all())
