from datetime import datetime, timezone
from sqlalchemy import DateTime, ForeignKey, Integer, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database.base import Base


class SavedJob(Base):
    __tablename__ = "saved_jobs"
    __table_args__ = (
        UniqueConstraint("seeker_id", "job_id", name="uq_saved_jobs_seeker_job"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True, index=True)
    seeker_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False
    )
    job_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("jobs.id", ondelete="CASCADE"), index=True, nullable=False
    )
    saved_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False
    )

    # Relationships
    seeker: Mapped["User"] = relationship("User", back_populates="saved_jobs")
    job: Mapped["Job"] = relationship("Job", back_populates="saved_by")
