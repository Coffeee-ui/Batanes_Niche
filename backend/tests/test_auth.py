import pytest
from fastapi import status
from app.core.security import decode_access_token


def test_registration_job_seeker(client):
    res = client.post(
        "/api/v1/auth/register",
        json={
            "username": "new_seeker",
            "email": "new_seeker@batanes.ph",
            "password": "StrongPassword123!",
            "full_name": "New Seeker",
            "phone_number": "09123456789",
            "municipality": "Basco",
            "barangay": "San Antonio",
            "role": "job_seeker",
            "skills": "Carpentry, Plumbing",
        },
    )
    assert res.status_code == status.HTTP_201_CREATED
    data = res.json()
    assert "access_token" in data
    assert "refresh_token" in data
    assert data["role"] == "job_seeker"
    assert data["username"] == "new_seeker"


def test_registration_employer(client):
    res = client.post(
        "/api/v1/auth/register",
        json={
            "username": "new_employer",
            "email": "new_employer@batanes.ph",
            "password": "StrongPassword123!",
            "full_name": "New Employer",
            "phone_number": "09987654321",
            "municipality": "Mahatao",
            "barangay": "Hanheng",
            "role": "employer",
            "company_name": "Mahatao Fisheries",
            "business_type": "Agriculture & Fisheries",
        },
    )
    assert res.status_code == status.HTTP_201_CREATED
    data = res.json()
    assert data["role"] == "employer"


def test_registration_admin_prohibited(client):
    """Section 9: Registering role = admin must return 400 Bad Request."""
    res = client.post(
        "/api/v1/auth/register",
        json={
            "username": "fake_admin",
            "email": "fake_admin@batanes.ph",
            "password": "StrongPassword123!",
            "full_name": "Fake Admin",
            "municipality": "Basco",
            "role": "admin",
        },
    )
    assert res.status_code in (status.HTTP_400_BAD_REQUEST, status.HTTP_422_UNPROCESSABLE_CONTENT)


def test_password_strength_enforcement(client):
    res = client.post(
        "/api/v1/auth/register",
        json={
            "username": "weak_user",
            "email": "weak@batanes.ph",
            "password": "weak",
            "full_name": "Weak Password User",
            "municipality": "Basco",
            "role": "job_seeker",
        },
    )
    assert res.status_code == status.HTTP_422_UNPROCESSABLE_CONTENT


def test_login_and_token_claims(client, test_seeker):
    res = client.post(
        "/api/v1/auth/login",
        json={"username_or_email": "test_seeker", "password": "SeekerPass123!"},
    )
    assert res.status_code == status.HTTP_200_OK
    data = res.json()
    access_token = data["access_token"]
    refresh_token = data["refresh_token"]

    payload = decode_access_token(access_token)
    assert payload is not None
    assert payload["sub"] == str(test_seeker.id)
    assert payload["role"] == "job_seeker"
    assert "jti" in payload
    assert "exp" in payload

    # Test /auth/me
    me_res = client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {access_token}"})
    assert me_res.status_code == status.HTTP_200_OK
    assert me_res.json()["username"] == "test_seeker"


def test_refresh_token_rotation(client, test_seeker):
    login_res = client.post(
        "/api/v1/auth/login",
        json={"username_or_email": "test_seeker", "password": "SeekerPass123!"},
    )
    ref1 = login_res.json()["refresh_token"]

    # Rotate
    rotate_res = client.post("/api/v1/auth/refresh", json={"refresh_token": ref1})
    assert rotate_res.status_code == status.HTTP_200_OK
    data = rotate_res.json()
    ref2 = data["refresh_token"]
    assert ref2 != ref1

    # Compromise Detection (Section 26.3): Reusing old ref1 must trigger immediate session invalidation
    reuse_res = client.post("/api/v1/auth/refresh", json={"refresh_token": ref1})
    assert reuse_res.status_code == status.HTTP_401_UNAUTHORIZED
    assert "reuse detected" in reuse_res.json()["detail"].lower()

    # ref2 is now also revoked due to compromise detection
    res3 = client.post("/api/v1/auth/refresh", json={"refresh_token": ref2})
    assert res3.status_code == status.HTTP_401_UNAUTHORIZED


def test_logout_and_revocation(client, test_seeker):
    login_res = client.post(
        "/api/v1/auth/login",
        json={"username_or_email": "test_seeker", "password": "SeekerPass123!"},
    )
    token = login_res.json()["access_token"]
    ref_token = login_res.json()["refresh_token"]

    logout_res = client.post(
        "/api/v1/auth/logout",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert logout_res.status_code == status.HTTP_200_OK

    # Access token JTI is blacklisted
    me_res = client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert me_res.status_code == status.HTTP_401_UNAUTHORIZED


def test_suspended_user_rejection(client, db_session, test_seeker):
    test_seeker.account_status = "suspended"
    db_session.add(test_seeker)
    db_session.commit()

    login_res = client.post(
        "/api/v1/auth/login",
        json={"username_or_email": "test_seeker", "password": "SeekerPass123!"},
    )
    assert login_res.status_code == status.HTTP_403_FORBIDDEN
    assert "suspended" in login_res.json()["detail"].lower()
