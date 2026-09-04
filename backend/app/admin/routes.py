import os
from datetime import datetime, timezone
from typing import Optional
from fastapi import APIRouter, Depends, Form, HTTPException, Request, Response, status
from fastapi.responses import HTMLResponse, RedirectResponse
from fastapi.templating import Jinja2Templates
from sqlalchemy.orm import Session

from app.admin.auth import (
    ADMIN_COOKIE_NAME,
    CSRF_COOKIE_NAME,
    create_admin_session_cookie,
    get_admin_user_from_request,
    verify_csrf_token,
)
from app.core.security import verify_password
from app.database.session import get_db
from app.models.user import User
from app.models.job import Job
from app.repositories.user_repository import UserRepository
from app.repositories.job_repository import JobRepository
from app.repositories.application_repository import ApplicationRepository
from app.repositories.audit_log_repository import AuditLogRepository
from app.repositories.error_report_repository import ErrorReportRepository
from app.repositories.token_repository import TokenRepository
from app.services.audit_service import AuditService

current_dir = os.path.dirname(os.path.abspath(__file__))
templates_dir = os.path.join(current_dir, "templates")
templates = Jinja2Templates(directory=templates_dir)

admin_router = APIRouter(prefix="/admin", tags=["Administration"])


def require_admin_session(request: Request, db: Session = Depends(get_db)) -> User:
    """Dependency verifying admin session cookie. Redirects to /admin/login if unauthenticated."""
    admin_user = get_admin_user_from_request(request, db)
    if not admin_user:
        raise HTTPException(
            status_code=status.HTTP_303_SEE_OTHER,
            headers={"Location": "/admin/login"},
        )
    return admin_user


@admin_router.get("/login", response_class=HTMLResponse)
def get_login_page(request: Request, db: Session = Depends(get_db)):
    """Renders administrative login form."""
    admin_user = get_admin_user_from_request(request, db)
    if admin_user:
        return RedirectResponse(url="/admin/dashboard", status_code=status.HTTP_303_SEE_OTHER)
    return templates.TemplateResponse(request=request, name="login.html", context={"admin_user": None})


@admin_router.post("/login")
def post_login(
    request: Request,
    username: str = Form(...),
    password: str = Form(...),
    db: Session = Depends(get_db),
):
    """Authenticates admin credentials, sets secure HttpOnly session cookie and CSRF cookie."""
    user = UserRepository.get_by_username_or_email(db, username)
    client_ip = request.client.host if request.client else None

    if not user or user.role != "admin" or not verify_password(password, user.password_hash):
        AuditService.log_event(
            db=db,
            action="ADMIN_LOGIN_FAILURE",
            actor_role="unknown",
            ip_address=client_ip,
            details={"attempted_identifier": username},
        )
        return templates.TemplateResponse(
            request=request,
            name="login.html",
            context={"admin_user": None, "error": "Invalid administrator credentials."},
            status_code=status.HTTP_401_UNAUTHORIZED,
        )

    if user.account_status != "active":
        AuditService.log_event(
            db=db,
            action="ADMIN_LOGIN_FAILURE_SUSPENDED",
            actor_role="admin",
            actor_id=user.id,
            ip_address=client_ip,
            details={"account_status": user.account_status},
        )
        return templates.TemplateResponse(
            request=request,
            name="login.html",
            context={"admin_user": None, "error": "Administrator account is suspended or inactive."},
            status_code=status.HTTP_403_FORBIDDEN,
        )

    session_token, csrf_token = create_admin_session_cookie(user)

    AuditService.log_event(
        db=db,
        action="ADMIN_LOGIN_SUCCESS",
        actor_role="admin",
        actor_id=user.id,
        ip_address=client_ip,
    )

    response = RedirectResponse(url="/admin/dashboard", status_code=status.HTTP_303_SEE_OTHER)
    response.set_cookie(
        key=ADMIN_COOKIE_NAME,
        value=session_token,
        httponly=True,
        secure=False,  # Set to True in production with HTTPS
        samesite="lax",
        max_age=43200,
    )
    response.set_cookie(
        key=CSRF_COOKIE_NAME,
        value=csrf_token,
        httponly=False,
        secure=False,
        samesite="lax",
        max_age=43200,
    )
    return response


