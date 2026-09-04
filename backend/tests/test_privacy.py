import pytest
from fastapi import status
from app.core.security import create_access_token, get_password_hash
from app.models.user import User, EmployerProfile


def test_public_candidate_directory_withholds_contact_info(client, test_employer, test_seeker):
    """
    Section 12.2 & 13.2:
    Candidate directory is accessible to employers but strictly omits phone_number, email, and username.
    """
    emp_token, _, _ = create_access_token(str(test_employer.id), test_employer.username, test_employer.role)

    res = client.get("/api/v1/users/job-seekers", headers={"Authorization": f"Bearer {emp_token}"})
    assert res.status_code == status.HTTP_200_OK
    candidates = res.json()
    assert len(candidates) > 0

    seeker_data = next((c for c in candidates if c["id"] == test_seeker.id), None)
    assert seeker_data is not None
    assert "full_name" in seeker_data
    assert "municipality" in seeker_data
    assert "email" not in seeker_data
    assert "phone_number" not in seeker_data
    assert "username" not in seeker_data


def test_unrelated_employer_cannot_access_contact_info(client, db_session, test_seeker, test_employer, test_job):
    """
    Section 12.1:
    An employer who does NOT own the job to which the seeker applied
    cannot see the seeker's contact info.
    """
    # Create a second unrelated employer
    other_emp = User(
        username="other_employer",
        email="other_emp@test.ph",
        password_hash=get_password_hash("Pass123!"),
        full_name="Other Employer",
        phone_number="09444444444",
        municipality="Basco",
        role="employer",
        account_status="active",
    )
    other_emp.employer_profile = EmployerProfile(
        company_name="Other Co",
        company_address="Basco",
        business_type="Retail",
    )
    db_session.add(other_emp)
    db_session.commit()

    # Seeker applies to test_job owned by test_employer
    seeker_token, _, _ = create_access_token(str(test_seeker.id), test_seeker.username, test_seeker.role)
    client.post(
        "/api/v1/applications",
        headers={"Authorization": f"Bearer {seeker_token}"},
        json={"job_id": test_job.id},
    )

    # other_emp inspects their applications feed -> should see empty
    other_token, _, _ = create_access_token(str(other_emp.id), other_emp.username, other_emp.role)
    feed_res = client.get("/api/v1/applications", headers={"Authorization": f"Bearer {other_token}"})
    assert feed_res.status_code == status.HTTP_200_OK
    assert len(feed_res.json()) == 0


def test_authorized_job_owning_employer_can_view_contact_info(client, test_seeker, test_employer, test_job):
    """
    Section 12.1 & 15.3:
    The authorized owner of the job can view the applicant's contact details (email, phone_number).
    """
    seeker_token, _, _ = create_access_token(str(test_seeker.id), test_seeker.username, test_seeker.role)
    client.post(
        "/api/v1/applications",
        headers={"Authorization": f"Bearer {seeker_token}"},
        json={"job_id": test_job.id},
    )

    emp_token, _, _ = create_access_token(str(test_employer.id), test_employer.username, test_employer.role)
    feed_res = client.get("/api/v1/applications", headers={"Authorization": f"Bearer {emp_token}"})
    assert feed_res.status_code == status.HTTP_200_OK
    apps = feed_res.json()
    assert len(apps) > 0

    applicant_data = apps[0]["applicant"]
    assert applicant_data["email"] == test_seeker.email
    assert applicant_data["phone_number"] == test_seeker.phone_number
