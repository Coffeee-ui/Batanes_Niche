from typing import List, Optional
from sqlalchemy import select, func
from sqlalchemy.orm import Session, joinedload
from app.models.application import Application
from app.models.job import Job
from app.models.user import User


class ApplicationRepository:
    @staticmethod
    def get_by_id(db: Session, app_id: int) -> Optional[Application]:
        stmt = (
            select(Application)
            .options(
                joinedload(Application.job).joinedload(Job.employer),
                joinedload(Application.seeker).joinedload(User.job_seeker_profile),
            )
            .where(Application.id == app_id)
        )
        return db.scalars(stmt).first()

    @staticmethod
    def get_by_job_and_seeker(db: Session, job_id: int, seeker_id: int) -> Optional[Application]:
        stmt = select(Application).where(
            Application.job_id == job_id, Application.seeker_id == seeker_id
        )
        return db.scalars(stmt).first()

    @staticmethod
    def create(db: Session, application: Application) -> Application:
        db.add(application)
        # Note: Do not commit here if part of atomic transaction
        return application

    @staticmethod
    def update(db: Session, application: Application) -> Application:
        db.add(application)
        return application

    @staticmethod
    def list_by_seeker(db: Session, seeker_id: int, limit: int = 50, offset: int = 0) -> List[Application]:
        stmt = (
            select(Application)
            .options(joinedload(Application.job).joinedload(Job.employer))
            .where(Application.seeker_id == seeker_id)
            .order_by(Application.created_at.desc())
            .offset(offset)
            .limit(limit)
        )
        return list(db.scalars(stmt).all())

    @staticmethod
    def list_by_employer(db: Session, employer_id: int, limit: int = 50, offset: int = 0) -> List[Application]:
        stmt = (
            select(Application)
            .join(Job, Application.job_id == Job.id)
            .options(
                joinedload(Application.job),
                joinedload(Application.seeker).joinedload(User.job_seeker_profile),
            )
            .where(Job.employer_id == employer_id)
            .order_by(Application.created_at.desc())
            .offset(offset)
            .limit(limit)
        )
        return list(db.scalars(stmt).all())

    @staticmethod
    def has_active_application(db: Session, job_id: int, seeker_id: int) -> bool:
        stmt = select(Application.id).where(
            Application.job_id == job_id, Application.seeker_id == seeker_id
        )
        return db.scalar(stmt) is not None

    @staticmethod
    def count_applications(db: Session) -> int:
        stmt = select(func.count(Application.id))
        return db.scalar(stmt) or 0
