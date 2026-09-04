from datetime import datetime, timezone
from typing import Optional, Tuple
from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.core.security import (
    verify_password,
    get_password_hash,
    create_access_token,
    generate_refresh_token,
    hash_refresh_token,
    generate_six_digit_otp,
    hash_otp,
    verify_otp,
)
from app.models.user import User, EmployerProfile, JobSeekerProfile
from app.models.token import RefreshToken
from app.models.password_reset_token import PasswordResetToken
from app.schemas.auth import UserRegister, UserLogin, Token
from app.repositories.user_repository import UserRepository
from app.repositories.token_repository import TokenRepository
from app.repositories.password_reset_repository import PasswordResetRepository
from app.services.email_delivery_service import EmailDeliveryService
from app.services.audit_service import AuditService
from app.services.geography_service import GeographyService


class AuthService:
    @staticmethod
    def register_user(db: Session, reg_data: UserRegister) -> Tuple[User, Token]:
        """Registers a new job seeker or employer user with profile invariant enforcement."""
        role_clean = reg_data.role.strip().lower()
        if role_clean not in ("job_seeker", "employer"):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Public registration accepts only 'job_seeker' or 'employer' roles.",
            )

        # Validate location against canonical geography
        is_valid, island, c_mun, c_bgy = GeographyService.validate_location(
            reg_data.municipality, reg_data.barangay
        )
        if not is_valid or not c_mun:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid Batanes location: '{reg_data.municipality}', '{reg_data.barangay}'.",
            )

        # Check existing username
        if UserRepository.get_by_username(db, reg_data.username):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Username is already registered.",
            )

        # Check existing email
        if UserRepository.get_by_email(db, reg_data.email):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email is already registered.",
            )

        # Create user entity
        user = User(
            username=reg_data.username.strip(),
            email=reg_data.email.strip().lower(),
            password_hash=get_password_hash(reg_data.password),
            full_name=reg_data.full_name.strip(),
            phone_number=reg_data.phone_number.strip() if reg_data.phone_number else None,
            municipality=c_mun,
            barangay=c_bgy,
            skills=reg_data.skills.strip() if reg_data.skills else None,
            role=role_clean,
            account_status="active",
        )

        employer_profile = None
        job_seeker_profile = None

        if role_clean == "job_seeker":
            job_seeker_profile = JobSeekerProfile(
                bio=reg_data.bio.strip() if reg_data.bio else None,
                education=reg_data.education.strip() if reg_data.education else None,
                experience_years=reg_data.experience_years or 0,
            )
        elif role_clean == "employer":
            employer_profile = EmployerProfile(
                company_name=(reg_data.company_name or f"{user.full_name}'s Enterprise").strip(),
                company_address=(reg_data.company_address or f"{c_mun}, Batanes").strip(),
                company_description=reg_data.company_description.strip() if reg_data.company_description else None,
                business_type=(reg_data.business_type or "General Enterprise").strip(),
            )

        created_user = UserRepository.create(
            db, user, employer_profile=employer_profile, job_seeker_profile=job_seeker_profile
        )

        # Issue initial tokens
        token = AuthService._issue_tokens(db, created_user)
        return created_user, token

    @staticmethod
    def authenticate_user(db: Session, login_data: UserLogin) -> Tuple[User, Token]:
        """Authenticates user credentials, enforces account active check, and issues tokens."""
        user = UserRepository.get_by_username_or_email(db, login_data.username_or_email)
        if not user or not verify_password(login_data.password, user.password_hash):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid credentials.",
                headers={"WWW-Authenticate": "Bearer"},
            )

        if user.account_status == "suspended":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Your account has been suspended. Please contact administration.",
            )

        if user.account_status != "active":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Account is inactive.",
            )

        token = AuthService._issue_tokens(db, user)
        return user, token

    @staticmethod
    def rotate_refresh_token(db: Session, raw_refresh_token: str) -> Token:
        """
        Rotates refresh token and issues new access token.
        Compromise Detection (Section 26.3): If an already-revoked refresh token is presented,
        all refresh sessions for that user are immediately terminated.
        """
        token_hash = hash_refresh_token(raw_refresh_token)
        stored_token = TokenRepository.get_refresh_token_by_hash(db, token_hash)

        if not stored_token:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid refresh token.",
            )

        # Compromise detection
        if stored_token.revoked:
            TokenRepository.revoke_all_user_refresh_tokens(db, stored_token.user_id)
            AuditService.log_event(
                db=db,
                action="REFRESH_TOKEN_COMPROMISE_DETECTED",
                actor_role="system",
                actor_id=stored_token.user_id,
                target_type="auth",
                target_id=stored_token.user_id,
                details={"reason": "Revoked refresh token presented. All user sessions invalidated."},
            )
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Refresh token reuse detected. All sessions terminated for security.",
            )

        # Expiration check
        now = datetime.now(timezone.utc)
        expires_at = stored_token.expires_at
        if expires_at.tzinfo is None:
            expires_at = expires_at.replace(tzinfo=timezone.utc)

        if expires_at < now:
            TokenRepository.revoke_refresh_token(db, stored_token)
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Refresh token has expired.",
            )

        user = UserRepository.get_by_id(db, stored_token.user_id)
        if not user or user.account_status != "active":
            TokenRepository.revoke_refresh_token(db, stored_token)
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User account is no longer active.",
            )

        # Revoke old refresh token (Rotation)
        TokenRepository.revoke_refresh_token(db, stored_token)

        # Issue new tokens
        return AuthService._issue_tokens(db, user)

    @staticmethod
    def logout(db: Session, user: User, jti: Optional[str] = None, refresh_token: Optional[str] = None) -> None:
        """
        Invalidates current session refresh token and blacklists access token JTI into revoked_tokens.
        """
        if refresh_token:
            token_hash = hash_refresh_token(refresh_token)
            stored = TokenRepository.get_refresh_token_by_hash(db, token_hash)
            if stored and stored.user_id == user.id:
                TokenRepository.revoke_refresh_token(db, stored)

        if jti:
            # Blacklist access token JTI for remaining validity
            from datetime import timedelta
            now = datetime.now(timezone.utc)
            expires_at = now + timedelta(minutes=15)
            TokenRepository.add_revoked_jti(db, jti=jti, expires_at=expires_at)

    @staticmethod
    def request_password_reset(db: Session, email: str) -> None:
        """
        Dispatches a 6-digit OTP via EmailDeliveryService with zero secret leakage and zero account enumeration.
        """
        user = UserRepository.get_by_email(db, email)
        if not user or user.account_status != "active":
            # Generic response to prevent account enumeration (Section 10.9)
            return

        # Invalidate any prior active OTPs for user (Section 10.4)
        PasswordResetRepository.invalidate_active_tokens_for_user(db, user.id)

        # Generate cryptographically secure 6-digit OTP
        plain_otp = generate_six_digit_otp()
        hashed_otp = hash_otp(plain_otp)

        from datetime import timedelta
        expires_at = datetime.now(timezone.utc) + timedelta(minutes=15)

        reset_token_record = PasswordResetToken(
            user_id=user.id,
            identifier=user.email,
            otp_hash=hashed_otp,
            expires_at=expires_at,
            used=False,
            attempts_count=0,
        )
        PasswordResetRepository.create_token(db, reset_token_record)

        # Send via email delivery abstraction
        EmailDeliveryService.send_otp_email(user.email, plain_otp)

    @staticmethod
    def reset_password(db: Session, email: str, otp_code: str, new_password: str) -> None:
        """
        Verifies OTP hash, limits brute-force attempts, updates password, revokes active sessions atomically.
        """
        user = UserRepository.get_by_email(db, email)
        if not user or user.account_status != "active":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid or expired reset code.",
            )

        reset_token = PasswordResetRepository.get_latest_active_by_identifier(db, user.email)
        if not reset_token:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid or expired reset code.",
            )

        # Verify OTP
        if not verify_otp(otp_code, reset_token.otp_hash):
            attempts = PasswordResetRepository.increment_attempts(db, reset_token)
            if attempts >= 5:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Too many failed attempts. This reset code has been invalidated.",
                )
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid or expired reset code.",
            )

        # Atomic Transaction Boundary (Section 19.3):
        # 1. Update user.password_hash
        # 2. Set reset_token.used = True
        # 3. Revoke all active refresh tokens for user
        # 4. Append audit log entry
        user.password_hash = get_password_hash(new_password)
        reset_token.used = True
        db.add(user)
        db.add(reset_token)

        # Revoke all refresh tokens
        TokenRepository.revoke_all_user_refresh_tokens(db, user.id)

        AuditService.log_event(
            db=db,
            action="PASSWORD_RESET_COMPLETE",
            actor_role=user.role,
            actor_id=user.id,
            target_type="user",
            target_id=user.id,
            details={"email": user.email},
        )
        db.commit()

    @staticmethod
    def _issue_tokens(db: Session, user: User) -> Token:
        """Issues access JWT and records rotated refresh token."""
        access_token_jwt, jti, exp = create_access_token(
            subject=str(user.id),
            username=user.username,
            role=user.role,
        )
        raw_refresh, token_hash, refresh_expires_at = generate_refresh_token()
        refresh_obj = RefreshToken(
            user_id=user.id,
            token_hash=token_hash,
            expires_at=refresh_expires_at,
            revoked=False,
        )
        TokenRepository.create_refresh_token(db, refresh_obj)

        return Token(
            access_token=access_token_jwt,
            refresh_token=raw_refresh,
            token_type="bearer",
            role=user.role,
            username=user.username,
        )
