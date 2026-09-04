from typing import Optional
from pydantic import BaseModel, EmailStr, Field, field_validator
import re


class UserRegister(BaseModel):
    username: str = Field(..., min_length=3, max_length=50)
    email: EmailStr
    password: str = Field(..., min_length=8, max_length=128)
    full_name: str = Field(..., min_length=2, max_length=100)
    phone_number: Optional[str] = Field(None, max_length=20)
    municipality: str = Field(..., min_length=2, max_length=50)
    barangay: Optional[str] = Field(None, max_length=100)
    role: str = Field(...)

    # Job Seeker specific optional initial profile data
    skills: Optional[str] = None
    bio: Optional[str] = None
    education: Optional[str] = None
    experience_years: Optional[int] = 0

    # Employer specific optional initial profile data
    company_name: Optional[str] = None
    company_address: Optional[str] = None
    company_description: Optional[str] = None
    business_type: Optional[str] = None

    @field_validator("role")
    @classmethod
    def validate_registration_role(cls, v: str) -> str:
        role_clean = v.strip().lower()
        if role_clean not in ("job_seeker", "employer"):
            raise ValueError("Public registration strictly allows only 'job_seeker' or 'employer' roles.")
        return role_clean

    @field_validator("password")
    @classmethod
    def validate_password_strength(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters long.")
        if not re.search(r"[A-Z]", v):
            raise ValueError("Password must contain at least one uppercase letter.")
        if not re.search(r"[a-z]", v):
            raise ValueError("Password must contain at least one lowercase letter.")
        if not re.search(r"[0-9\W_]", v):
            raise ValueError("Password must contain at least one number or special character.")
        return v


class UserLogin(BaseModel):
    username_or_email: str
    password: str


class Token(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    role: str
    username: str


class RefreshTokenRequest(BaseModel):
    refresh_token: str


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ResetPasswordRequest(BaseModel):
    email: EmailStr
    otp_code: str = Field(..., min_length=6, max_length=6)
    new_password: str = Field(..., min_length=8, max_length=128)

    @field_validator("new_password")
    @classmethod
    def validate_new_password_strength(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters long.")
        if not re.search(r"[A-Z]", v):
            raise ValueError("Password must contain at least one uppercase letter.")
        if not re.search(r"[a-z]", v):
            raise ValueError("Password must contain at least one lowercase letter.")
        if not re.search(r"[0-9\W_]", v):
            raise ValueError("Password must contain at least one number or special character.")
        return v
