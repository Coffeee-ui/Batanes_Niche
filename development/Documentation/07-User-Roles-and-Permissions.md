# 07 - User Roles and Permissions

## 1. Role Taxonomy & Invariants

The **Batanes Niche Job Portal** enforces a strict Role-Based Access Control (RBAC) model augmented by **Row-Level Ownership Validation**.

```
                +-----------------------------------------+
                |                  GUEST                  |
                |          (Unauthenticated Public)       |
                +-----------------------------------------+
                                     |
                         Registration Decision
                                     |
                 +-------------------+-------------------+
                 |                                       |
                 v                                       v
    +-------------------------+             +-------------------------+
    |       JOB SEEKER        |             |        EMPLOYER         |
    |  (Authenticated Worker) |             |   (Enterprise / Owner)  |
    +-------------------------+             +-------------------------+
                                                          
                        Out-of-Band CLI Creation
                                     |
                                     v
                        +-------------------------+
                        |      ADMINISTRATOR      |
                        |    (Platform Operator)  |
                        +-------------------------+
```

### Role Invariants
1. **Public Registration Restriction**: Public registration accepts only `job_seeker` or `employer`. The `admin` role **cannot** be registered via the public API.
2. **Immutable Role Assignment**: Users cannot mutate their own role via the profile update API. Roles are set at registration and enforced on every request via JWT claims and database records.
3. **Profile Entity Coupling**:
   - Every `job_seeker` user is guaranteed to have a corresponding row in `job_seeker_profiles`.
   - Every `employer` user is guaranteed to have a corresponding row in `employer_profiles`.
4. **Admin Separation**: Administrators operate exclusively through the backend-owned `/admin` portal (or management CLI). The React SPA contains no administrative views.

---

## 2. Comprehensive Capability Matrix

The following matrix documents authorization rules across all system capabilities.

| System Capability | Guest | Job Seeker | Employer | Administrator | Enforcement Mechanism |
|---|:---:|:---:|:---:|:---:|---|
| **Browse Active Jobs** | Yes | Yes | Yes | Yes | `GET /api/v1/jobs` (Public filter `status='active' AND deleted_at IS NULL`) |
| **View Job Details** | Yes | Yes | Yes | Yes | `GET /api/v1/jobs/{id}` |
| **Register Account** | Yes | No | No | No | `POST /api/v1/auth/register` (`job_seeker` or `employer` only) |
| **Login / Token Refresh** | Yes | Yes | Yes | Yes | `/api/v1/auth/login`, `/api/v1/auth/refresh` |
| **Reset Password (OTP)** | Yes | Yes | Yes | Yes | `/api/v1/auth/forgot-password`, `/api/v1/auth/reset-password` |
| **View Own Profile** | No | Yes | Yes | Yes | `GET /api/v1/auth/me`, `GET /api/v1/users/profile` |
| **Update Own Profile** | No | Yes | Yes | Yes | `PUT /api/v1/users/profile` (Validates canonical location) |
| **View Profile Completeness** | No | Yes | Yes | Yes | Computed on read (0–100 score) |
| **Post New Job Vacancy** | No | No | **Yes** | No | `POST /api/v1/jobs` (Requires `role == 'employer'`) |
| **Update Owned Job** | No | No | **Yes** | Yes (via Admin) | `PUT /api/v1/jobs/{id}` (Ownership check: `job.employer_id == user.id`) |
| **Soft-Delete Owned Job** | No | No | **Yes** | Yes (via Admin) | `DELETE /api/v1/jobs/{id}` (Ownership check: `job.employer_id == user.id`) |
| **Submit Job Application** | No | **Yes** | No | No | `POST /api/v1/applications` (Requires `role == 'job_seeker'`) |
| **View Submitted Applications** | No | **Yes** | No | No | `GET /api/v1/applications` (Filtered by `seeker_id == user.id`) |
| **View Received Applications** | No | No | **Yes** | No | `GET /api/v1/applications` (Filtered by `job.employer_id == user.id`) |
| **Update Application Status** | No | No | **Yes** | No | `PATCH /api/v1/applications/{id}/status` (Employer ownership enforced) |
| **Save / Bookmark Jobs** | No | **Yes** | No | No | `POST /api/v1/saved-jobs` (Requires `role == 'job_seeker'`) |
| **View Saved Jobs** | No | **Yes** | No | No | `GET /api/v1/saved-jobs` (Filtered by `user_id == user.id`) |
| **View In-App Notifications** | No | Yes | Yes | Yes | `GET /api/v1/notifications` (Filtered by `user_id == user.id`) |
| **Mark Notifications Read** | No | Yes | Yes | Yes | `POST /api/v1/notifications/read` |
| **Browse Candidate Directory** | No | No | **Yes** | **Yes** | `GET /api/v1/users/job-seekers` (Sanitized summaries without email/phone) |
| **View Applicant Contact Info** | No | No | **Conditional** | **Yes** | Contact revealed **only** if seeker applied to employer's job |
| **View Ranked Recommendations** | No | **Yes** (Jobs) | **Yes** (Candidates) | No | `/api/v1/recommendations/*` (Role-tailored algorithms) |
| **Access Admin Dashboard** | No | No | No | **Yes** | `/admin` (Guarded by `batanes_admin_session` cookie + role check) |
| **Suspend / Restore Users** | No | No | No | **Yes** | `POST /admin/users/{id}/suspend`, `/restore` |
| **Disable / Restore Jobs** | No | No | No | **Yes** | `POST /admin/jobs/{id}/disable`, `/restore` |
| **View 500 Error Reports** | No | No | No | **Yes** | `GET /admin/errors` |
| **View Audit Trail Logs** | No | No | No | **Yes** | `GET /admin/audit` |

