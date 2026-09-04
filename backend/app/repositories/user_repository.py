from typing import List, Optional, Tuple
from sqlalchemy import select, func, or_
from sqlalchemy.orm import Session
from app.models.user import User, EmployerProfile, JobSeekerProfile
from app.core.geography import MUNICIPALITY_TO_ISLAND


class UserRepository:
    @staticmethod
    def get_by_id(db: Session, user_id: int) -> Optional[User]:
        stmt = select(User).where(User.id == user_id)
        return db.scalars(stmt).first()

    @staticmethod
    def get_by_username(db: Session, username: str) -> Optional[User]:
        stmt = select(User).where(User.username == username)
        return db.scalars(stmt).first()

    @staticmethod
    def get_by_email(db: Session, email: str) -> Optional[User]:
        stmt = select(User).where(func.lower(User.email) == email.strip().lower())
        return db.scalars(stmt).first()

    @staticmethod
    def get_by_username_or_email(db: Session, identifier: str) -> Optional[User]:
        clean = identifier.strip().lower()
        stmt = select(User).where(
            or_(func.lower(User.username) == clean, func.lower(User.email) == clean)
        )
        return db.scalars(stmt).first()

    @staticmethod
    def create(
        db: Session,
        user: User,
        employer_profile: Optional[EmployerProfile] = None,
        job_seeker_profile: Optional[JobSeekerProfile] = None,
    ) -> User:
        db.add(user)
        db.flush()
        if employer_profile:
            employer_profile.user_id = user.id
            db.add(employer_profile)
        if job_seeker_profile:
            job_seeker_profile.user_id = user.id
            db.add(job_seeker_profile)
        db.commit()
        db.refresh(user)
        return user

    @staticmethod
    def update(db: Session, user: User) -> User:
        db.add(user)
        db.commit()
        db.refresh(user)
        return user

    @staticmethod
    def list_job_seekers(
        db: Session,
        municipality: Optional[str] = None,
        island: Optional[str] = None,
        skill: Optional[str] = None,
        limit: int = 50,
        offset: int = 0,
    ) -> List[User]:
        stmt = (
            select(User)
            .where(User.role == "job_seeker", User.account_status == "active")
        )
        if municipality:
            stmt = stmt.where(func.lower(User.municipality) == municipality.strip().lower())
        if island:
            # Match municipalities that belong to the specified island
            muns_on_island = [
                mun for mun, isl in MUNICIPALITY_TO_ISLAND.items()
                if isl.lower() == island.strip().lower()
            ]
            stmt = stmt.where(User.municipality.in_(muns_on_island))
        if skill:
            stmt = stmt.where(User.skills.ilike(f"%{skill.strip()}%"))

        stmt = stmt.order_by(User.full_name.asc()).offset(offset).limit(limit)
        return list(db.scalars(stmt).all())

    @staticmethod
    def count_users(db: Session, role: Optional[str] = None, status: Optional[str] = None) -> int:
        stmt = select(func.count(User.id))
        if role:
            stmt = stmt.where(User.role == role)
        if status:
            stmt = stmt.where(User.account_status == status)
        return db.scalar(stmt) or 0

    @staticmethod
    def list_users_for_admin(
        db: Session,
        query: Optional[str] = None,
        role: Optional[str] = None,
        status: Optional[str] = None,
        limit: int = 50,
        offset: int = 0,
    ) -> List[User]:
        stmt = select(User)
        if query:
            q = f"%{query.strip().lower()}%"
            stmt = stmt.where(
                or_(
                    func.lower(User.username).like(q),
                    func.lower(User.email).like(q),
                    func.lower(User.full_name).like(q),
                )
            )
        if role:
            stmt = stmt.where(User.role == role)
        if status:
            stmt = stmt.where(User.account_status == status)
        stmt = stmt.order_by(User.id.desc()).offset(offset).limit(limit)
        return list(db.scalars(stmt).all())
