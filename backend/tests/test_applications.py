import pytest
from fastapi import status
from app.models.notification import Notification
from app.core.security import create_access_token


def test_application_submission_and_duplicate_prevention(client, db_session, test_seeker, test_job):
    token, _, _ = create_access_token(str(test_seeker.id), test_seeker.username, test_seeker.role)

    # 1. Successful submission
    res = client.post(
        "/api/v1/applications",
        headers={"Authorization": f"Bearer {token}"},
        json={
            "job_id": test_job.id,
            "cover_letter": "I am passionate about Batanes culture and eco-tourism.",
        },
    )
    assert res.status_code == status.HTTP_201_CREATED
    data = res.json()
    assert data["job_id"] == test_job.id
    assert data["status"] == "pending"

    # Verify atomic employer notification (Section 7.4.8 & 19.1)
    notif = db_session.query(Notification).filter_by(user_id=test_job.employer_id).first()
    assert notif is not None
    assert notif.type == "new_application"
    assert test_seeker.full_name in notif.message

    # 2. Duplicate submission rejection (Section 7.4.2 -> 400 Bad Request)
    res_dup = client.post(
        "/api/v1/applications",
        headers={"Authorization": f"Bearer {token}"},
        json={"job_id": test_job.id, "cover_letter": "Duplicate attempt."},
    )
    assert res_dup.status_code == status.HTTP_400_BAD_REQUEST
    assert "already applied" in res_dup.json()["detail"].lower()


def test_employer_cannot_apply(client, test_employer, test_job):
    """Section 7.4.3: Employers cannot apply for jobs (HTTP 403 Forbidden)."""
    token, _, _ = create_access_token(str(test_employer.id), test_employer.username, test_employer.role)
    res = client.post(
        "/api/v1/applications",
        headers={"Authorization": f"Bearer {token}"},
        json={"job_id": test_job.id},
    )
    assert res.status_code == status.HTTP_403_FORBIDDEN


def test_application_status_transitions_and_reversion(client, db_session, test_seeker, test_employer, test_job):
    """
    Section 7.4.6 Allowed Status Transitions:
    pending -> accepted
    pending -> rejected
    accepted -> pending (reversion allowed)
    rejected -> pending (reversion allowed)
    """
    seeker_token, _, _ = create_access_token(str(test_seeker.id), test_seeker.username, test_seeker.role)
    emp_token, _, _ = create_access_token(str(test_employer.id), test_employer.username, test_employer.role)

    # Submit application
    sub_res = client.post(
        "/api/v1/applications",
        headers={"Authorization": f"Bearer {seeker_token}"},
        json={"job_id": test_job.id},
    )
    app_id = sub_res.json()["id"]

    # 1. Transition pending -> accepted
    acc_res = client.put(
        f"/api/v1/applications/{app_id}",
        headers={"Authorization": f"Bearer {emp_token}"},
        json={"status": "accepted"},
    )
    assert acc_res.status_code == status.HTTP_200_OK
    assert acc_res.json()["status"] == "accepted"

    # Verify atomic applicant notification
    notif = db_session.query(Notification).filter_by(user_id=test_seeker.id).order_by(Notification.id.desc()).first()
    assert notif is not None
    assert notif.type == "application_status_updated"
    assert "accepted" in notif.message.lower()

    # 2. Reversion accepted -> pending
    rev_res = client.put(
        f"/api/v1/applications/{app_id}",
        headers={"Authorization": f"Bearer {emp_token}"},
        json={"status": "pending"},
    )
    assert rev_res.status_code == status.HTTP_200_OK
    assert rev_res.json()["status"] == "pending"

    # 3. Transition pending -> rejected
    rej_res = client.put(
        f"/api/v1/applications/{app_id}",
        headers={"Authorization": f"Bearer {emp_token}"},
        json={"status": "rejected"},
    )
    assert rej_res.status_code == status.HTTP_200_OK
    assert rej_res.json()["status"] == "rejected"
