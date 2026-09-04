import argparse
import sys
from sqlalchemy import text
from app.database.session import SessionLocal
from app.models.user import User
from app.core.security import get_password_hash
from app.repositories.user_repository import UserRepository


def create_admin(username: str, email: str, password: str, full_name: str = "System Administrator"):
    db = SessionLocal()
    try:
        existing = UserRepository.get_by_username_or_email(db, username) or UserRepository.get_by_email(db, email)
        if existing:
            print(f"User with username '{username}' or email '{email}' already exists.")
            return

        admin_user = User(
            username=username.strip(),
            email=email.strip().lower(),
            password_hash=get_password_hash(password),
            full_name=full_name.strip(),
            phone_number="09123456789",
            municipality="Basco",
            barangay="San Antonio",
            role="admin",
            account_status="active",
        )
        UserRepository.create(db, admin_user)
        print(f"Administrator '{username}' successfully created!")
    finally:
        db.close()


def seed_data():
    """Seeds canonical Batanes demo data for testing and development."""
    db = SessionLocal()
    try:
        print("Seeding demo data...")
        from app.schemas.auth import UserRegister
        from app.services.auth_service import AuthService
        from app.schemas.job import JobCreate
        from app.services.job_service import JobService

        # 1. Create Admin
        create_admin("admin", "admin@batanesniche.ph", "AdminSecure123!", "Platform Administrator")

        # 2. Create Employer
        if not UserRepository.get_by_username(db, "batanes_inn"):
            emp_data = UserRegister(
                username="batanes_inn",
                email="manager@batanesinn.ph",
                password="EmployerSecure123!",
                full_name="Maria Castillejos",
                phone_number="09191234567",
                municipality="Basco",
                barangay="Kayvaluganan",
                role="employer",
                company_name="Batanes Seaside Inn & Tours",
                company_address="National Road, Basco, Batanes",
                company_description="Premier eco-tourism and authentic Ivatan hospitality lodge in Basco.",
                business_type="Tourism & Hospitality",
            )
            emp_user, _ = AuthService.register_user(db, emp_data)
            print("Seeded employer: batanes_inn")

            # Post jobs
            j1 = JobCreate(
                title="Tour Guide & Heritage Coordinator",
                description="Lead heritage tours across Batan Island landmarks. Knowledge of Ivatan culture and eco-tourism required.",
                municipality="Basco",
                barangay="Kayvaluganan",
                salary_min=18000.0,
                salary_max=25000.0,
                employment_type="Full-time",
                required_skills="Tourism & Tour Guiding, Customer Service, Driving (Professional License)",
            )
            JobService.create_job(db, emp_user, j1)

            j2 = JobCreate(
                title="Guest Services & Culinary Assistant",
                description="Support front desk hospitality and authentic Ivatan breakfast preparation for eco-lodge guests.",
                municipality="Basco",
                barangay="Chanarian",
                salary_min=15000.0,
                salary_max=20000.0,
                employment_type="Full-time",
                required_skills="Hotel & Hospitality, Culinary Arts & Cooking, Customer Service",
            )
            JobService.create_job(db, emp_user, j2)
            print("Seeded jobs for batanes_inn")

        # 3. Create Seeker
        if not UserRepository.get_by_username(db, "ivatan_guide"):
            seeker_data = UserRegister(
                username="ivatan_guide",
                email="juan@batanesguide.ph",
                password="SeekerSecure123!",
                full_name="Juan Abad",
                phone_number="09289876543",
                municipality="Basco",
                barangay="San Antonio",
                role="job_seeker",
                skills="Tourism & Tour Guiding, Customer Service, Arc Welding",
                bio="Passionate Ivatan certified tour guide with 4 years experience in Northern Batan and Sabtang cultural tours.",
                education="Bachelor's Degree",
                experience_years=4,
            )
            seeker_user, _ = AuthService.register_user(db, seeker_data)
            print("Seeded seeker: ivatan_guide")

        print("Database seeding completed successfully!")
    finally:
        db.close()


def main():
    parser = argparse.ArgumentParser(description="Batanes Niche Management CLI")
    subparsers = parser.add_subparsers(dest="command")

    # create-admin
    admin_parser = subparsers.add_parser("create-admin", help="Create an administrator account")
    admin_parser.add_argument("--username", required=True, help="Admin username")
    admin_parser.add_argument("--email", required=True, help="Admin email")
    admin_parser.add_argument("--password", required=True, help="Admin password")
    admin_parser.add_argument("--full-name", default="Platform Administrator", help="Admin full name")

    # seed-data
    subparsers.add_parser("seed-data", help="Seed reference data and demo accounts")

    args = parser.parse_args()

    if args.command == "create-admin":
        create_admin(args.username, args.email, args.password, args.full_name)
    elif args.command == "seed-data":
        seed_data()
    else:
        parser.print_help()


if __name__ == "__main__":
    main()
