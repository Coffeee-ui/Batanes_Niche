from typing import Optional
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.api.deps import get_db, require_employer_context, require_job_seeker_context, limiter
from app.models.user import User
from app.schemas.recommendation import CandidateRankingResponse, JobRankingResponse
from app.services.recommendation_service import RecommendationService
from app.services.job_service import JobService

router = APIRouter(prefix="/recommendations", tags=["Recommendations"])


@router.get("/candidates", response_model=CandidateRankingResponse, status_code=status.HTTP_200_OK)
def get_candidate_recommendations(
    skills: Optional[str] = Query(None, description="Required skill keywords"),
    municipality: Optional[str] = Query(None, description="Target municipality"),
    barangay: Optional[str] = Query(None, description="Target barangay"),
    limit: int = Query(50, ge=1, le=100),
    current_user: User = Depends(require_employer_context),
    db: Session = Depends(get_db),
):
    """
    Two-Tier candidate recommendations for employer (Section 7.2 & 14).
    If query parameters are omitted, uses employer's primary location and active job skills.
    Candidate profiles are sanitized (zero contact info leakage).
    """
    target_mun = municipality or current_user.municipality
    target_bgy = barangay or current_user.barangay
    needed_skills = skills or ""

    if not needed_skills:
        # Pull skills from employer's active jobs
        active_jobs = JobService.list_employer_jobs(db, current_user.id, include_closed=False)
        all_skills = [j.required_skills for j in active_jobs if j.required_skills]
        needed_skills = ", ".join(all_skills)

    return RecommendationService.rank_candidates(
        db,
        needed_skills=needed_skills,
        target_municipality=target_mun,
        target_barangay=target_bgy,
        limit=limit,
    )


@router.get("/jobs-ranked", response_model=JobRankingResponse, status_code=status.HTTP_200_OK)
def get_ranked_jobs(
    limit: int = Query(50, ge=1, le=100),
    current_user: User = Depends(require_job_seeker_context),
    db: Session = Depends(get_db),
):
    """Two-Tier job recommendations ranked for the authenticated job seeker (Section 7.2 & 14)."""
    return RecommendationService.rank_jobs_for_seeker(db, seeker=current_user, limit=limit)
