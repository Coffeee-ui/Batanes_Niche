from typing import List
from sqlalchemy import select, update, func
from sqlalchemy.orm import Session
from app.models.notification import Notification


class NotificationRepository:
    @staticmethod
    def create(db: Session, notification: Notification) -> Notification:
        db.add(notification)
        db.flush()      # assigns the DB-generated primary key without committing
        db.refresh(notification)  # reload the object so all fields (id, created_at) are populated
        return notification

    @staticmethod
    def list_by_user(db: Session, user_id: int, limit: int = 50) -> List[Notification]:
        stmt = (
            select(Notification)
            .where(Notification.user_id == user_id)
            .order_by(Notification.created_at.desc())
            .limit(limit)
        )
        return list(db.scalars(stmt).all())

    @staticmethod
    def mark_all_read(db: Session, user_id: int) -> int:
        stmt = (
            update(Notification)
            .where(Notification.user_id == user_id, Notification.is_read.is_(False))
            .values(is_read=True)
        )
        res = db.execute(stmt)
        db.commit()
        return res.rowcount or 0

    @staticmethod
    def count_unread(db: Session, user_id: int) -> int:
        stmt = select(func.count(Notification.id)).where(
            Notification.user_id == user_id, Notification.is_read.is_(False)
        )
        return db.scalar(stmt) or 0
