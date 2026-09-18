import pytest
from fastapi import status
from app.core.config import settings
from app.core.security import decode_access_token
from app.models.audit_log import AuditLog


def test_demo_mode_disabled_by_default(client):
    """
    Demo Mode must be disabled by default.
    GET /api/v1/auth/demo-status returns enabled=False.
    POST /api/v1/auth/demo-login returns 404.
    """
    orig_demo = settings.DEMO_MODE
    orig_env = settings.ENVIRONMENT
    try:
        settings.DEMO_MODE = False
        settings.ENVIRONMENT = "development"

        res = client.get("/api/v1/auth/demo-status")
        assert res.status_code == status.HTTP_200_OK
        data = res.json()
        assert data["enabled"] is False
        assert data["roles"] == []

        login_res = client.post("/api/v1/auth/demo-login", json={"role": "job_seeker"})
        assert login_res.status_code == status.HTTP_404_NOT_FOUND
    finally:
        settings.DEMO_MODE = orig_demo
        settings.ENVIRONMENT = orig_env


def test_demo_mode_production_safeguard(client):
    """
    Even if DEMO_MODE=True, production environment MUST strictly disable Demo Mode.
    """
    orig_demo = settings.DEMO_MODE
    orig_env = settings.ENVIRONMENT
    try:
        settings.ENVIRONMENT = "production"
        settings.DEMO_MODE = True

        assert settings.is_demo_mode_active is False

        res = client.get("/api/v1/auth/demo-status")
        assert res.status_code == status.HTTP_200_OK
        data = res.json()
        assert data["enabled"] is False
        assert data["roles"] == []

        login_res = client.post("/api/v1/auth/demo-login", json={"role": "job_seeker"})
        assert login_res.status_code == status.HTTP_404_NOT_FOUND
    finally:
        settings.DEMO_MODE = orig_demo
        settings.ENVIRONMENT = orig_env


def test_demo_mode_dev_status(client):
    """
    When active in development, GET /demo-status returns enabled=True and available roles.
    """
    orig_demo = settings.DEMO_MODE
    orig_env = settings.ENVIRONMENT
    try:
        settings.ENVIRONMENT = "development"
        settings.DEMO_MODE = True

        assert settings.is_demo_mode_active is True

        res = client.get("/api/v1/auth/demo-status")
        assert res.status_code == status.HTTP_200_OK
        data = res.json()
        assert data["enabled"] is True
        assert len(data["roles"]) == 3
        roles = [r["role"] for r in data["roles"]]
        assert "job_seeker" in roles
        assert "employer" in roles
        assert "admin" in roles
    finally:
        settings.DEMO_MODE = orig_demo
        settings.ENVIRONMENT = orig_env


@pytest.fixture
def seeded_demo_users(db_session):
    """Creates canonical demo users in test database."""
    from app.core.security import get_password_hash
    from app.models.user import User, EmployerProfile, JobSeekerProfile

    admin = User(
        username="admin",
        email="admin@batanesniche.ph",
        password_hash=get_password_hash("AdminPass123!"),
        full_name="Platform Administrator",
        municipality="Basco",
        role="admin",
        account_status="active",
    )
    emp = User(
        username="batanes_inn",
        email="manager@batanesinn.ph",
        password_hash=get_password_hash("EmployerPass123!"),
        full_name="Maria Castillejos",
        municipality="Basco",
        role="employer",
        account_status="active",
        employer_profile=EmployerProfile(
            company_name="Batanes Seaside Inn & Tours",
            company_address="Basco, Batanes",
            business_type="Tourism & Hospitality",
        ),
    )
    seeker = User(
        username="ivatan_guide",
        email="juan@batanesguide.ph",
        password_hash=get_password_hash("SeekerPass123!"),
        full_name="Juan Abad",
        municipality="Basco",
        role="job_seeker",
        account_status="active",
        job_seeker_profile=JobSeekerProfile(
            bio="Certified tour guide",
            education="Bachelor's Degree",
            experience_years=4,
        ),
    )
    db_session.add_all([admin, emp, seeker])
    db_session.commit()
    return {"admin": admin, "employer": emp, "job_seeker": seeker}


@pytest.mark.parametrize("role,expected_username", [
    ("job_seeker", "ivatan_guide"),
    ("employer", "batanes_inn"),
    ("admin", "admin"),
])
def test_demo_login_roles_success(client, db_session, seeded_demo_users, role, expected_username):
    """
    One-click demo authentication succeeds for all supported roles and returns valid tokens.
    """
    orig_demo = settings.DEMO_MODE
    orig_env = settings.ENVIRONMENT
    try:
        settings.ENVIRONMENT = "development"
        settings.DEMO_MODE = True

        res = client.post("/api/v1/auth/demo-login", json={"role": role})
        assert res.status_code == status.HTTP_200_OK
        data = res.json()

        assert "access_token" in data
        assert "refresh_token" in data
        assert data["token_type"] == "bearer"
        assert data["role"] == role

        payload = decode_access_token(data["access_token"])
        assert payload is not None
        assert payload["role"] == role
        assert payload["sub"] is not None

        # Verify audit log entry was created
        audit_entry = (
            db_session.query(AuditLog)
            .filter(AuditLog.action == "DEMO_LOGIN", AuditLog.actor_role == role)
            .order_by(AuditLog.id.desc())
            .first()
        )
        assert audit_entry is not None
    finally:
        settings.DEMO_MODE = orig_demo
        settings.ENVIRONMENT = orig_env


def test_demo_login_invalid_role(client):
    """
    Demo login rejects invalid roles with 422 or 400.
    """
    orig_demo = settings.DEMO_MODE
    orig_env = settings.ENVIRONMENT
    try:
        settings.ENVIRONMENT = "development"
        settings.DEMO_MODE = True

        res = client.post("/api/v1/auth/demo-login", json={"role": "superadmin"})
        assert res.status_code in (status.HTTP_400_BAD_REQUEST, 422)
    finally:
        settings.DEMO_MODE = orig_demo
        settings.ENVIRONMENT = orig_env
