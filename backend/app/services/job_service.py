from datetime import datetime, timezone
from typing import List, Optional
from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.job import Job
from app.models.saved_job import SavedJob
from app.models.user import User
from app.schemas.job import JobCreate, JobUpdate, JobOut, SavedJobOut
from app.repositories.job_repository import JobRepository
from app.repositories.saved_job_repository import SavedJobRepository
from app.services.geography_service import GeographyService
from app.services.skill_service import serialize_skill_values


class JobService:
    @staticmethod
    def _to_job_out(job: Job) -> JobOut:
        """Converts Job model to JobOut schema with island resolution and company name."""
        island = GeographyService.resolve_island(job.municipality) or "Batan Island"
        company_name = None
        if job.employer:
            if job.employer.employer_profile:
                company_name = job.employer.employer_profile.company_name
            else:
                company_name = job.employer.full_name

        return JobOut(
            id=job.id,
            employer_id=job.employer_id,
            title=job.title,
            description=job.description,
            municipality=job.municipality,
            island=island,
            barangay=job.barangay,
            salary_min=job.salary_min,
            salary_max=job.salary_max,
            employment_type=job.employment_type,
            required_skills=job.required_skills,
            status=job.status,
            created_at=job.created_at,
            company_name=company_name,
        )

    @staticmethod
    def create_job(db: Session, employer: User, job_data: JobCreate) -> JobOut:
        """Creates a new job listing for an employer."""
        if employer.role != "employer":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only employers can create job listings.",
            )

        if job_data.salary_min > job_data.salary_max:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Minimum salary cannot exceed maximum salary.",
            )

        # Validate location
        is_valid, island, c_mun, c_bgy = GeographyService.validate_location(
            job_data.municipality, job_data.barangay
        )
        if not is_valid or not c_mun:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid Batanes location: '{job_data.municipality}', '{job_data.barangay}'.",
            )

        normalized_skills = serialize_skill_values(job_data.required_skills.split(","))
        if job_data.required_skills.strip() and not normalized_skills:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="A custom value is required when selecting Other as a skill.",
            )

        job = Job(
            employer_id=employer.id,
            title=job_data.title.strip(),
            description=job_data.description.strip(),
            municipality=c_mun,
            barangay=c_bgy,
            salary_min=job_data.salary_min,
            salary_max=job_data.salary_max,
            employment_type=job_data.employment_type.strip(),
            required_skills=normalized_skills or "",
            status="active",
        )
        created = JobRepository.create(db, job)
        return JobService._to_job_out(created)

    @staticmethod
    def get_job_by_id(db: Session, job_id: int, current_user: Optional[User] = None) -> JobOut:
        """Retrieves a single job. Allows owner/admin to view closed/archived jobs."""
        include_deleted = bool(current_user and (current_user.role == "admin" or current_user.role == "employer"))
        job = JobRepository.get_by_id(db, job_id, include_deleted=include_deleted)
        if not job:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Job posting not found.",
            )
        # If job is deleted and caller is not owner or admin, return 404
        if job.deleted_at and not (current_user and (current_user.id == job.employer_id or current_user.role == "admin")):
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Job posting not found.",
            )
        return JobService._to_job_out(job)

    @staticmethod
    def update_job(db: Session, job_id: int, employer: User, update_data: JobUpdate) -> JobOut:
        """Updates an owned job posting."""
        job = JobRepository.get_by_id(db, job_id, include_deleted=False)
        if not job:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Job posting not found.",
            )

        if job.employer_id != employer.id and employer.role != "admin":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have permission to edit this job.",
            )

        if update_data.title is not None:
            job.title = update_data.title.strip()
        if update_data.description is not None:
            job.description = update_data.description.strip()
        if update_data.employment_type is not None:
            job.employment_type = update_data.employment_type.strip()
        if update_data.required_skills is not None:
            normalized_skills = serialize_skill_values(update_data.required_skills.split(","))
            if update_data.required_skills.strip() and not normalized_skills:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="A custom value is required when selecting Other as a skill.",
                )
            job.required_skills = normalized_skills or ""

        # Salary checks
        new_min = update_data.salary_min if update_data.salary_min is not None else job.salary_min
        new_max = update_data.salary_max if update_data.salary_max is not None else job.salary_max
        if new_min > new_max:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Minimum salary cannot exceed maximum salary.",
            )
        job.salary_min = new_min
        job.salary_max = new_max

        # Location checks
        if update_data.municipality is not None or update_data.barangay is not None:
            mun = update_data.municipality or job.municipality
            bgy = update_data.barangay if update_data.barangay is not None else job.barangay
            is_valid, island, c_mun, c_bgy = GeographyService.validate_location(mun, bgy)
            if not is_valid or not c_mun:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Invalid Batanes location: '{mun}', '{bgy}'.",
                )
            job.municipality = c_mun
            job.barangay = c_bgy

        if update_data.status is not None:
            job.status = update_data.status

        updated = JobRepository.update(db, job)
        return JobService._to_job_out(updated)

    @staticmethod
    def soft_delete_job(db: Session, job_id: int, employer: User) -> None:
        """
        Soft-deletes a job posting (Section 7.5):
        status = 'closed', deleted_at = utc_now().
        """
        job = JobRepository.get_by_id(db, job_id, include_deleted=False)
        if not job:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Job posting not found.",
            )

        if job.employer_id != employer.id and employer.role != "admin":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have permission to delete this job.",
            )

        job.status = "closed"
        job.deleted_at = datetime.now(timezone.utc)
        JobRepository.update(db, job)

    @staticmethod
    def list_active_jobs(
        db: Session,
        municipality: Optional[str] = None,
        island: Optional[str] = None,
        keyword: Optional[str] = None,
        employment_type: Optional[str] = None,
        limit: int = 50,
        offset: int = 0,
    ) -> List[JobOut]:
        """Lists active jobs for public browsing and filtering."""
        jobs = JobRepository.list_active_jobs(
            db,
            municipality=municipality,
            island=island,
            keyword=keyword,
            employment_type=employment_type,
            limit=limit,
            offset=offset,
        )
        return [JobService._to_job_out(j) for j in jobs]

    @staticmethod
    def list_employer_jobs(
        db: Session, employer_id: int, include_closed: bool = True, limit: int = 50, offset: int = 0
    ) -> List[JobOut]:
        """Lists jobs posted by an employer."""
        jobs = JobRepository.list_by_employer(
            db, employer_id=employer_id, include_closed=include_closed, limit=limit, offset=offset
        )
        return [JobService._to_job_out(j) for j in jobs]

    # --- Saved Jobs (Bookmarks) ---

    @staticmethod
    def save_job(db: Session, seeker: User, job_id: int) -> None:
        """Bookmarks an active job for a seeker (Section 7.6)."""
        if seeker.role != "job_seeker":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only job seekers can bookmark jobs.",
            )

        job = JobRepository.get_by_id(db, job_id, include_deleted=False)
        if not job or job.status != "active":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Only active jobs can be bookmarked.",
            )

        existing = SavedJobRepository.get_by_seeker_and_job(db, seeker.id, job_id)
        if existing:
            return  # Idempotent

        saved = SavedJob(seeker_id=seeker.id, job_id=job_id)
        SavedJobRepository.create(db, saved)

    @staticmethod
    def remove_saved_job(db: Session, seeker: User, job_id: int) -> None:
        """Removes a bookmarked job."""
        if seeker.role != "job_seeker":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only job seekers can manage bookmarks.",
            )

        saved = SavedJobRepository.get_by_seeker_and_job(db, seeker.id, job_id)
        if not saved:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Saved job not found.",
            )
        SavedJobRepository.delete(db, saved)

    @staticmethod
    def list_saved_jobs(db: Session, seeker: User) -> List[SavedJobOut]:
        """Lists bookmarked jobs for authenticated seeker."""
        if seeker.role != "job_seeker":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only job seekers can view saved jobs.",
            )
        saved_list = SavedJobRepository.list_by_seeker(db, seeker.id)
        return [
            SavedJobOut(
                id=s.id,
                saved_at=s.saved_at,
                job=JobService._to_job_out(s.job),
            )
            for s in saved_list
        ]
