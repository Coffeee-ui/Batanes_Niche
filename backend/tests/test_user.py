import pytest
from fastapi import status
from app.services.user_service import UserService
from app.models.user import User, JobSeekerProfile
from app.core.security import create_access_token


def test_profile_completeness_formula(db_session):
    """
    Section 7.3 Profile Completeness Formula (0-100%):
    Base Fields:
    - Full Name (len >= 2 trimmed): +15
    - Phone Number (len >= 7 trimmed): +10
    - Municipality (non-empty): +10
    - Barangay (non-empty): +10
    - Skills (non-empty): +15
    - Profile Pic (non-empty): +5
    - Resume URL (non-empty): +10
    Seeker Role:
    - Bio (non-empty): +10
    - Education (non-empty): +15
    Sum = 100
    """
    user = User(
        username="complete_user",
        email="complete@batanes.ph",
        password_hash="hash",
        full_name="Juan dela Cruz",  # +15
        phone_number="09123456789",   # +10
        municipality="Basco",         # +10
        barangay="San Antonio",       # +10
        skills="Masonry, Carpentry",  # +15
        profile_pic="https://example.com/pic.jpg",   # +5
        resume_url="https://example.com/resume.pdf", # +10
        role="job_seeker",
    )
    user.job_seeker_profile = JobSeekerProfile(
        bio="Dedicated worker in Basco", # +10
        education="Vocational / TVET",   # +15
        experience_years=2,
    )
    assert UserService.calculate_profile_completeness(user) == 100


def test_health_and_readiness_probes(client):
    """Section 34: Liveness and readiness endpoints."""
    health_res = client.get("/health")
    assert health_res.status_code == status.HTTP_200_OK
    assert health_res.json()["status"] == "healthy"

    ready_res = client.get("/ready")
    assert ready_res.status_code == status.HTTP_200_OK
    assert ready_res.json()["status"] == "ready"


def test_saved_jobs_workflow(client, test_seeker, test_job):
    """Section 7.6: Saved Jobs (Bookmarks) workflow."""
    token, _, _ = create_access_token(str(test_seeker.id), test_seeker.username, test_seeker.role)

    # 1. Save job
    save_res = client.post(f"/api/v1/saved-jobs/{test_job.id}", headers={"Authorization": f"Bearer {token}"})
    assert save_res.status_code == status.HTTP_201_CREATED

    # 2. List saved jobs
    list_res = client.get("/api/v1/saved-jobs", headers={"Authorization": f"Bearer {token}"})
    assert list_res.status_code == status.HTTP_200_OK
    saved = list_res.json()
    assert len(saved) == 1
    assert saved[0]["job"]["id"] == test_job.id

    # 3. Remove bookmark
    del_res = client.delete(f"/api/v1/saved-jobs/{test_job.id}", headers={"Authorization": f"Bearer {token}"})
    assert del_res.status_code == status.HTTP_200_OK

    list_res2 = client.get("/api/v1/saved-jobs", headers={"Authorization": f"Bearer {token}"})
    assert len(list_res2.json()) == 0