@admin_router.post("/logout")
def post_logout(request: Request, db: Session = Depends(get_db)):
    """Clears administrative session cookie and redirects to login."""
    admin_user = get_admin_user_from_request(request, db)
    if admin_user:
        AuditService.log_event(
            db=db,
            action="ADMIN_LOGOUT",
            actor_role="admin",
            actor_id=admin_user.id,
            ip_address=request.client.host if request.client else None,
        )
    response = RedirectResponse(url="/admin/login", status_code=status.HTTP_303_SEE_OTHER)
    response.delete_cookie(ADMIN_COOKIE_NAME)
    response.delete_cookie(CSRF_COOKIE_NAME)
    return response


@admin_router.get("/dashboard", response_class=HTMLResponse)
def get_dashboard(request: Request, admin_user: User = Depends(require_admin_session), db: Session = Depends(get_db)):
    """Platform overview dashboard."""
    active_users = UserRepository.count_users(db, status="active")
    active_jobs = JobRepository.count_active_jobs(db)
    apps_count = ApplicationRepository.count_applications(db)
    recent_logs = AuditLogRepository.list_logs(db, limit=5)
    csrf_token = request.cookies.get(CSRF_COOKIE_NAME, "")

    return templates.TemplateResponse(
        request=request,
        name="dashboard.html",
        context={
            "admin_user": admin_user,
            "active_tab": "dashboard",
            "active_users_count": active_users,
            "active_jobs_count": active_jobs,
            "applications_count": apps_count,
            "error_reports_count": len(ErrorReportRepository.list_reports(db, limit=100)),
            "recent_logs": recent_logs,
            "csrf_token": csrf_token,
        },
    )


@admin_router.get("/users", response_class=HTMLResponse)
def list_users(
    request: Request,
    q: Optional[str] = None,
    role: Optional[str] = None,
    status: Optional[str] = None,
    admin_user: User = Depends(require_admin_session),
    db: Session = Depends(get_db),
):
    """Inspect and filter platform users."""
    users = UserRepository.list_users_for_admin(db, query=q, role=role, status=status, limit=100)
    csrf_token = request.cookies.get(CSRF_COOKIE_NAME, "")
    return templates.TemplateResponse(
        request=request,
        name="users.html",
        context={
            "admin_user": admin_user,
            "active_tab": "users",
            "users": users,
            "q": q,
            "role": role,
            "status": status,
            "csrf_token": csrf_token,
        },
    )


@admin_router.post("/users/{user_id}/suspend")
def suspend_user(
    user_id: int,
    request: Request,
    csrf_token: str = Form(...),
    admin_user: User = Depends(require_admin_session),
    db: Session = Depends(get_db),
):
    """Suspends a user account and immediately terminates active refresh sessions (Section 17.2 & 26.6)."""
    if not verify_csrf_token(request, csrf_token):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="CSRF verification failed.")

    target_user = UserRepository.get_by_id(db, user_id)
    if not target_user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found.")

    if target_user.id == admin_user.id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="You cannot suspend yourself.")

    target_user.account_status = "suspended"
    UserRepository.update(db, target_user)

    # Immediately terminate active refresh sessions
    TokenRepository.revoke_all_user_refresh_tokens(db, target_user.id)

    AuditService.log_event(
        db=db,
        action="USER_SUSPEND",
        actor_role="admin",
        actor_id=admin_user.id,
        ip_address=request.client.host if request.client else None,
        target_type="user",
        target_id=target_user.id,
        details={"username": target_user.username, "email": target_user.email},
    )

    return RedirectResponse(url="/admin/users", status_code=status.HTTP_303_SEE_OTHER)


@admin_router.post("/users/{user_id}/restore")
def restore_user(
    user_id: int,
    request: Request,
    csrf_token: str = Form(...),
    admin_user: User = Depends(require_admin_session),
    db: Session = Depends(get_db),
):
    """Restores a suspended user account."""
    if not verify_csrf_token(request, csrf_token):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="CSRF verification failed.")

    target_user = UserRepository.get_by_id(db, user_id)
    if not target_user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found.")

    target_user.account_status = "active"
    UserRepository.update(db, target_user)

    AuditService.log_event(
        db=db,
        action="USER_RESTORE",
        actor_role="admin",
        actor_id=admin_user.id,
        ip_address=request.client.host if request.client else None,
        target_type="user",
        target_id=target_user.id,
        details={"username": target_user.username},
    )

    return RedirectResponse(url="/admin/users", status_code=status.HTTP_303_SEE_OTHER)


