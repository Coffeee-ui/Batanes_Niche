from typing import List
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.api.deps import get_db, require_authenticated
from app.models.user import User
from app.schemas.notification import NotificationOut
from app.schemas.common import MessageOut
from app.services.notification_service import NotificationService

router = APIRouter(prefix="/notifications", tags=["Notifications"])


@router.get("", response_model=List[NotificationOut], status_code=status.HTTP_200_OK)
def list_notifications(
    limit: int = Query(50, ge=1, le=100),
    current_user: User = Depends(require_authenticated),
    db: Session = Depends(get_db),
):
    """Lists persistent notifications for the authenticated caller."""
    return NotificationService.get_user_notifications(db, user_id=current_user.id, limit=limit)


@router.put("/read", response_model=MessageOut, status_code=status.HTTP_200_OK)
def mark_all_notifications_read(
    current_user: User = Depends(require_authenticated),
    db: Session = Depends(get_db),
):
    """Marks all unread notifications for the caller as read."""
    count = NotificationService.mark_all_read(db, user_id=current_user.id)
    return MessageOut(message=f"Marked {count} notifications as read.")
