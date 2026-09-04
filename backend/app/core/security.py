from datetime import datetime, timedelta, timezone
from typing import Any, Dict, Optional, Tuple
import hashlib
import secrets
import uuid
import bcrypt
import jwt

from app.core.config import settings


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verifies a plain password against a bcrypt hash."""
    try:
        return bcrypt.checkpw(
            plain_password.encode("utf-8"),
            hashed_password.encode("utf-8")
        )
    except Exception:
        return False


def get_password_hash(password: str) -> str:
    """Computes a bcrypt hash with work factor >= 12."""
    salt = bcrypt.gensalt(rounds=12)
    return bcrypt.hashpw(password.encode("utf-8"), salt).decode("utf-8")


def create_access_token(
    subject: str,
    username: str,
    role: str,
    expires_delta: Optional[timedelta] = None,
    jti: Optional[str] = None
) -> Tuple[str, str, datetime]:
    """
    Creates a JWT access token with required claims:
    sub (user_id), username, role, jti, exp, iat.
    """
    now = datetime.now(timezone.utc)
    if expires_delta:
        expire = now + expires_delta
    else:
        expire = now + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)

    token_jti = jti or str(uuid.uuid4())
    to_encode: Dict[str, Any] = {
        "sub": str(subject),
        "username": username,
        "role": role,
        "jti": token_jti,
        "iat": int(now.timestamp()),
        "exp": int(expire.timestamp()),
    }
    encoded_jwt = jwt.encode(to_encode, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)
    return encoded_jwt, token_jti, expire


def decode_access_token(token: str) -> Optional[Dict[str, Any]]:
    """Decodes and validates a JWT access token."""
    try:
        payload = jwt.decode(
            token,
            settings.JWT_SECRET_KEY,
            algorithms=[settings.JWT_ALGORITHM]
        )
        return payload
    except (jwt.PyJWTError, Exception):
        return None


def generate_refresh_token() -> Tuple[str, str, datetime]:
    """
    Generates a cryptographically secure 32-byte URL-safe refresh token,
    its SHA-256 hash for database storage, and expiration datetime (7 days).
    """
    raw_token = secrets.token_urlsafe(32)
    token_hash = hash_refresh_token(raw_token)
    expires_at = datetime.now(timezone.utc) + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    return raw_token, token_hash, expires_at


def hash_refresh_token(raw_token: str) -> str:
    """Computes SHA-256 hash of a refresh token."""
    return hashlib.sha256(raw_token.encode("utf-8")).hexdigest()


def generate_six_digit_otp() -> str:
    """
    Generates a cryptographically secure 6-digit OTP (100000 - 999999).
    secrets.randbelow(900000) + 100000
    """
    return str(secrets.randbelow(900000) + 100000)


def hash_otp(otp_code: str) -> str:
    """
    Hashes a 6-digit OTP using bcrypt for brute-force resistance (Section 10.1).
    """
    salt = bcrypt.gensalt(rounds=10)
    return bcrypt.hashpw(otp_code.encode("utf-8"), salt).decode("utf-8")


def verify_otp(plain_otp: str, hashed_otp: str) -> bool:
    """Verifies a 6-digit OTP against its bcrypt hash."""
    try:
        return bcrypt.checkpw(plain_otp.encode("utf-8"), hashed_otp.encode("utf-8"))
    except Exception:
        return False

