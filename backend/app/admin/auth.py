from typing import Optional, Tuple
import secrets
from fastapi import Request, HTTPException, status
from itsdangerous import URLSafeTimedSerializer, BadSignature, SignatureExpired
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.user import User
from app.repositories.user_repository import UserRepository

serializer = URLSafeTimedSerializer(settings.ADMIN_SESSION_SECRET)
ADMIN_COOKIE_NAME = "batanes_admin_session"
CSRF_COOKIE_NAME = "batanes_admin_csrf"
SESSION_MAX_AGE = 43200  # 12 hours


def create_admin_session_cookie(user: User) -> Tuple[str, str]:
    """Creates a signed session token and a CSRF token."""
    session_data = {
        "user_id": user.id,
        "username": user.username,
        "role": user.role,
    }
    session_token = serializer.dumps(session_data, salt="admin-session")
    csrf_token = secrets.token_hex(16)
    return session_token, csrf_token


def get_admin_user_from_request(request: Request, db: Session) -> Optional[User]:
    """
    Extracts and validates admin session from HttpOnly cookie.
    Enforces that user role == 'admin' and account_status == 'active'.
    Immediately rejects if suspended or inactive (Section 17.1.3).
    """
    session_cookie = request.cookies.get(ADMIN_COOKIE_NAME)
    if not session_cookie:
        return None

    try:
        data = serializer.loads(session_cookie, salt="admin-session", max_age=SESSION_MAX_AGE)
    except (BadSignature, SignatureExpired):
        return None

    user_id = data.get("user_id")
    if not user_id:
        return None

    user = UserRepository.get_by_id(db, int(user_id))
    if not user or user.role != "admin" or user.account_status != "active":
        return None

    return user


def verify_csrf_token(request: Request, submitted_csrf: Optional[str]) -> bool:
    """Verifies that submitted CSRF token matches the value in the CSRF cookie."""
    cookie_csrf = request.cookies.get(CSRF_COOKIE_NAME)
    if not cookie_csrf or not submitted_csrf:
        return False
    return secrets.compare_digest(cookie_csrf, submitted_csrf)
