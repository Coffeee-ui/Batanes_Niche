from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict, Field
from app.schemas.job import JobOut
from app.schemas.user import EmployerApplicantProfile


class ApplicationCreate(BaseModel):
    job_id: int
    cover_letter: Optional[str] = None
    resume_url: Optional[str] = None


class ApplicationUpdate(BaseModel):
    status: str = Field(..., pattern="^(pending|accepted|rejected)$")


class SeekerApplicationOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    job_id: int
    status: str
    cover_letter: Optional[str] = None
    resume_url: Optional[str] = None
    created_at: datetime
    job: Optional[JobOut] = None


class EmployerApplicationOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    job_id: int
    status: str
    cover_letter: Optional[str] = None
    resume_url: Optional[str] = None
    created_at: datetime
    applicant: EmployerApplicantProfile
