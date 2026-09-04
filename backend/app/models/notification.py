from datetime import datetime, timezone
from typing import Optional
from sqlalchemy import String, Text, DateTime, CheckConstraint, ForeignKey, Integer, Boolean
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database.base import Base


class Notification(Base):
    __tablename__ = "notifications"
    __table_args__ = (
        CheckConstraint(
            "type IN ('new_application', 'application_status_updated')",
            name="ck_notifications_type",
        ),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True, index=True)
    user_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False
    )
    title: Mapped[str] = mapped_column(String(150), nullable=False)
    message: Mapped[str] = mapped_column(Text, nullable=False)
    type: Mapped[str] = mapped_column(String(50), nullable=False)
    is_read: Mapped[bool] = mapped_column(Boolean, default=False, index=True, nullable=False)
    link: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False
    )

    # Relationships
    user: Mapped["User"] = relationship("User", back_populates="notifications")
