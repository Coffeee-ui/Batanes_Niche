import pytest
from fastapi import HTTPException
from app.services.job_service import JobService
from app.services.user_service import UserService
from app.services.notification_service import NotificationService
from app.services.email_delivery_service import EmailDeliveryService
from app.services.error_logging_service import ErrorLoggingService
from app.services.audit_service import AuditService
from app.schemas.job import JobCreate, JobUpdate
from app.schemas.user import UserProfileUpdate


def test_job_service_edge_cases_and_crud(db_session, test_employer, test_seeker):
    # 1. Salary min > max rejection
    with pytest.raises(HTTPException) as exc1:
        JobService.create_job(
            db_session,
            employer=test_employer,
            job_data=JobCreate(
                title="Invalid Salary Job",
                description="Testing salary validation",
                municipality="Basco",
                salary_min=50000,
                salary_max=30000,
                employment_type="Full-time",
                required_skills="IT",
            ),
        )
    assert exc1.value.status_code == 400

    # 2. Non-employer cannot create job
    with pytest.raises(HTTPException) as exc2:
        JobService.create_job(
            db_session,
            employer=test_seeker,
            job_data=JobCreate(
                title="Seeker Job",
                description="Testing role check",
                municipality="Basco",
                salary_min=10000,
                salary_max=20000,
                employment_type="Full-time",
                required_skills="IT",
            ),
        )
    assert exc2.value.status_code == 403

    # 3. Create valid job
    created_job = JobService.create_job(
        db_session,
        employer=test_employer,
        job_data=JobCreate(
            title="Valid Tourism Job",
            description="Valid description for Batanes tour",
            municipality="Basco",
            barangay="San Antonio",
            salary_min=15000,
            salary_max=22000,
            employment_type="Full-time",
            required_skills="Tourism, English",
        ),
    )
    assert created_job.id is not None
    assert created_job.title == "Valid Tourism Job"

    # 4. Update job
    updated_job = JobService.update_job(
        db_session,
        job_id=created_job.id,
        employer=test_employer,
        update_data=JobUpdate(
            title="Updated Tourism Coordinator",
            salary_max=25000,
        ),
    )
    assert updated_job.title == "Updated Tourism Coordinator"
    assert updated_job.salary_max == 25000

    # 5. Soft delete job
    JobService.soft_delete_job(db_session, job_id=created_job.id, employer=test_employer)
    soft_deleted = JobService.get_job_by_id(db_session, job_id=created_job.id, current_user=test_employer)
    assert soft_deleted.status == "closed"


def test_user_service_profile_update(db_session, test_seeker, test_employer):
    # Update seeker profile
    updated_seeker = UserService.update_profile(
        db_session,
        user=test_seeker,
        update_data=UserProfileUpdate(
            full_name="Juan Updated Abad",
            bio="Updated Ivatan professional bio",
            experience_years=5,
            skills="Tourism, Electrical, Welding",
        ),
    )
    assert updated_seeker.full_name == "Juan Updated Abad"
    assert updated_seeker.job_seeker_profile.experience_years == 5

    # Update employer profile
    updated_emp = UserService.update_profile(
        db_session,
        user=test_employer,
        update_data=UserProfileUpdate(
            company_name="Batan Eco Tours Ltd",
            company_description="Expanded eco tourism operations",
        ),
    )
    assert updated_emp.employer_profile.company_name == "Batan Eco Tours Ltd"


def test_notification_service(db_session, test_seeker):
    notif = NotificationService.create_notification(
        db_session,
        user_id=test_seeker.id,
        title="Test Notice",
        message="Notice content",
        type="new_application",
    )
    assert notif.id is not None
    assert NotificationService.get_unread_count(db_session, test_seeker.id) >= 1

    count = NotificationService.mark_all_read(db_session, test_seeker.id)
    assert count >= 1
    assert NotificationService.get_unread_count(db_session, test_seeker.id) == 0


def test_audit_service_secret_redaction(db_session, test_admin):
    audit = AuditService.log_event(
        db_session,
        action="USER_CONFIG_UPDATE",
        actor_role="admin",
        actor_id=test_admin.id,
        details={
            "setting": "site_theme",
            "password_hash": "secret_hash_value",
            "access_token": "secret_token_value",
        },
    )
    assert audit.id is not None
    assert "secret_hash_value" not in audit.details
    assert "[REDACTED]" in audit.details


def test_error_logging_service(db_session):
    report = ErrorLoggingService.record_error(
        db_session,
        error_message="Test diagnostic incident",
        endpoint="/api/v1/test",
        request_data="username=john&password=supersecretpassword",
    )
    assert report.id is not None
    assert "supersecretpassword" not in report.request_data
    assert "[REDACTED_REQUEST_DATA]" in report.request_data


def test_email_delivery_service_simulation():
    res = EmailDeliveryService.send_otp_email("recipient@batanes.ph", "123456")
    assert res is True


def test_jobs_my_endpoint(client, test_employer, test_job):
    from app.core.security import create_access_token
    token, _, _ = create_access_token(str(test_employer.id), test_employer.username, test_employer.role)
    res = client.get("/api/v1/jobs/my", headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 200
    data = res.json()
    assert len(data) >= 1
    assert data[0]["id"] == test_job.id
