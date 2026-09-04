from typing import List, Union
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.api.deps import get_db, require_authenticated, require_job_seeker_context
from app.models.user import User
from app.schemas.application import (
    ApplicationCreate,
    ApplicationUpdate,
    SeekerApplicationOut,
    EmployerApplicationOut,
)
from app.services.application_service import ApplicationService

router = APIRouter(prefix="/applications", tags=["Applications"])


@router.post("", response_model=SeekerApplicationOut, status_code=status.HTTP_201_CREATED)
def submit_application(
    app_data: ApplicationCreate,
    current_user: User = Depends(require_job_seeker_context),
    db: Session = Depends(get_db),
):
    """Submits a job application (Job Seeker only)."""
    return ApplicationService.submit_application(db, seeker=current_user, app_data=app_data)


@router.get("", response_model=List[Union[SeekerApplicationOut, EmployerApplicationOut]], status_code=status.HTTP_200_OK)
def list_applications(
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    current_user: User = Depends(require_authenticated),
    db: Session = Depends(get_db),
):
    """
    Lists applications filtered by caller role:
    - Job Seeker: submitted applications with Job information
    - Employer: received applications for owned jobs with Authorized Applicant Contact information
    """
    return ApplicationService.list_applications(db, current_user=current_user, limit=limit, offset=offset)


@router.put("/{app_id}", response_model=EmployerApplicationOut, status_code=status.HTTP_200_OK)
def update_application_status(
    app_id: int,
    update_data: ApplicationUpdate,
    current_user: User = Depends(require_authenticated),
    db: Session = Depends(get_db),
):
    """Transitions application status ('pending' <-> 'accepted' / 'rejected') by the owning employer."""
    return ApplicationService.update_application_status(
        db, app_id=app_id, employer=current_user, update_data=update_data
    )
