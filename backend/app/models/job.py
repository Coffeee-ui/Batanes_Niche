from datetime import datetime, timezone
from decimal import Decimal
from typing import List, Optional
from sqlalchemy import String, Text, DateTime, CheckConstraint, ForeignKey, Integer, Numeric, Index
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database.base import Base


class Job(Base):
    __tablename__ = "jobs"
    __table_args__ = (
        CheckConstraint("status IN ('active', 'closed', 'draft')", name="ck_jobs_status"),
        Index("ix_jobs_status_municipality", "status", "municipality"),
        Index("ix_jobs_employer_id", "employer_id"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True, index=True)
    employer_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    title: Mapped[str] = mapped_column(String(150), index=True, nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    municipality: Mapped[str] = mapped_column(String(50), index=True, nullable=False)
    barangay: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    salary_min: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)
    salary_max: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)
    employment_type: Mapped[str] = mapped_column(String(50), nullable=False)
    required_skills: Mapped[str] = mapped_column(Text, nullable=False)
    status: Mapped[str] = mapped_column(String(20), default="active", index=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False
    )
    deleted_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)

    # Relationships
    employer: Mapped["User"] = relationship("User", back_populates="jobs")
    applications: Mapped[List["Application"]] = relationship(
        "Application", back_populates="job", cascade="all, delete-orphan"
    )
    saved_by: Mapped[List["SavedJob"]] = relationship(
        "SavedJob", back_populates="job", cascade="all, delete-orphan"
    )
