from datetime import datetime, timezone
from typing import Optional
from sqlalchemy import String, Text, DateTime, ForeignKey, Integer
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database.base import Base


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True, index=True)
    timestamp: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), index=True, nullable=False
    )
    actor_id: Mapped[Optional[int]] = mapped_column(
        Integer, ForeignKey("users.id", ondelete="SET NULL"), index=True, nullable=True
    )
    actor_role: Mapped[str] = mapped_column(String(20), nullable=False)
    ip_address: Mapped[Optional[str]] = mapped_column(String(45), nullable=True)
    action: Mapped[str] = mapped_column(String(100), nullable=False)
    target_type: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    target_id: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    details: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # Relationships
    actor: Mapped[Optional["User"]] = relationship("User", foreign_keys=[actor_id])
