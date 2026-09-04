import pytest
from fastapi import status
from app.admin.auth import create_admin_session_cookie, ADMIN_COOKIE_NAME, CSRF_COOKIE_NAME
from app.models.audit_log import AuditLog


def test_admin_login_and_session_cookie(client, test_admin):
    res = client.post(
        "/admin/login",
        data={"username": test_admin.username, "password": "AdminPass123!"},
        follow_redirects=False,
    )
    assert res.status_code == status.HTTP_303_SEE_OTHER
    assert ADMIN_COOKIE_NAME in res.cookies
    assert CSRF_COOKIE_NAME in res.cookies


def test_admin_dashboard_access_and_unauthorized_redirect(client, test_admin):
    # Without cookie -> redirect to login
    res_no_auth = client.get("/admin/dashboard", follow_redirects=False)
    assert res_no_auth.status_code == status.HTTP_303_SEE_OTHER
    assert "/admin/login" in res_no_auth.headers.get("Location", "")

    # With cookie -> 200 OK
    session_token, csrf_token = create_admin_session_cookie(test_admin)
    client.cookies.set(ADMIN_COOKIE_NAME, session_token)
    client.cookies.set(CSRF_COOKIE_NAME, csrf_token)

    res_auth = client.get("/admin/dashboard")
    assert res_auth.status_code == status.HTTP_200_OK
    assert "Governance" in res_auth.text


def test_admin_user_suspension_and_audit_log(client, db_session, test_admin, test_seeker):
    session_token, csrf_token = create_admin_session_cookie(test_admin)
    client.cookies.set(ADMIN_COOKIE_NAME, session_token)
    client.cookies.set(CSRF_COOKIE_NAME, csrf_token)

    # Suspend test_seeker
    res = client.post(
        f"/admin/users/{test_seeker.id}/suspend",
        data={"csrf_token": csrf_token},
        follow_redirects=False,
    )
    assert res.status_code == status.HTTP_303_SEE_OTHER

    db_session.refresh(test_seeker)
    assert test_seeker.account_status == "suspended"

    # Verify audit log was created (Section 18)
    audit = db_session.query(AuditLog).filter_by(action="USER_SUSPEND", target_id=test_seeker.id).first()
    assert audit is not None
    assert audit.actor_role == "admin"

    # Restore test_seeker
    res_restore = client.post(
        f"/admin/users/{test_seeker.id}/restore",
        data={"csrf_token": csrf_token},
        follow_redirects=False,
    )
    assert res_restore.status_code == status.HTTP_303_SEE_OTHER
    db_session.refresh(test_seeker)
    assert test_seeker.account_status == "active"


def test_admin_job_disable_and_restore(client, db_session, test_admin, test_job):
    session_token, csrf_token = create_admin_session_cookie(test_admin)
    client.cookies.set(ADMIN_COOKIE_NAME, session_token)
    client.cookies.set(CSRF_COOKIE_NAME, csrf_token)

    # Disable job
    res = client.post(
        f"/admin/jobs/{test_job.id}/disable",
        data={"csrf_token": csrf_token},
        follow_redirects=False,
    )
    assert res.status_code == status.HTTP_303_SEE_OTHER

    db_session.refresh(test_job)
    assert test_job.status == "closed"
    assert test_job.deleted_at is not None

    # Restore job
    res_restore = client.post(
        f"/admin/jobs/{test_job.id}/restore",
        data={"csrf_token": csrf_token},
        follow_redirects=False,
    )
    assert res_restore.status_code == status.HTTP_303_SEE_OTHER

    db_session.refresh(test_job)
    assert test_job.status == "active"
    assert test_job.deleted_at is None
