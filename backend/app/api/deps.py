from typing import Generator, Optional
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from slowapi import Limiter
from slowapi.util import get_remote_address

from app.core.security import decode_access_token
from app.database.session import get_db
from app.models.user import User
from app.repositories.user_repository import UserRepository
from app.repositories.token_repository import TokenRepository

limiter = Limiter(key_func=get_remote_address)

oauth2_scheme = OAuth2PasswordBearer(
    tokenUrl="/api/v1/auth/login",
    auto_error=False,
)


def get_current_user_optional(
    token: Optional[str] = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
) -> Optional[User]:
    """Extracts and verifies current user if token is present, returns None otherwise."""
    if not token:
        return None
    payload = decode_access_token(token)
    if not payload:
        return None

    # Check revoked JTI
    jti = payload.get("jti")
    if jti and TokenRepository.is_jti_revoked(db, jti):
        return None

    user_id = payload.get("sub")
    if not user_id:
        return None

    user = UserRepository.get_by_id(db, int(user_id))
    if not user or user.account_status != "active":
        return None

    return user


def require_authenticated(
    token: Optional[str] = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
) -> User:
    """Enforces authenticated user context with valid, unrevoked JWT and active account status."""
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication credentials were not provided.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    payload = decode_access_token(token)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired access token.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Check revoked token blacklist
    jti = payload.get("jti")
    if jti and TokenRepository.is_jti_revoked(db, jti):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has been revoked.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token claims.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user = UserRepository.get_by_id(db, int(user_id))
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if user.account_status == "suspended":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Your account has been suspended.",
        )

    if user.account_status != "active":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is inactive.",
        )

    return user


def require_job_seeker_context(
    current_user: User = Depends(require_authenticated),
) -> User:
    """Enforces that authenticated user has role == 'job_seeker'."""
    if current_user.role != "job_seeker":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Operation requires job seeker role.",
        )
    return current_user


def require_employer_context(
    current_user: User = Depends(require_authenticated),
) -> User:
    """Enforces that authenticated user has role == 'employer'."""
    if current_user.role != "employer":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Operation requires employer role.",
        )
    return current_user


def require_admin_context(
    current_user: User = Depends(require_authenticated),
) -> User:
    """Enforces that authenticated user has role == 'admin'."""
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Operation requires administrator role.",
        )
    return current_user
