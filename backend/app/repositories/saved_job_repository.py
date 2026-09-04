from typing import List, Optional
from sqlalchemy import select
from sqlalchemy.orm import Session, joinedload
from app.models.saved_job import SavedJob
from app.models.job import Job


class SavedJobRepository:
    @staticmethod
    def get_by_seeker_and_job(db: Session, seeker_id: int, job_id: int) -> Optional[SavedJob]:
        stmt = select(SavedJob).where(
            SavedJob.seeker_id == seeker_id, SavedJob.job_id == job_id
        )
        return db.scalars(stmt).first()

    @staticmethod
    def create(db: Session, saved_job: SavedJob) -> SavedJob:
        db.add(saved_job)
        db.commit()
        db.refresh(saved_job)
        return saved_job

    @staticmethod
    def delete(db: Session, saved_job: SavedJob) -> None:
        db.delete(saved_job)
        db.commit()

    @staticmethod
    def list_by_seeker(db: Session, seeker_id: int) -> List[SavedJob]:
        stmt = (
            select(SavedJob)
            .options(joinedload(SavedJob.job).joinedload(Job.employer))
            .where(SavedJob.seeker_id == seeker_id)
            .order_by(SavedJob.saved_at.desc())
        )
        return list(db.scalars(stmt).all())
