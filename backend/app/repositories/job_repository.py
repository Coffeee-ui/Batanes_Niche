from typing import List, Optional
from sqlalchemy import select, func, or_
from sqlalchemy.orm import Session, joinedload
from app.models.job import Job
from app.core.geography import MUNICIPALITY_TO_ISLAND


class JobRepository:
    @staticmethod
    def get_by_id(db: Session, job_id: int, include_deleted: bool = False) -> Optional[Job]:
        stmt = select(Job).options(joinedload(Job.employer)).where(Job.id == job_id)
        if not include_deleted:
            stmt = stmt.where(Job.deleted_at.is_(None))
        return db.scalars(stmt).first()

    @staticmethod
    def create(db: Session, job: Job) -> Job:
        db.add(job)
        db.commit()
        db.refresh(job)
        return job

    @staticmethod
    def update(db: Session, job: Job) -> Job:
        db.add(job)
        db.commit()
        db.refresh(job)
        return job

    @staticmethod
    def list_active_jobs(
        db: Session,
        municipality: Optional[str] = None,
        island: Optional[str] = None,
        keyword: Optional[str] = None,
        employment_type: Optional[str] = None,
        limit: int = 50,
        offset: int = 0,
    ) -> List[Job]:
        stmt = (
            select(Job)
            .options(joinedload(Job.employer))
            .where(Job.status == "active", Job.deleted_at.is_(None))
        )

        if municipality:
            stmt = stmt.where(func.lower(Job.municipality) == municipality.strip().lower())
        if island:
            muns_on_island = [
                mun for mun, isl in MUNICIPALITY_TO_ISLAND.items()
                if isl.lower() == island.strip().lower()
            ]
            stmt = stmt.where(Job.municipality.in_(muns_on_island))
        if keyword:
            kw = f"%{keyword.strip().lower()}%"
            stmt = stmt.where(
                or_(
                    func.lower(Job.title).like(kw),
                    func.lower(Job.description).like(kw),
                    func.lower(Job.required_skills).like(kw),
                )
            )
        if employment_type:
            stmt = stmt.where(func.lower(Job.employment_type) == employment_type.strip().lower())

        stmt = stmt.order_by(Job.created_at.desc()).offset(offset).limit(limit)
        return list(db.scalars(stmt).all())

    @staticmethod
    def list_by_employer(
        db: Session,
        employer_id: int,
        include_closed: bool = True,
        limit: int = 50,
        offset: int = 0,
    ) -> List[Job]:
        stmt = select(Job).options(joinedload(Job.employer)).where(Job.employer_id == employer_id)
        if not include_closed:
            stmt = stmt.where(Job.status == "active", Job.deleted_at.is_(None))
        stmt = stmt.order_by(Job.created_at.desc()).offset(offset).limit(limit)
        return list(db.scalars(stmt).all())

    @staticmethod
    def list_all_for_admin(
        db: Session,
        status: Optional[str] = None,
        limit: int = 50,
        offset: int = 0,
    ) -> List[Job]:
        stmt = select(Job).options(joinedload(Job.employer))
        if status:
            stmt = stmt.where(Job.status == status)
        stmt = stmt.order_by(Job.id.desc()).offset(offset).limit(limit)
        return list(db.scalars(stmt).all())

    @staticmethod
    def count_active_jobs(db: Session) -> int:
        stmt = select(func.count(Job.id)).where(Job.status == "active", Job.deleted_at.is_(None))
        return db.scalar(stmt) or 0
