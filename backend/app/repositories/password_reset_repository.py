from datetime import datetime, timezone
from typing import Optional
from sqlalchemy import select, update, delete, func
from sqlalchemy.orm import Session
from app.models.password_reset_token import PasswordResetToken


class PasswordResetRepository:
    @staticmethod
    def create_token(db: Session, token: PasswordResetToken) -> PasswordResetToken:
        db.add(token)
        db.commit()
        db.refresh(token)
        return token

    @staticmethod
    def get_latest_active_by_identifier(db: Session, identifier: str) -> Optional[PasswordResetToken]:
        now = datetime.now(timezone.utc)
        stmt = (
            select(PasswordResetToken)
            .where(
                func.lower(PasswordResetToken.identifier) == identifier.strip().lower(),
                PasswordResetToken.used.is_(False),
                PasswordResetToken.expires_at > now,
                PasswordResetToken.attempts_count < 5,
            )
            .order_by(PasswordResetToken.created_at.desc())
        )
        return db.scalars(stmt).first()

    @staticmethod
    def invalidate_active_tokens_for_user(db: Session, user_id: int) -> None:
        stmt = (
            update(PasswordResetToken)
            .where(PasswordResetToken.user_id == user_id, PasswordResetToken.used.is_(False))
            .values(used=True)
        )
        db.execute(stmt)
        db.commit()

    @staticmethod
    def increment_attempts(db: Session, token: PasswordResetToken) -> int:
        token.attempts_count += 1
        if token.attempts_count >= 5:
            token.used = True
        db.add(token)
        db.commit()
        db.refresh(token)
        return token.attempts_count

    @staticmethod
    def mark_used(db: Session, token: PasswordResetToken) -> None:
        token.used = True
        db.add(token)
        db.commit()

    @staticmethod
    def cleanup_expired_resets(db: Session) -> int:
        now = datetime.now(timezone.utc)
        stmt = delete(PasswordResetToken).where(PasswordResetToken.expires_at < now)
        res = db.execute(stmt)
        db.commit()
        return res.rowcount or 0
