import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from fastapi.testclient import TestClient

from app.database.base import Base
from app.database.session import get_db
from app.main import app
from app.core.security import get_password_hash
from app.models.user import User, EmployerProfile, JobSeekerProfile
from app.models.job import Job

from sqlalchemy.pool import StaticPool

# Test in-memory SQLite database with StaticPool to share connection across threads
TEST_SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"

test_engine = create_engine(
    TEST_SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)


@pytest.fixture(scope="function")
def db_session():
    """Provides a fresh database session for each test."""
    Base.metadata.create_all(bind=test_engine)
    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.close()
        Base.metadata.drop_all(bind=test_engine)


@pytest.fixture(autouse=True)
def disable_limiter():
    """Disables SlowAPI rate limiter during test execution."""
    from app.api.deps import limiter
    limiter.enabled = False
    yield
    limiter.enabled = True


@pytest.fixture(scope="function")
def client(db_session):
    """FastAPI TestClient with overridden get_db dependency."""
    def override_get_db():
        try:
            yield db_session
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()


@pytest.fixture
def test_admin(db_session):
    admin = User(
        username="test_admin",
        email="admin@test.ph",
        password_hash=get_password_hash("AdminPass123!"),
        full_name="Admin Test",
        phone_number="09111111111",
        municipality="Basco",
        barangay="San Antonio",
        role="admin",
        account_status="active",
    )
    db_session.add(admin)
    db_session.commit()
    db_session.refresh(admin)
    return admin


@pytest.fixture
def test_employer(db_session):
    emp = User(
        username="test_employer",
        email="employer@test.ph",
        password_hash=get_password_hash("EmployerPass123!"),
        full_name="Employer Test",
        phone_number="09222222222",
        municipality="Basco",
        barangay="Kayvaluganan",
        role="employer",
        account_status="active",
    )
    profile = EmployerProfile(
        company_name="Batan Eco Tours",
        company_address="Basco, Batanes",
        company_description="Eco tourism company",
        business_type="Tourism & Hospitality",
    )
    emp.employer_profile = profile
    db_session.add(emp)
    db_session.commit()
    db_session.refresh(emp)
    return emp


@pytest.fixture
def test_seeker(db_session):
    seeker = User(
        username="test_seeker",
        email="seeker@test.ph",
        password_hash=get_password_hash("SeekerPass123!"),
        full_name="Seeker Test",
        phone_number="09333333333",
        municipality="Basco",
        barangay="San Antonio",
        role="job_seeker",
        skills="Tourism & Tour Guiding, Arc Welding, Carpentry",
        account_status="active",
    )
    profile = JobSeekerProfile(
        bio="Experienced tour guide",
        education="Bachelor's Degree",
        experience_years=3,
    )
    seeker.job_seeker_profile = profile
    db_session.add(seeker)
    db_session.commit()
    db_session.refresh(seeker)
    return seeker


@pytest.fixture
def test_job(db_session, test_employer):
    job = Job(
        employer_id=test_employer.id,
        title="Heritage Tour Guide",
        description="Lead tourists through historical sites",
        municipality="Basco",
        barangay="San Antonio",
        salary_min=18000,
        salary_max=24000,
        employment_type="Full-time",
        required_skills="Tourism & Tour Guiding, Customer Service",
        status="active",
    )
    db_session.add(job)
    db_session.commit()
    db_session.refresh(job)
    return job
