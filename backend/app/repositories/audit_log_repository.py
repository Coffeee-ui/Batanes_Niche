from typing import List
from sqlalchemy import select, func
from sqlalchemy.orm import Session
from app.models.audit_log import AuditLog


class AuditLogRepository:
    @staticmethod
    def create(db: Session, audit_log: AuditLog) -> AuditLog:
        db.add(audit_log)
        db.commit()
        db.refresh(audit_log)
        return audit_log

    @staticmethod
    def list_logs(db: Session, limit: int = 50, offset: int = 0) -> List[AuditLog]:
        stmt = select(AuditLog).order_by(AuditLog.timestamp.desc()).offset(offset).limit(limit)
        return list(db.scalars(stmt).all())

    @staticmethod
    def count_logs(db: Session) -> int:
        stmt = select(func.count(AuditLog.id))
        return db.scalar(stmt) or 0
