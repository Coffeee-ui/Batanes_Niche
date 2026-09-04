from typing import List
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.api.deps import get_db, require_job_seeker_context
from app.models.user import User
from app.schemas.job import SavedJobOut
from app.schemas.common import MessageOut
from app.services.job_service import JobService

router = APIRouter(prefix="/saved-jobs", tags=["Saved Jobs"])


@router.get("", response_model=List[SavedJobOut], status_code=status.HTTP_200_OK)
def list_saved_jobs(
    current_user: User = Depends(require_job_seeker_context),
    db: Session = Depends(get_db),
):
    """Lists saved/bookmarked jobs for the authenticated seeker."""
    return JobService.list_saved_jobs(db, seeker=current_user)


@router.post("/{job_id}", response_model=MessageOut, status_code=status.HTTP_201_CREATED)
def save_job(
    job_id: int,
    current_user: User = Depends(require_job_seeker_context),
    db: Session = Depends(get_db),
):
    """Bookmarks an active job."""
    JobService.save_job(db, seeker=current_user, job_id=job_id)
    return MessageOut(message="Job successfully saved.")


@router.delete("/{job_id}", response_model=MessageOut, status_code=status.HTTP_200_OK)
def remove_saved_job(
    job_id: int,
    current_user: User = Depends(require_job_seeker_context),
    db: Session = Depends(get_db),
):
    """Removes a bookmarked job."""
    JobService.remove_saved_job(db, seeker=current_user, job_id=job_id)
    return MessageOut(message="Job bookmark successfully removed.")
