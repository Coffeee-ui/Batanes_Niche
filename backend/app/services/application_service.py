from typing import List, Optional, Union
from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.application import Application
from app.models.notification import Notification
from app.models.user import User
from app.schemas.application import (
    ApplicationCreate,
    ApplicationUpdate,
    SeekerApplicationOut,
    EmployerApplicationOut,
)
from app.schemas.user import EmployerApplicantProfile
from app.repositories.application_repository import ApplicationRepository
from app.repositories.job_repository import JobRepository
from app.repositories.notification_repository import NotificationRepository
from app.services.job_service import JobService
from app.services.geography_service import GeographyService


class ApplicationService:
    @staticmethod
    def submit_application(db: Session, seeker: User, app_data: ApplicationCreate) -> SeekerApplicationOut:
        """
        Submits job application within explicit transaction boundary (Section 19.1):
        - Validates job active
        - Prevents duplicate applications
        - Role check (seeker only)
        - Atomically inserts application and creates employer notification
        """
        if seeker.role != "job_seeker":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only job seekers can apply for jobs.",
            )

        job = JobRepository.get_by_id(db, app_data.job_id, include_deleted=False)
        if not job or job.status != "active":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Applications can only be submitted to active jobs.",
            )

        if job.employer_id == seeker.id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="You cannot apply to your own job listing.",
            )

        # Duplicate check (Section 7.4.2)
        if ApplicationRepository.has_active_application(db, job_id=job.id, seeker_id=seeker.id):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="You have already applied for this job.",
            )

        try:
            # Transaction Boundary
            application = Application(
                job_id=job.id,
                seeker_id=seeker.id,
                cover_letter=app_data.cover_letter.strip() if app_data.cover_letter else None,
                resume_url=app_data.resume_url.strip() if app_data.resume_url else seeker.resume_url,
                status="pending",
            )
            ApplicationRepository.create(db, application)
            db.flush()

            # Transactional Notification for Employer (Section 7.4.8)
            notification = Notification(
                user_id=job.employer_id,
                title="New Application Received",
                message=f"{seeker.full_name} submitted an application for your job posting: '{job.title}'.",
                type="new_application",
                link=f"/employer",
            )
            NotificationRepository.create(db, notification)

            db.commit()
            db.refresh(application)
        except Exception as exc:
            db.rollback()
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Failed to submit application: {exc}",
            )

        return SeekerApplicationOut(
            id=application.id,
            job_id=application.job_id,
            status=application.status,
            cover_letter=application.cover_letter,
            resume_url=application.resume_url,
            created_at=application.created_at,
            job=JobService._to_job_out(job),
        )

    @staticmethod
    def update_application_status(
        db: Session, app_id: int, employer: User, update_data: ApplicationUpdate
    ) -> EmployerApplicationOut:
        """
        Updates application status within explicit transaction boundary (Section 19.2):
        - Verifies employer owns the job
        - Enforces allowed transitions (pending <-> accepted/rejected)
        - Atomically updates status and creates applicant notification
        """
        if employer.role != "employer" and employer.role != "admin":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only the job employer can update application status.",
            )

        application = ApplicationRepository.get_by_id(db, app_id)
        if not application:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Application not found.",
            )

        if application.job.employer_id != employer.id and employer.role != "admin":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have permission to manage applications for this job.",
            )

        new_status = update_data.status.strip().lower()
        if new_status not in ("pending", "accepted", "rejected"):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid status. Allowed statuses: 'pending', 'accepted', 'rejected'.",
            )

        # Transition validation (Section 7.4.6)
        # pending -> accepted, pending -> rejected, accepted -> pending, rejected -> pending
        current_status = application.status
        allowed_transitions = {
            "pending": ["accepted", "rejected"],
            "accepted": ["pending"],
            "rejected": ["pending"],
        }
        if new_status != current_status and new_status not in allowed_transitions.get(current_status, []):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid status transition from '{current_status}' to '{new_status}'.",
            )

        try:
            # Transaction Boundary
            application.status = new_status
            ApplicationRepository.update(db, application)

            # Transactional Notification for Applicant (Section 7.4.8)
            status_text = "accepted" if new_status == "accepted" else ("rejected" if new_status == "rejected" else "marked pending")
            notification = Notification(
                user_id=application.seeker_id,
                title="Application Status Updated",
                message=f"Your application for '{application.job.title}' was {status_text}.",
                type="application_status_updated",
                link="/dashboard",
            )
            NotificationRepository.create(db, notification)

            db.commit()
            db.refresh(application)
        except Exception as exc:
            db.rollback()
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Failed to update application status: {exc}",
            )

        return ApplicationService._to_employer_application_out(application)

    @staticmethod
    def list_applications(
        db: Session, current_user: User, limit: int = 50, offset: int = 0
    ) -> List[Union[SeekerApplicationOut, EmployerApplicationOut]]:
        """
        Lists applications filtered by user role:
        - Job Seeker: submitted applications with Job info
        - Employer: received applications for owned jobs with Authorized Applicant Contact info
        """
        if current_user.role == "job_seeker":
            apps = ApplicationRepository.list_by_seeker(db, current_user.id, limit=limit, offset=offset)
            return [
                SeekerApplicationOut(
                    id=a.id,
                    job_id=a.job_id,
                    status=a.status,
                    cover_letter=a.cover_letter,
                    resume_url=a.resume_url,
                    created_at=a.created_at,
                    job=JobService._to_job_out(a.job) if a.job else None,
                )
                for a in apps
            ]
        elif current_user.role == "employer":
            apps = ApplicationRepository.list_by_employer(db, current_user.id, limit=limit, offset=offset)
            return [ApplicationService._to_employer_application_out(a) for a in apps]
        else:
            return []

    @staticmethod
    def _to_employer_application_out(application: Application) -> EmployerApplicationOut:
        """
        Constructs EmployerApplicationOut with authorized applicant contact info (Section 12.1 & 15.3).
        """
        seeker = application.seeker
        island = GeographyService.resolve_island(seeker.municipality) or "Batan Island"
        bio = seeker.job_seeker_profile.bio if seeker.job_seeker_profile else None
        edu = seeker.job_seeker_profile.education if seeker.job_seeker_profile else None
        exp = seeker.job_seeker_profile.experience_years if seeker.job_seeker_profile else 0

        applicant_profile = EmployerApplicantProfile(
            seeker_id=seeker.id,
            full_name=seeker.full_name,
            email=seeker.email,  # Authorized access
            phone_number=seeker.phone_number,  # Authorized access
            municipality=seeker.municipality,
            island=island,
            barangay=seeker.barangay,
            skills=seeker.skills,
            education=edu,
            experience_years=exp,
            bio=bio,
            profile_pic=seeker.profile_pic,
            resume_url=application.resume_url or seeker.resume_url,
        )

        return EmployerApplicationOut(
            id=application.id,
            job_id=application.job_id,
            status=application.status,
            cover_letter=application.cover_letter,
            resume_url=application.resume_url,
            created_at=application.created_at,
            applicant=applicant_profile,
        )
