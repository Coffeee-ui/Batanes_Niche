import pytest
from datetime import datetime, timedelta, timezone
from fastapi import status
from app.models.password_reset_token import PasswordResetToken
from app.core.security import verify_otp, generate_six_digit_otp, hash_otp
from app.repositories.password_reset_repository import PasswordResetRepository


def test_cryptographic_six_digit_otp_format():
    """Validates that generated OTP is strictly 6 digits (100000 - 999999)."""
    for _ in range(50):
        otp = generate_six_digit_otp()
        assert len(otp) == 6
        assert otp.isdigit()
        assert 100000 <= int(otp) <= 999999


def test_otp_hash_storage_no_plaintext(client, db_session, test_seeker):
    """Section 10.2 & 10.8: DB stores only bcrypt otp_hash, never plaintext OTP."""
    res = client.post("/api/v1/auth/forgot-password", json={"email": test_seeker.email})
    assert res.status_code == status.HTTP_200_OK

    # Inspect DB record
    record = db_session.query(PasswordResetToken).filter_by(user_id=test_seeker.id).first()
    assert record is not None
    assert record.otp_hash.startswith("$2b$") or record.otp_hash.startswith("$2a$")
    assert not hasattr(record, "otp_code")
    assert not hasattr(record, "plain_otp")

    # API response contains zero secret leakage (Section 10.8)
    response_json = res.json()
    assert "otp" not in response_json
    assert "token" not in response_json
    assert "debug" not in response_json


def test_account_enumeration_protection(client):
    """Section 10.9: Non-existent email returns generic confirmation message."""
    res = client.post("/api/v1/auth/forgot-password", json={"email": "nonexistent_email@batanes.ph"})
    assert res.status_code == status.HTTP_200_OK
    assert "If the account exists" in res.json()["message"]


def test_invalidation_of_previous_active_otps(client, db_session, test_seeker):
    """Section 10.4: Requesting a new OTP automatically sets used = True on previous active OTPs."""
    client.post("/api/v1/auth/forgot-password", json={"email": test_seeker.email})
    record1 = db_session.query(PasswordResetToken).filter_by(user_id=test_seeker.id).order_by(PasswordResetToken.id.desc()).first()
    assert record1.used is False

    # Second request
    client.post("/api/v1/auth/forgot-password", json={"email": test_seeker.email})
    db_session.refresh(record1)
    assert record1.used is True

    record2 = db_session.query(PasswordResetToken).filter_by(user_id=test_seeker.id).order_by(PasswordResetToken.id.desc()).first()
    assert record2.id != record1.id
    assert record2.used is False


def test_brute_force_lockout_after_five_failed_attempts(client, db_session, test_seeker):
    """Section 10.5: 5 failed attempts immediately invalidates the record (used = True)."""
    # Create reset token record directly with known OTP
    known_otp = "654321"
    hashed = hash_otp(known_otp)
    reset_record = PasswordResetToken(
        user_id=test_seeker.id,
        identifier=test_seeker.email,
        otp_hash=hashed,
        expires_at=datetime.now(timezone.utc) + timedelta(minutes=15),
        used=False,
        attempts_count=0,
    )
    db_session.add(reset_record)
    db_session.commit()

    # Attempt 4 wrong codes
    for attempt in range(1, 5):
        res = client.post(
            "/api/v1/auth/reset-password",
            json={"email": test_seeker.email, "otp_code": "000000", "new_password": "NewStrongPass1!"},
        )
        assert res.status_code == status.HTTP_400_BAD_REQUEST

    db_session.refresh(reset_record)
    assert reset_record.attempts_count == 4
    assert reset_record.used is False

    # 5th failed attempt triggers lockout
    res5 = client.post(
        "/api/v1/auth/reset-password",
        json={"email": test_seeker.email, "otp_code": "000000", "new_password": "NewStrongPass1!"},
    )
    assert res5.status_code == status.HTTP_400_BAD_REQUEST
    assert "too many failed attempts" in res5.json()["detail"].lower()

    db_session.refresh(reset_record)
    assert reset_record.attempts_count >= 5
    assert reset_record.used is True

    # Even with correct OTP now, it is rejected because used = True
    res_correct = client.post(
        "/api/v1/auth/reset-password",
        json={"email": test_seeker.email, "otp_code": known_otp, "new_password": "NewStrongPass1!"},
    )
    assert res_correct.status_code == status.HTTP_400_BAD_REQUEST


def test_successful_password_reset_flow(client, db_session, test_seeker):
    """Successful reset updates password, marks OTP used, and allows login with new password."""
    known_otp = "123456"
    hashed = hash_otp(known_otp)
    reset_record = PasswordResetToken(
        user_id=test_seeker.id,
        identifier=test_seeker.email,
        otp_hash=hashed,
        expires_at=datetime.now(timezone.utc) + timedelta(minutes=15),
        used=False,
        attempts_count=0,
    )
    db_session.add(reset_record)
    db_session.commit()

    res = client.post(
        "/api/v1/auth/reset-password",
        json={"email": test_seeker.email, "otp_code": known_otp, "new_password": "BrandNewPassword123!"},
    )
    assert res.status_code == status.HTTP_200_OK

    db_session.refresh(reset_record)
    assert reset_record.used is True

    # Test login with new password
    login_res = client.post(
        "/api/v1/auth/login",
        json={"username_or_email": test_seeker.username, "password": "BrandNewPassword123!"},
    )
    assert login_res.status_code == status.HTTP_200_OK
