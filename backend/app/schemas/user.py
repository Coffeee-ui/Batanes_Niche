from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict


class EmployerProfileOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    company_name: str
    company_address: str
    company_description: Optional[str] = None
    business_type: str


class JobSeekerProfileOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    bio: Optional[str] = None
    education: Optional[str] = None
    experience_years: int = 0


class PublicJobSeekerSummary(BaseModel):
    """
    Public discovery & candidate directory schema (Section 15.1).
    Strictly omits email, phone_number, and username for applicant privacy.
    """
    model_config = ConfigDict(from_attributes=True)

    id: int
    full_name: str
    municipality: str
    island: str
    barangay: Optional[str] = None
    skills: Optional[str] = None
    education: Optional[str] = None
    experience_years: int = 0
    bio: Optional[str] = None
    profile_pic: Optional[str] = None


class PrivateUserProfile(BaseModel):
    """
    Private profile schema inspected exclusively by authenticated owner (Section 15.2).
    """
    model_config = ConfigDict(from_attributes=True)

    id: int
    username: str
    email: str
    full_name: str
    phone_number: Optional[str] = None
    municipality: str
    island: str
    barangay: Optional[str] = None
    skills: Optional[str] = None
    profile_pic: Optional[str] = None
    resume_url: Optional[str] = None
    role: str
    account_status: str
    profile_completeness: int
    employer_profile: Optional[EmployerProfileOut] = None
    job_seeker_profile: Optional[JobSeekerProfileOut] = None
    created_at: datetime


class EmployerApplicantProfile(BaseModel):
    """
    Authorized applicant profile exposed strictly to the owning employer of the job (Section 15.3).
    """
    model_config = ConfigDict(from_attributes=True)

    seeker_id: int
    full_name: str
    email: str
    phone_number: Optional[str] = None
    municipality: str
    island: str
    barangay: Optional[str] = None
    skills: Optional[str] = None
    education: Optional[str] = None
    experience_years: int = 0
    bio: Optional[str] = None
    profile_pic: Optional[str] = None
    resume_url: Optional[str] = None


class UserProfileUpdate(BaseModel):
    full_name: Optional[str] = None
    phone_number: Optional[str] = None
    municipality: Optional[str] = None
    barangay: Optional[str] = None
    skills: Optional[str] = None
    profile_pic: Optional[str] = None
    resume_url: Optional[str] = None

    # Job seeker fields
    bio: Optional[str] = None
    education: Optional[str] = None
    experience_years: Optional[int] = None

    # Employer fields
    company_name: Optional[str] = None
    company_address: Optional[str] = None
    company_description: Optional[str] = None
    business_type: Optional[str] = None
