from datetime import datetime, timezone
from typing import Optional
from sqlalchemy import select, update, delete
from sqlalchemy.orm import Session
from app.models.token import RefreshToken, RevokedToken


class TokenRepository:
    @staticmethod
    def create_refresh_token(db: Session, token: RefreshToken) -> RefreshToken:
        db.add(token)
        db.commit()
        db.refresh(token)
        return token

    @staticmethod
    def get_refresh_token_by_hash(db: Session, token_hash: str) -> Optional[RefreshToken]:
        stmt = select(RefreshToken).where(RefreshToken.token_hash == token_hash)
        return db.scalars(stmt).first()

    @staticmethod
    def revoke_refresh_token(db: Session, token: RefreshToken) -> None:
        token.revoked = True
        db.add(token)
        db.commit()

    @staticmethod
    def revoke_all_user_refresh_tokens(db: Session, user_id: int) -> None:
        stmt = (
            update(RefreshToken)
            .where(RefreshToken.user_id == user_id, RefreshToken.revoked.is_(False))
            .values(revoked=True)
        )
        db.execute(stmt)
        db.commit()

    @staticmethod
    def add_revoked_jti(db: Session, jti: str, expires_at: datetime) -> RevokedToken:
        revoked = RevokedToken(token_jti=jti, expires_at=expires_at)
        db.add(revoked)
        db.commit()
        db.refresh(revoked)
        return revoked

    @staticmethod
    def is_jti_revoked(db: Session, jti: str) -> bool:
        stmt = select(RevokedToken.id).where(RevokedToken.token_jti == jti)
        return db.scalar(stmt) is not None

    @staticmethod
    def cleanup_expired_tokens(db: Session) -> int:
        now = datetime.now(timezone.utc)
        stmt1 = delete(RefreshToken).where(RefreshToken.expires_at < now)
        res1 = db.execute(stmt1)
        stmt2 = delete(RevokedToken).where(RevokedToken.expires_at < now)
        res2 = db.execute(stmt2)
        db.commit()
        return (res1.rowcount or 0) + (res2.rowcount or 0)
