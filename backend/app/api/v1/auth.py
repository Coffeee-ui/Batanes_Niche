from fastapi import APIRouter, Depends, Request, status
from sqlalchemy.orm import Session

from app.api.deps import get_db, require_authenticated, limiter
from app.models.user import User
from app.schemas.auth import (
    UserRegister,
    UserLogin,
    Token,
    RefreshTokenRequest,
    ForgotPasswordRequest,
    ResetPasswordRequest,
)
from app.schemas.user import PrivateUserProfile
from app.schemas.common import MessageOut
from app.services.auth_service import AuthService
from app.services.user_service import UserService

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/register", response_model=Token, status_code=status.HTTP_201_CREATED)
@limiter.limit("5/minute")
def register(request: Request, reg_data: UserRegister, db: Session = Depends(get_db)):
    """Registers a new job seeker or employer account."""
    user, token = AuthService.register_user(db, reg_data)
    return token


@router.post("/login", response_model=Token, status_code=status.HTTP_200_OK)
@limiter.limit("5/minute")
def login(request: Request, login_data: UserLogin, db: Session = Depends(get_db)):
    """Authenticates credentials and issues access & refresh tokens."""
    user, token = AuthService.authenticate_user(db, login_data)
    return token


@router.post("/refresh", response_model=Token, status_code=status.HTTP_200_OK)
def refresh(refresh_data: RefreshTokenRequest, db: Session = Depends(get_db)):
    """Rotates refresh token and issues a new access token."""
    return AuthService.rotate_refresh_token(db, refresh_data.refresh_token)


@router.post("/logout", response_model=MessageOut, status_code=status.HTTP_200_OK)
def logout(
    request: Request,
    current_user: User = Depends(require_authenticated),
    db: Session = Depends(get_db),
):
    """Invalidates caller's session refresh token and blacklists access token JTI."""
    auth_header = request.headers.get("Authorization")
    jti = None
    if auth_header and auth_header.startswith("Bearer "):
        from app.core.security import decode_access_token
        payload = decode_access_token(auth_header.split(" ")[1])
        if payload:
            jti = payload.get("jti")

    AuthService.logout(db, user=current_user, jti=jti)
    return MessageOut(message="Successfully logged out.")


@router.post("/forgot-password", response_model=MessageOut, status_code=status.HTTP_200_OK)
@limiter.limit("3/minute")
def forgot_password(request: Request, forgot_data: ForgotPasswordRequest, db: Session = Depends(get_db)):
    """Dispatches a 6-digit OTP code to the user's email."""
    AuthService.request_password_reset(db, forgot_data.email)
    return MessageOut(message="If the account exists, a password reset code has been sent.")


@router.post("/reset-password", response_model=MessageOut, status_code=status.HTTP_200_OK)
@limiter.limit("5/minute")
def reset_password(request: Request, reset_data: ResetPasswordRequest, db: Session = Depends(get_db)):
    """Verifies 6-digit OTP hash and resets user password."""
    AuthService.reset_password(
        db,
        email=reset_data.email,
        otp_code=reset_data.otp_code,
        new_password=reset_data.new_password,
    )
    return MessageOut(message="Password has been successfully reset. Please log in with your new password.")


@router.get("/me", response_model=PrivateUserProfile, status_code=status.HTTP_200_OK)
def get_me(current_user: User = Depends(require_authenticated)):
    """Retrieves authenticated user's private profile with completeness score."""
    return UserService.get_private_profile(current_user)