@admin_router.get("/jobs", response_class=HTMLResponse)
def list_jobs(
    request: Request,
    status: Optional[str] = None,
    admin_user: User = Depends(require_admin_session),
    db: Session = Depends(get_db),
):
    """Inspect all jobs across all employers."""
    jobs = JobRepository.list_all_for_admin(db, status=status, limit=100)
    csrf_token = request.cookies.get(CSRF_COOKIE_NAME, "")
    return templates.TemplateResponse(
        request=request,
        name="jobs.html",
        context={
            "admin_user": admin_user,
            "active_tab": "jobs",
            "jobs": jobs,
            "status": status,
            "csrf_token": csrf_token,
        },
    )


@admin_router.post("/jobs/{job_id}/disable")
def disable_job(
    job_id: int,
    request: Request,
    csrf_token: str = Form(...),
    admin_user: User = Depends(require_admin_session),
    db: Session = Depends(get_db),
):
    """Administratively force-closes / disables an inappropriate job posting."""
    if not verify_csrf_token(request, csrf_token):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="CSRF verification failed.")

    job = JobRepository.get_by_id(db, job_id, include_deleted=True)
    if not job:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Job not found.")

    job.status = "closed"
    job.deleted_at = datetime.now(timezone.utc)
    JobRepository.update(db, job)

    AuditService.log_event(
        db=db,
        action="JOB_DISABLE",
        actor_role="admin",
        actor_id=admin_user.id,
        ip_address=request.client.host if request.client else None,
        target_type="job",
        target_id=job.id,
        details={"title": job.title, "employer_id": job.employer_id},
    )

    return RedirectResponse(url="/admin/jobs", status_code=status.HTTP_303_SEE_OTHER)


@admin_router.post("/jobs/{job_id}/restore")
def restore_job(
    job_id: int,
    request: Request,
    csrf_token: str = Form(...),
    admin_user: User = Depends(require_admin_session),
    db: Session = Depends(get_db),
):
    """Reopens / restores an administratively disabled job posting."""
    if not verify_csrf_token(request, csrf_token):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="CSRF verification failed.")

    job = JobRepository.get_by_id(db, job_id, include_deleted=True)
    if not job:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Job not found.")

    job.status = "active"
    job.deleted_at = None
    JobRepository.update(db, job)

    AuditService.log_event(
        db=db,
        action="JOB_RESTORE",
        actor_role="admin",
        actor_id=admin_user.id,
        ip_address=request.client.host if request.client else None,
        target_type="job",
        target_id=job.id,
        details={"title": job.title},
    )

    return RedirectResponse(url="/admin/jobs", status_code=status.HTTP_303_SEE_OTHER)


@admin_router.get("/error-reports", response_class=HTMLResponse)
def list_error_reports(
    request: Request,
    admin_user: User = Depends(require_admin_session),
    db: Session = Depends(get_db),
):
    """Inspects sanitized 500 error reports and stack traces."""
    reports = ErrorReportRepository.list_reports(db, limit=100)
    csrf_token = request.cookies.get(CSRF_COOKIE_NAME, "")
    return templates.TemplateResponse(
        request=request,
        name="error_reports.html",
        context={
            "admin_user": admin_user,
            "active_tab": "errors",
            "reports": reports,
            "csrf_token": csrf_token,
        },
    )


@admin_router.get("/audit-logs", response_class=HTMLResponse)
def list_audit_logs(
    request: Request,
    admin_user: User = Depends(require_admin_session),
    db: Session = Depends(get_db),
):
    """Inspects append-only audit trail."""
    logs = AuditLogRepository.list_logs(db, limit=100)
    csrf_token = request.cookies.get(CSRF_COOKIE_NAME, "")
    return templates.TemplateResponse(
        request=request,
        name="audit_logs.html",
        context={
            "admin_user": admin_user,
            "active_tab": "audit",
            "logs": logs,
            "csrf_token": csrf_token,
        },
    )
