from datetime import datetime, timezone
from typing import Optional
from sqlalchemy import String, Text, DateTime, CheckConstraint, ForeignKey, Integer, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database.base import Base


class Application(Base):
    __tablename__ = "applications"
    __table_args__ = (
        CheckConstraint("status IN ('pending', 'accepted', 'rejected')", name="ck_applications_status"),
        UniqueConstraint("job_id", "seeker_id", name="uq_applications_job_seeker"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True, index=True)
    job_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("jobs.id", ondelete="CASCADE"), index=True, nullable=False
    )
    seeker_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False
    )
    cover_letter: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    resume_url: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    status: Mapped[str] = mapped_column(String(20), default="pending", nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False
    )

    # Relationships
    job: Mapped["Job"] = relationship("Job", back_populates="applications")
    seeker: Mapped["User"] = relationship("User", back_populates="applications")
