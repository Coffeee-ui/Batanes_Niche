from typing import List, Optional
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.api.deps import get_db, require_authenticated
from app.models.user import User
from app.schemas.user import PrivateUserProfile, PublicJobSeekerSummary, UserProfileUpdate
from app.services.user_service import UserService

router = APIRouter(prefix="/users", tags=["Users"])


@router.get("/profile", response_model=PrivateUserProfile, status_code=status.HTTP_200_OK)
def get_profile(current_user: User = Depends(require_authenticated)):
    """Retrieves authenticated user's private profile & completeness score."""
    return UserService.get_private_profile(current_user)


@router.put("/profile", response_model=PrivateUserProfile, status_code=status.HTTP_200_OK)
def update_profile(
    update_data: UserProfileUpdate,
    current_user: User = Depends(require_authenticated),
    db: Session = Depends(get_db),
):
    """Updates user profile attributes."""
    return UserService.update_profile(db, current_user, update_data)


@router.get("/job-seekers", response_model=List[PublicJobSeekerSummary], status_code=status.HTTP_200_OK)
def list_job_seekers(
    municipality: Optional[str] = Query(None),
    island: Optional[str] = Query(None),
    skill: Optional[str] = Query(None),
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    current_user: User = Depends(require_authenticated),
    db: Session = Depends(get_db),
):
    """
    Sanitized candidate directory search (Section 13 & 15.1).
    Accessible to authenticated users with role IN ('employer', 'admin').
    Phone number, email, and username are strictly withheld.
    """
    if current_user.role not in ("employer", "admin"):
        from fastapi import HTTPException
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Candidate directory is accessible only to employers and administrators.",
        )

    return UserService.search_job_seekers(
        db, municipality=municipality, island=island, skill=skill, limit=limit, offset=offset
    )
