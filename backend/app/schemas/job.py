from datetime import datetime
from decimal import Decimal
from typing import Optional
from pydantic import BaseModel, ConfigDict, Field


class JobCreate(BaseModel):
    title: str = Field(..., min_length=2, max_length=150)
    description: str = Field(..., min_length=10)
    municipality: str = Field(..., min_length=2, max_length=50)
    barangay: Optional[str] = Field(None, max_length=100)
    salary_min: Decimal = Field(..., ge=0)
    salary_max: Decimal = Field(..., ge=0)
    employment_type: str = Field(..., max_length=50)
    required_skills: str = Field(..., min_length=1)


class JobUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=2, max_length=150)
    description: Optional[str] = Field(None, min_length=10)
    municipality: Optional[str] = Field(None, min_length=2, max_length=50)
    barangay: Optional[str] = Field(None, max_length=100)
    salary_min: Optional[Decimal] = Field(None, ge=0)
    salary_max: Optional[Decimal] = Field(None, ge=0)
    employment_type: Optional[str] = Field(None, max_length=50)
    required_skills: Optional[str] = Field(None, min_length=1)
    status: Optional[str] = Field(None, pattern="^(active|closed|draft)$")


class JobOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    employer_id: int
    title: str
    description: str
    municipality: str
    island: str
    barangay: Optional[str] = None
    salary_min: Decimal
    salary_max: Decimal
    employment_type: str
    required_skills: str
    status: str
    created_at: datetime
    company_name: Optional[str] = None


class SavedJobOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    saved_at: datetime
    job: JobOut
