from typing import List, Optional
from sqlalchemy.orm import Session
from app.models.notification import Notification
from app.repositories.notification_repository import NotificationRepository


class NotificationService:
    @staticmethod
    def create_notification(
        db: Session,
        user_id: int,
        title: str,
        message: str,
        type: str,
        link: Optional[str] = None,
    ) -> Notification:
        """Creates a persistent in-app notification record."""
        notification = Notification(
            user_id=user_id,
            title=title,
            message=message,
            type=type,
            link=link,
        )
        return NotificationRepository.create(db, notification)

    @staticmethod
    def get_user_notifications(db: Session, user_id: int, limit: int = 50) -> List[Notification]:
        """Retrieves persistent notifications for a user."""
        return NotificationRepository.list_by_user(db, user_id=user_id, limit=limit)

    @staticmethod
    def mark_all_read(db: Session, user_id: int) -> int:
        """Marks all unread notifications for a user as read."""
        return NotificationRepository.mark_all_read(db, user_id=user_id)

    @staticmethod
    def get_unread_count(db: Session, user_id: int) -> int:
        """Returns count of unread notifications for a user."""
        return NotificationRepository.count_unread(db, user_id=user_id)
