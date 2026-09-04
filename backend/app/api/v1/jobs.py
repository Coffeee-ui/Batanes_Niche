from typing import List, Optional
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.api.deps import get_db, require_employer_context, get_current_user_optional
from app.models.user import User
from app.schemas.job import JobCreate, JobUpdate, JobOut
from app.schemas.common import MessageOut
from app.services.job_service import JobService

router = APIRouter(prefix="/jobs", tags=["Jobs"])


@router.get("", response_model=List[JobOut], status_code=status.HTTP_200_OK)
def list_jobs(
    municipality: Optional[str] = Query(None),
    island: Optional[str] = Query(None),
    keyword: Optional[str] = Query(None),
    employment_type: Optional[str] = Query(None),
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
):
    """Browses, searches, and filters active jobs."""
    return JobService.list_active_jobs(
        db,
        municipality=municipality,
        island=island,
        keyword=keyword,
        employment_type=employment_type,
        limit=limit,
        offset=offset,
    )


@router.post("", response_model=JobOut, status_code=status.HTTP_201_CREATED)
def create_job(
    job_data: JobCreate,
    current_user: User = Depends(require_employer_context),
    db: Session = Depends(get_db),
):
    """Creates a new job listing for an employer."""
    return JobService.create_job(db, employer=current_user, job_data=job_data)


@router.get("/my", response_model=List[JobOut], status_code=status.HTTP_200_OK)
def list_my_jobs(
    include_closed: bool = Query(True),
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    current_user: User = Depends(require_employer_context),
    db: Session = Depends(get_db),
):
    """Lists job postings owned by the authenticated employer."""
    return JobService.list_employer_jobs(
        db, employer_id=current_user.id, include_closed=include_closed, limit=limit, offset=offset
    )


@router.get("/{job_id}", response_model=JobOut, status_code=status.HTTP_200_OK)
def get_job(
    job_id: int,
    current_user: Optional[User] = Depends(get_current_user_optional),
    db: Session = Depends(get_db),
):
    """Retrieves single job details."""
    return JobService.get_job_by_id(db, job_id=job_id, current_user=current_user)


@router.put("/{job_id}", response_model=JobOut, status_code=status.HTTP_200_OK)
def update_job(
    job_id: int,
    job_data: JobUpdate,
    current_user: User = Depends(require_employer_context),
    db: Session = Depends(get_db),
):
    """Updates an owned job posting."""
    return JobService.update_job(db, job_id=job_id, employer=current_user, update_data=job_data)


@router.delete("/{job_id}", response_model=MessageOut, status_code=status.HTTP_200_OK)
def delete_job(
    job_id: int,
    current_user: User = Depends(require_employer_context),
    db: Session = Depends(get_db),
):
    """Soft-deletes / closes an owned job posting."""
    JobService.soft_delete_job(db, job_id=job_id, employer=current_user)
    return MessageOut(message="Job posting successfully closed and archived.")
