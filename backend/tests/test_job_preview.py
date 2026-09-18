import pytest
from fastapi import status
from app.core.security import create_access_token


def test_public_job_preview_fields(client, test_job):
    """
    Public landing page preview test:
    - GET /api/v1/jobs/preview returns 200 OK without authentication.
    - Only approved preview fields are present: id, title, salary_min, salary_max, required_skills.
    - Full details (description, company_name, municipality, island, barangay,
      employer_id, employment_type, status, created_at) are NOT exposed.
    """
    res = client.get("/api/v1/jobs/preview")
    assert res.status_code == status.HTTP_200_OK
    data = res.json()
    assert len(data) >= 1

    item = data[0]
    # Approved preview fields MUST be present
    assert "id" in item
    assert "title" in item
    assert "salary_min" in item
    assert "salary_max" in item
    assert "required_skills" in item
    assert item["title"] == test_job.title

    # Restricted / sensitive fields MUST NOT be present
    assert "description" not in item
    assert "company_name" not in item
    assert "employer_id" not in item
    assert "municipality" not in item
    assert "island" not in item
    assert "barangay" not in item
    assert "employment_type" not in item
    assert "status" not in item
    assert "created_at" not in item


def test_jobs_list_unauthenticated_returns_preview_only(client, test_job):
    """
    When an unauthenticated visitor calls GET /api/v1/jobs,
    it returns the restricted preview schema only.
    """
    res = client.get("/api/v1/jobs")
    assert res.status_code == status.HTTP_200_OK
    data = res.json()
    assert len(data) >= 1

    item = data[0]
    assert "id" in item
    assert "title" in item
    assert "salary_min" in item
    assert "salary_max" in item
    assert "required_skills" in item

    # Restricted fields must NOT be in the unauthenticated response
    assert "description" not in item
    assert "company_name" not in item
    assert "employer_id" not in item
    assert "municipality" not in item


def test_jobs_list_authenticated_returns_full_jobs(client, test_job, test_seeker):
    """
    When an authenticated user calls GET /api/v1/jobs,
    it returns full JobOut schema with company_name, description, and location.
    """
    token, _, _ = create_access_token(str(test_seeker.id), test_seeker.username, test_seeker.role)
    res = client.get(
        "/api/v1/jobs",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert res.status_code == status.HTTP_200_OK
    data = res.json()
    assert len(data) >= 1

    item = data[0]
    assert "description" in item
    assert "company_name" in item
    assert "municipality" in item
    assert "employment_type" in item
    assert item["company_name"] == "Batan Eco Tours"


def test_get_single_job_requires_authentication(client, test_job):
    """
    Direct access to single job detail without authentication must return 401 Unauthorized.
    """
    res = client.get(f"/api/v1/jobs/{test_job.id}")
    assert res.status_code == status.HTTP_401_UNAUTHORIZED
    assert res.json()["detail"] == "Authentication credentials were not provided."


def test_get_single_job_authenticated_success(client, test_job, test_seeker):
    """
    Authenticated user can access full single job details.
    """
    token, _, _ = create_access_token(str(test_seeker.id), test_seeker.username, test_seeker.role)
    res = client.get(
        f"/api/v1/jobs/{test_job.id}",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert res.status_code == status.HTTP_200_OK
    data = res.json()
    assert data["id"] == test_job.id
    assert data["title"] == test_job.title
    assert data["description"] == test_job.description
    assert data["company_name"] == "Batan Eco Tours"
    assert data["municipality"] == test_job.municipality