---

## 3. Row-Level Ownership & Authorization Rules

In addition to role gates, services enforce strict row-level ownership checks:

### 3.1 Job Modification & Deletion
```python
# Enforced in JobService.update_job and JobService.delete_job
if job.employer_id != user.id and user.role != "admin":
    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="You do not have permission to modify this job posting."
    )
```

### 3.2 Application Submission Boundaries
- Job seekers **cannot apply to their own job postings** (in the event an employer registers a seeker account).
- Job seekers **cannot submit duplicate active applications** to the same job posting (`uq_applications_job_seeker`).
- Applications can only be submitted to jobs with `status == 'active'` and `deleted_at IS NULL`.

### 3.3 Application Status Updates
```python
# Enforced in ApplicationService.update_application_status
if application.job.employer_id != employer.id and employer.role != "admin":
    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="You do not have permission to manage applications for this job."
    )
```

### 3.4 Applicant Contact Information Revelation Rule
- In the public candidate directory (`/api/v1/users/job-seekers`), candidate contact details (`email`, `phone_number`) are **strictly stripped**.
- When an employer accesses `/api/v1/applications`, contact details are materialized **only for candidates who submitted an application to that employer's job**:
```python
# Enforced in ApplicationService._to_employer_application_out
applicant_profile = EmployerApplicantProfile(
    seeker_id=seeker.id,
    full_name=seeker.full_name,
    email=seeker.email,           # Authorized access
    phone_number=seeker.phone_number,  # Authorized access
    municipality=seeker.municipality,
    island=island,
    barangay=seeker.barangay,
    skills=seeker.skills,
    ...
)
```

---

## 4. Administrative Privilege Boundary

The `admin` role possesses elevated supervisory powers but is isolated through separate architectural layers:

1. **No Public API Admin Registration**: Admin accounts can only be provisioned via the secure server CLI:
   ```bash
   python -m app.cli create-admin --username admin --email admin@batanesniche.ph --password <password>
   ```
2. **Session Cookie Isolation**: Admin routes (`/admin/*`) require a signed HTTP cookie (`batanes_admin_session`) managed by `app.admin.auth.verify_admin_session`. Bearer JWT tokens from the React frontend are **not** accepted for admin UI routes.
3. **Double-Submit CSRF Defense**: All state-modifying admin POST requests (suspend, restore, disable) require matching CSRF cookies and form fields.
4. **Append-Only Auditing**: Every administrative moderation action generates an immutable audit record in `audit_logs` specifying `actor_id`, `action`, `target_type`, `target_id`, and redacted JSON details.

---

## 5. Next Steps

- To trace the exact sequence of business operations across these roles, see [**08-Business-Workflows.md**](./08-Business-Workflows.md).
- To inspect the deterministic matching rules for seekers and employers, see [**09-Recommendation-Engine.md**](./09-Recommendation-Engine.md).
- For complete operational coverage of the administrative portal, see [**11-Administrative-UI.md**](./11-Administrative-UI.md).
