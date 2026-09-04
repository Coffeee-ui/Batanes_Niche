import pytest
from fastapi import status
from app.core.security import create_access_token


def test_two_tier_candidate_recommendations(client, test_employer, test_seeker):
    """
    Section 7.2.3:
    Two-Tier candidate recommendation test:
    - Tier 1: Total score > 0 (sorted by score DESC, name ASC)
    - Tier 2: Total score == 0 (sorted by name ASC)
    """
    emp_token, _, _ = create_access_token(str(test_employer.id), test_employer.username, test_employer.role)

    # test_seeker has skills "Tourism & Tour Guiding, Arc Welding, Carpentry" and location "Basco, San Antonio"
    # Query with matching skills and location
    res = client.get(
        "/api/v1/recommendations/candidates?skills=Tourism&municipality=Basco&barangay=San Antonio",
        headers={"Authorization": f"Bearer {emp_token}"},
    )
    assert res.status_code == status.HTTP_200_OK
    data = res.json()

    assert "tier_1" in data
    assert "tier_2" in data

    # Seeker should be in Tier 1 with positive score
    assert len(data["tier_1"]) >= 1
    match = data["tier_1"][0]
    assert match["candidate"]["id"] == test_seeker.id
    assert match["total_score"] > 0
    assert match["skill_score"] > 0
    assert match["geographic_score"] == 30.0  # Exact match on Basco, San Antonio


def test_two_tier_job_recommendations_for_seeker(client, test_seeker, test_job):
    """
    Section 7.2.3:
    Two-Tier job recommendation test for seeker.
    """
    seeker_token, _, _ = create_access_token(str(test_seeker.id), test_seeker.username, test_seeker.role)

    res = client.get(
        "/api/v1/recommendations/jobs-ranked",
        headers={"Authorization": f"Bearer {seeker_token}"},
    )
    assert res.status_code == status.HTTP_200_OK
    data = res.json()

    assert "tier_1" in data
    assert "tier_2" in data
    assert len(data["tier_1"]) >= 1
    scored_job = data["tier_1"][0]
    assert scored_job["job"]["id"] == test_job.id
    assert scored_job["total_score"] > 0
