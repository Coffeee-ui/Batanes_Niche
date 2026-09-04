from datetime import datetime, timezone
from typing import List, Optional
from sqlalchemy import String, Text, DateTime, CheckConstraint, ForeignKey, Integer
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database.base import Base


class User(Base):
    __tablename__ = "users"
    __table_args__ = (
        CheckConstraint("role IN ('job_seeker', 'employer', 'admin')", name="ck_users_role"),
        CheckConstraint("account_status IN ('active', 'suspended', 'inactive')", name="ck_users_account_status"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True, index=True)
    username: Mapped[str] = mapped_column(String(50), unique=True, index=True, nullable=False)
    email: Mapped[str] = mapped_column(String(100), unique=True, index=True, nullable=False)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    full_name: Mapped[str] = mapped_column(String(100), nullable=False)
    phone_number: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    municipality: Mapped[str] = mapped_column(String(50), nullable=False)
    barangay: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    skills: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    profile_pic: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    resume_url: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    role: Mapped[str] = mapped_column(String(20), nullable=False)
    account_status: Mapped[str] = mapped_column(String(20), default="active", nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False
    )

    # Relationships
    employer_profile: Mapped[Optional["EmployerProfile"]] = relationship(
        "EmployerProfile", back_populates="user", uselist=False, cascade="all, delete-orphan"
    )
    job_seeker_profile: Mapped[Optional["JobSeekerProfile"]] = relationship(
        "JobSeekerProfile", back_populates="user", uselist=False, cascade="all, delete-orphan"
    )
    jobs: Mapped[List["Job"]] = relationship(
        "Job", back_populates="employer", cascade="all, delete-orphan"
    )
    applications: Mapped[List["Application"]] = relationship(
        "Application", back_populates="seeker", cascade="all, delete-orphan"
    )
    saved_jobs: Mapped[List["SavedJob"]] = relationship(
        "SavedJob", back_populates="seeker", cascade="all, delete-orphan"
    )
    notifications: Mapped[List["Notification"]] = relationship(
        "Notification", back_populates="user", cascade="all, delete-orphan"
    )
    refresh_tokens: Mapped[List["RefreshToken"]] = relationship(
        "RefreshToken", back_populates="user", cascade="all, delete-orphan"
    )
    password_reset_tokens: Mapped[List["PasswordResetToken"]] = relationship(
        "PasswordResetToken", back_populates="user", cascade="all, delete-orphan"
    )


class EmployerProfile(Base):
    __tablename__ = "employer_profiles"

    user_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("users.id", ondelete="CASCADE"), primary_key=True
    )
    company_name: Mapped[str] = mapped_column(String(100), nullable=False)
    company_address: Mapped[str] = mapped_column(Text, nullable=False)
    company_description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    business_type: Mapped[str] = mapped_column(String(50), nullable=False)

    user: Mapped["User"] = relationship("User", back_populates="employer_profile")


class JobSeekerProfile(Base):
    __tablename__ = "job_seeker_profiles"

    user_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("users.id", ondelete="CASCADE"), primary_key=True
    )
    bio: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    education: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    experience_years: Mapped[int] = mapped_column(Integer, default=0, nullable=False)

    user: Mapped["User"] = relationship("User", back_populates="job_seeker_profile")
