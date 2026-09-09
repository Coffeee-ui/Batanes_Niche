from typing import List, Optional
from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.user import User, EmployerProfile, JobSeekerProfile
from app.schemas.user import (
    PrivateUserProfile,
    PublicJobSeekerSummary,
    UserProfileUpdate,
    EmployerProfileOut,
    JobSeekerProfileOut,
)
from app.repositories.user_repository import UserRepository
from app.services.geography_service import GeographyService
from app.services.skill_service import serialize_skill_values


class UserService:
    @staticmethod
    def calculate_profile_completeness(user: User) -> int:
        """
        Computes profile completeness score (0-100 pts) per Section 7.3 exact point breakdown:
        Base Fields:
        - Full Name (len >= 2 trimmed): +15
        - Phone Number (len >= 7 trimmed): +10
        - Municipality (non-empty): +10
        - Barangay (non-empty): +10
        - Skills (non-empty): +15
        - Profile Picture URL (non-empty): +5
        - Resume URL (non-empty): +10
        Role-Specific:
        If job_seeker:
          - Bio (non-empty): +10
          - Education (non-empty): +15
        If employer:
          - Company Name (non-empty): +10
          - Company Description (non-empty): +15
        Total = min(sum_of_points, 100)
        """
        points = 0

        # Base Fields
        if user.full_name and len(user.full_name.strip()) >= 2:
            points += 15
        if user.phone_number and len(user.phone_number.strip()) >= 7:
            points += 10
        if user.municipality and len(user.municipality.strip()) > 0:
            points += 10
        if user.barangay and len(user.barangay.strip()) > 0:
            points += 10
        if user.skills and len(user.skills.strip()) > 0:
            points += 15
        if user.profile_pic and len(user.profile_pic.strip()) > 0:
            points += 5
        if user.resume_url and len(user.resume_url.strip()) > 0:
            points += 10

        # Role-Specific Fields
        if user.role == "job_seeker" and user.job_seeker_profile:
            profile = user.job_seeker_profile
            if profile.bio and len(profile.bio.strip()) > 0:
                points += 10
            if profile.education and len(profile.education.strip()) > 0:
                points += 15
        elif user.role == "employer" and user.employer_profile:
            profile = user.employer_profile
            if profile.company_name and len(profile.company_name.strip()) > 0:
                points += 10
            if profile.company_description and len(profile.company_description.strip()) > 0:
                points += 15

        return min(points, 100)

    @staticmethod
    def get_private_profile(user: User) -> PrivateUserProfile:
        """Constructs private profile representation with completeness score."""
        completeness = UserService.calculate_profile_completeness(user)
        island = GeographyService.resolve_island(user.municipality) or "Batan Island"

        emp_out = None
        if user.employer_profile:
            emp_out = EmployerProfileOut(
                company_name=user.employer_profile.company_name,
                company_address=user.employer_profile.company_address,
                company_description=user.employer_profile.company_description,
                business_type=user.employer_profile.business_type,
            )

        seeker_out = None
        if user.job_seeker_profile:
            seeker_out = JobSeekerProfileOut(
                bio=user.job_seeker_profile.bio,
                education=user.job_seeker_profile.education,
                experience_years=user.job_seeker_profile.experience_years,
            )

        return PrivateUserProfile(
            id=user.id,
            username=user.username,
            email=user.email,
            full_name=user.full_name,
            phone_number=user.phone_number,
            municipality=user.municipality,
            island=island,
            barangay=user.barangay,
            skills=user.skills,
            profile_pic=user.profile_pic,
            resume_url=user.resume_url,
            role=user.role,
            account_status=user.account_status,
            profile_completeness=completeness,
            employer_profile=emp_out,
            job_seeker_profile=seeker_out,
            created_at=user.created_at,
        )

    @staticmethod
    def update_profile(db: Session, user: User, update_data: UserProfileUpdate) -> PrivateUserProfile:
        """Updates user profile attributes and validates canonical location if changed."""
        if update_data.full_name is not None:
            user.full_name = update_data.full_name.strip()
        if update_data.phone_number is not None:
            user.phone_number = update_data.phone_number.strip() if update_data.phone_number else None
        if update_data.skills is not None:
            user.skills = serialize_skill_values(update_data.skills.split(","))
        if update_data.profile_pic is not None:
            user.profile_pic = update_data.profile_pic.strip() if update_data.profile_pic else None
        if update_data.resume_url is not None:
            user.resume_url = update_data.resume_url.strip() if update_data.resume_url else None

        # Validate location if municipality or barangay updated
        new_mun = update_data.municipality or user.municipality
        new_bgy = update_data.barangay if update_data.barangay is not None else user.barangay

        is_valid, island, c_mun, c_bgy = GeographyService.validate_location(new_mun, new_bgy)
        if not is_valid or not c_mun:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid Batanes location: '{new_mun}', '{new_bgy}'.",
            )
        user.municipality = c_mun
        user.barangay = c_bgy

        # Role-specific updates
        if user.role == "job_seeker":
            if not user.job_seeker_profile:
                user.job_seeker_profile = JobSeekerProfile(user_id=user.id)
            if update_data.bio is not None:
                user.job_seeker_profile.bio = update_data.bio.strip() if update_data.bio else None
            if update_data.education is not None:
                user.job_seeker_profile.education = update_data.education.strip() if update_data.education else None
            if update_data.experience_years is not None:
                user.job_seeker_profile.experience_years = update_data.experience_years

        elif user.role == "employer":
            if not user.employer_profile:
                user.employer_profile = EmployerProfile(
                    user_id=user.id,
                    company_name=f"{user.full_name}'s Enterprise",
                    company_address=f"{c_mun}, Batanes",
                    business_type="General Enterprise",
                )
            if update_data.company_name is not None:
                user.employer_profile.company_name = update_data.company_name.strip()
            if update_data.company_address is not None:
                user.employer_profile.company_address = update_data.company_address.strip()
            if update_data.company_description is not None:
                user.employer_profile.company_description = (
                    update_data.company_description.strip() if update_data.company_description else None
                )
            if update_data.business_type is not None:
                user.employer_profile.business_type = " ".join(update_data.business_type.split())

        updated_user = UserRepository.update(db, user)
        return UserService.get_private_profile(updated_user)

    @staticmethod
    def search_job_seekers(
        db: Session,
        municipality: Optional[str] = None,
        island: Optional[str] = None,
        skill: Optional[str] = None,
        limit: int = 50,
        offset: int = 0,
    ) -> List[PublicJobSeekerSummary]:
        """
        Sanitized candidate directory search (Section 13 & 15.1).
        Excludes phone_number, email, and username for applicant privacy.
        """
        users = UserRepository.list_job_seekers(
            db, municipality=municipality, island=island, skill=skill, limit=limit, offset=offset
        )
        summaries = []
        for u in users:
            isl = GeographyService.resolve_island(u.municipality) or "Batan Island"
            bio = u.job_seeker_profile.bio if u.job_seeker_profile else None
            edu = u.job_seeker_profile.education if u.job_seeker_profile else None
            exp = u.job_seeker_profile.experience_years if u.job_seeker_profile else 0

            summaries.append(
                PublicJobSeekerSummary(
                    id=u.id,
                    full_name=u.full_name,
                    municipality=u.municipality,
                    island=isl,
                    barangay=u.barangay,
                    skills=u.skills,
                    education=edu,
                    experience_years=exp,
                    bio=bio,
                    profile_pic=u.profile_pic,
                )
            )
        return summaries
