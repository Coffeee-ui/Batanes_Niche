from datetime import datetime, timezone
from sqlalchemy import String, DateTime, ForeignKey, Integer, Boolean
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database.base import Base


class RefreshToken(Base):
    __tablename__ = "refresh_tokens"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True, index=True)
    user_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False
    )
    token_hash: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    revoked: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False
    )

    # Relationships
    user: Mapped["User"] = relationship("User", back_populates="refresh_tokens")


class RevokedToken(Base):
    __tablename__ = "revoked_tokens"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True, index=True)
    token_jti: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    revoked_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False
    )
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
