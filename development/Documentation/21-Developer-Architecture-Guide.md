# 21 - Developer Architecture & Feature Modification Guide

## 1. System Overview

The **Batanes Niche Job Portal (Version 2)** is an engineered, hyper-localized employment marketplace connecting job seekers and employers across the three inhabited islands of Batanes: **Batan Island**, **Sabtang Island**, and **Itbayat Island**.

### System Components & Communication Flow

```
+-----------------------------------------------------------------------------------+
|                                 CLIENT INTERFACES                                 |
+-----------------------------------------------------------------------------------+
|  React 18 Single Page Application (Vite + Tailwind) | FastAPI Jinja2 Admin Portal |
|  - Public catalog, Seeker & Employer dashboards     | - Server-rendered under     |
|  - In-memory JWT + localStorage refresh token       |   /admin                    |
|  - Real-time client-side routing (React Router 6)   | - Signed session cookie     |
+-----------------------------------------------------+-----------------------------+
                           |                                         |
               REST API (JSON over HTTP)                       HTTP Form Posts
             Authorization: Bearer <token>                     CSRF Token Validation
                           \                                         /
                            v                                       v
+-----------------------------------------------------------------------------------+
|                            FASTAPI BACKEND GATEWAY                                |
+-----------------------------------------------------------------------------------+
|  Middleware Pipeline:                                                             |
|  - CORS (Allowed origins: localhost:5173, 127.0.0.1:5173)                         |
|  - Security Headers (X-Content-Type-Options: nosniff, X-Frame-Options: DENY)      |
|  - Structured Logging Middleware (Latency, Method, Client IP)                     |
|  - Rate Limiting via SlowAPI (Token bucket algorithm)                             |
|  - Global 500 Unhandled Exception Handler (Payload scrubbing -> error_reports)    |
+-----------------------------------------------------------------------------------+
                                          |
                                          v
+-----------------------------------------------------------------------------------+
|                         APPLICATION DOMAIN LAYERS                                 |
+-----------------------------------------------------------------------------------+
|  1. Presentation Layer (`app/api/v1/`): Request routing, schema serialization     |
|  2. Dependency Injection (`app/api/deps.py`): Auth tokens, JTI blacklist, roles   |
|  3. Domain Services (`app/services/`): Business logic, geographic scoring, rules  |
|  4. Data Access Layer (`app/repositories/`): Query abstraction & SQLAlchemy units |
|  5. Database Entities (`app/models/`): Declarative models & relational constraints|
+-----------------------------------------------------------------------------------+
                                          |
                                          v
+-----------------------------------------------------------------------------------+
|                           PERSISTENCE & STORAGE                                   |
+-----------------------------------------------------------------------------------+
|  Relational Database: SQLite local (`batanes_niche.db`) / PostgreSQL production   |
|  Schema Management: Alembic Migrations (`backend/alembic/versions/`)              |
|  12 Relational Tables with Foreign Key Cascades and Check Constraints             |
+-----------------------------------------------------------------------------------+
```

---

## 2. Project Directory Map

The directory structure below represents the **verified filesystem** of the current repository:

```text
Batanes_Niche/
├── backend/
│   ├── alembic/                          # Alembic database migration environment
│   │   ├── versions/                     # Versioned migration scripts
│   │   ├── env.py                        # Migration runner engine
│   │   └── script.py.mako                # Revision template
│   ├── app/                              # Core backend application package
│   │   ├── admin/                        # Server-rendered administrative portal
│   │   │   ├── static/                   # CSS and client assets for Admin UI
│   │   │   ├── templates/                # Jinja2 HTML templates (dashboard, users, jobs)
│   │   │   ├── auth.py                   # Admin session cookie signing and CSRF tokens
│   │   │   └── routes.py                 # Admin route handlers (/admin/*)
│   │   ├── api/                          # REST API layer
│   │   │   ├── deps.py                   # Auth dependencies, DB sessions, rate limiter
│   │   │   └── v1/                       # API Version 1 route endpoints
│   │   │       ├── applications.py       # Job application submission & status transitions
│   │   │       ├── auth.py               # Registration, login, token refresh, OTP reset
│   │   │       ├── jobs.py               # Job catalog, posting, updating, closing
│   │   │       ├── meta.py               # Metadata options, canonical skills & geography
│   │   │       ├── notifications.py      # In-app notifications feed & mark-as-read
│   │   │       ├── recommendations.py    # Deterministic two-tier job/candidate ranking
│   │   │       ├── saved_jobs.py         # Bookmarking vacancies
│   │   │       └── users.py              # Profile management & candidate search
│   │   ├── core/                         # Configuration and security foundations
│   │   │   ├── config.py                 # Pydantic BaseSettings (.env loader)
│   │   │   ├── geography.py              # Canonical Batanes islands, municipalities, barangays
│   │   │   └── security.py               # bcrypt password hashing, JWT creation/decoding, OTP
│   │   ├── database/                     # Database engine and sessions
│   │   │   ├── base.py                   # SQLAlchemy Base metadata importing all models
│   │   │   └── session.py                # Engine initialization, get_db session generator
│   │   ├── middleware/                   # HTTP middleware
│   │   │   ├── error_handler.py          # 500 error interception & sanitized error_reports logging
│   │   │   └── logging_middleware.py     # Request/response structured JSON logging
│   │   ├── models/                       # SQLAlchemy 2.0 ORM Declarative Models
│   │   │   ├── application.py            # Application entity (status check constraints)
│   │   │   ├── audit_log.py              # AuditLog entity (append-only administrative log)
│   │   │   ├── error_report.py           # ErrorReport entity (500 exception stack traces)
│   │   │   ├── job.py                    # Job vacancy entity
│   │   │   ├── notification.py           # In-app Notification entity
│   │   │   ├── password_reset_token.py   # PasswordResetToken entity (6-digit OTPs)
│   │   │   ├── saved_job.py              # SavedJob entity (unique user+job bookmark)
│   │   │   ├── token.py                  # RefreshToken and RevokedToken entities
│   │   │   └── user.py                   # User, EmployerProfile, JobSeekerProfile entities
│   │   ├── repositories/                 # Data access repositories (SQLAlchemy queries)
│   │   │   ├── application_repository.py # Application query methods & duplicate checks
│   │   │   ├── audit_log_repository.py   # Audit log insertion & retrieval
│   │   │   ├── error_report_repository.py# Error report queries
│   │   │   ├── job_repository.py         # Job queries, multi-facet filtering, soft-deletes
│   │   │   ├── notification_repository.py# Notification queries & read status
│   │   │   ├── password_reset_repository.py # OTP token lookup & attempt counting
│   │   │   ├── saved_job_repository.py   # Saved job persistence & lookup
│   │   │   ├── token_repository.py       # Refresh token rotation & JTI blacklist checks
│   │   │   └── user_repository.py        # User lookups, creation, and candidate search
│   │   ├── schemas/                      # Pydantic v2 schemas (validation & serialization)
│   │   │   ├── application.py            # ApplicationCreate, ApplicationUpdate, Out schemas
│   │   │   ├── auth.py                   # UserRegister, UserLogin, Token, OTP schemas
│   │   │   ├── common.py                 # MessageOut schema
│   │   │   ├── job.py                    # JobCreate, JobUpdate, JobOut, SavedJobOut schemas
│   │   │   ├── meta.py                   # MetadataOptionsOut schema
│   │   │   ├── notification.py           # NotificationOut schema
│   │   │   ├── recommendation.py         # CandidateRankingResponse, JobRankingResponse
│   │   │   └── user.py                   # PrivateUserProfile, PublicJobSeekerSummary
│   │   ├── services/                     # Business logic and domain service rules
│   │   │   ├── application_service.py    # Application transactions, contact reveal, status
│   │   │   ├── audit_service.py          # Security event logging with secret scrubbing
│   │   │   ├── auth_service.py           # Registration, authentication, token rotation, OTP
│   │   │   ├── email_delivery_service.py # SMTP OTP email delivery (console fallback)
│   │   │   ├── error_logging_service.py  # 500 unhandled error logging
│   │   │   ├── geography_service.py      # Canonical location validation & distance scoring
│   │   │   ├── job_service.py            # Job lifecycle, formatting, saved jobs
│   │   │   ├── notification_service.py   # In-app notification creation & mark-as-read
│   │   │   ├── recommendation_service.py # Deterministic two-tier matching engine
│   │   │   ├── skill_service.py          # Skill catalog normalization & exact matching
│   │   │   └── user_service.py           # Profile completeness calculation (0-100 pts)
│   │   ├── cli.py                        # Management CLI (seed-data, create-admin)
│   │   └── main.py                       # FastAPI entry point, CORS, /health, /ready
│   ├── tests/                            # Pytest test suite
│   ├── alembic.ini                       # Alembic configuration
│   ├── batanes_niche.db                  # Local SQLite database file
│   └── requirements.txt                  # Python production dependencies
│
├── frontend/
│   ├── src/
│   │   ├── api/
│   │   │   └── client.ts                 # Axios instance, silent token refresh interceptors
│   │   ├── components/
│   │   │   ├── auth/
│   │   │   │   └── ProtectedRoute.tsx    # Role-based route guard wrapper
│   │   │   ├── forms/
│   │   │   │   └── SkillSelector.tsx     # Canonical skill picker with custom 'Other' input
│   │   │   ├── layout/
│   │   │   │   ├── Footer.tsx            # Application footer with navigation & Batanes context
│   │   │   │   ├── Layout.tsx            # Shell component wrapping Navbar, Outlet, and Footer
│   │   │   │   └── Navbar.tsx            # Responsive navbar with role-aware menu & notifications
│   │   │   └── ui/
│   │   │       ├── index.tsx             # Shared UI primitives (Spinner, Badge, Modal, Dialog)
│   │   │       ├── JobCard.tsx           # Interactive vacancy card with bookmark toggle
│   │   │       └── Toast.tsx             # Reactive toast alert notification system
│   │   ├── contexts/
│   │   │   └── AuthContext.tsx           # Global authentication state, login, logout, refresh
│   │   ├── pages/
│   │   │   ├── auth/
│   │   │   │   ├── ForgotPasswordPage.tsx# Multi-step 6-digit OTP password reset view
│   │   │   │   ├── LoginPage.tsx         # User authentication form
│   │   │   │   └── RegisterPage.tsx      # Dual-role account registration form
│   │   │   ├── jobs/
│   │   │   │   ├── JobDetailPage.tsx     # Job detail page, requirements & application modal
│   │   │   │   ├── JobsPage.tsx          # Public job catalog with multi-facet filters
│   │   │   │   ├── MyJobsPage.tsx        # Employer job management view (active & closed)
│   │   │   │   └── PostJobPage.tsx       # Employer vacancy creation form
│   │   │   ├── ApplicationsPage.tsx      # Job seeker submitted applications & status tracking
│   │   │   ├── CandidatesPage.tsx        # Employer candidate search & recommendations view
│   │   │   ├── DashboardPage.tsx         # Unified dashboard (renders Seeker or Employer view)
│   │   │   ├── LandingPage.tsx           # Public homepage with search hero & island highlights
│   │   │   ├── NotificationsPage.tsx     # Full-page notifications inbox with mark-all-read
│   │   │   ├── ProfilePage.tsx           # User profile editor & completeness score breakdown
│   │   │   └── SavedJobsPage.tsx         # Job seeker bookmarked vacancies catalog
│   │   ├── types/
│   │   │   └── index.ts                  # Shared TypeScript interfaces (User, Job, App, etc.)
│   │   ├── App.tsx                       # Root routing table, lazy loading, and route guards
│   │   ├── index.css                     # HSL design tokens, custom utility classes, theme variables
│   │   └── main.tsx                      # React DOM root mounting
│   ├── index.html                        # HTML entry point (fonts, metadata, root div)
│   ├── package.json                      # Dependencies and npm scripts
│   ├── tailwind.config.js                # Tailwind CSS token mapping
│   ├── tsconfig.json                     # TypeScript compiler configuration
│   └── vite.config.ts                    # Vite build configuration & /api proxy
│
└── development/
    ├── Documentation/                    # Technical documentation package (21 Markdown files)
    ├── scripts/                          # Windows batch operational scripts (setup, start, test)
    └── CHANGELOG.md                      # Changelog recording all codebase evolutions
```

---

## 3. "Where Do I Modify This?" Master Matrix

Use this lookup matrix to identify the exact files across all layers when extending or modifying a feature:

| Feature Domain | Frontend Page / Component | Frontend API Client | Backend Route | Backend Service | Repository & Model | Database Table |
|---|---|---|---|---|---|---|
| **User Login** | `frontend/src/pages/auth/LoginPage.tsx` | `authApi.login` in `frontend/src/api/client.ts` | `POST /api/v1/auth/login` in `backend/app/api/v1/auth.py` | `AuthService.authenticate_user` in `backend/app/services/auth_service.py` | `UserRepository` in `user_repository.py` / `User` in `user.py` | `users`, `refresh_tokens` |
| **User Registration** | `frontend/src/pages/auth/RegisterPage.tsx` | `authApi.register` in `frontend/src/api/client.ts` | `POST /api/v1/auth/register` in `backend/app/api/v1/auth.py` | `AuthService.register_user` in `backend/app/services/auth_service.py` | `UserRepository` in `user_repository.py` / `User`, `EmployerProfile`, `JobSeekerProfile` | `users`, `employer_profiles`, `job_seeker_profiles`, `refresh_tokens` |
| **Password Reset (OTP)** | `frontend/src/pages/auth/ForgotPasswordPage.tsx` | `authApi.requestPasswordReset`, `confirmPasswordReset` in `client.ts` | `POST /api/v1/auth/forgot-password`, `reset-password` in `auth.py` | `AuthService.request_password_reset`, `reset_password` in `auth_service.py` | `PasswordResetRepository` in `password_reset_repository.py` / `PasswordResetToken` in `password_reset_token.py` | `password_reset_tokens`, `users`, `refresh_tokens` |
| **Profile Management** | `frontend/src/pages/ProfilePage.tsx` | `usersApi.getProfile`, `updateProfile` in `client.ts` | `GET`, `PUT /api/v1/users/profile` in `backend/app/api/v1/users.py` | `UserService.get_private_profile`, `update_profile` in `user_service.py` | `UserRepository` in `user_repository.py` / `User` in `user.py` | `users`, `job_seeker_profiles`, `employer_profiles` |
| **Job Browsing & Search** | `frontend/src/pages/jobs/JobsPage.tsx`, `frontend/src/components/ui/JobCard.tsx` | `jobsApi.list` in `frontend/src/api/client.ts` | `GET /api/v1/jobs` in `backend/app/api/v1/jobs.py` | `JobService.list_active_jobs` in `backend/app/services/job_service.py` | `JobRepository` in `job_repository.py` / `Job` in `job.py` | `jobs` |
| **Job Details & Apply** | `frontend/src/pages/jobs/JobDetailPage.tsx` | `jobsApi.get`, `applicationsApi.apply` in `client.ts` | `GET /api/v1/jobs/{job_id}`, `POST /api/v1/applications` | `JobService.get_job_by_id`, `ApplicationService.submit_application` | `JobRepository`, `ApplicationRepository` / `Job`, `Application`, `Notification` | `jobs`, `applications`, `notifications` |
| **Employer Job Posting** | `frontend/src/pages/jobs/PostJobPage.tsx`, `frontend/src/components/forms/SkillSelector.tsx` | `jobsApi.create` in `frontend/src/api/client.ts` | `POST /api/v1/jobs` in `backend/app/api/v1/jobs.py` | `JobService.create_job` in `backend/app/services/job_service.py` | `JobRepository` in `job_repository.py` / `Job` in `job.py` | `jobs` |
| **Employer Job Management** | `frontend/src/pages/jobs/MyJobsPage.tsx` | `jobsApi.myJobs`, `jobsApi.close` in `client.ts` | `GET /api/v1/jobs/my`, `DELETE /api/v1/jobs/{job_id}` in `jobs.py` | `JobService.list_employer_jobs`, `soft_delete_job` in `job_service.py` | `JobRepository` in `job_repository.py` / `Job` in `job.py` | `jobs` |
| **Seeker Applications Tracking** | `frontend/src/pages/ApplicationsPage.tsx` | `applicationsApi.myApplications` in `client.ts` | `GET /api/v1/applications` in `backend/app/api/v1/applications.py` | `ApplicationService.list_applications` in `application_service.py` | `ApplicationRepository` in `application_repository.py` / `Application` in `application.py` | `applications`, `jobs` |
| **Applicant Review & Status** | `frontend/src/pages/DashboardPage.tsx` (Employer Dashboard) | `applicationsApi.updateStatus` in `client.ts` | `PUT /api/v1/applications/{app_id}` in `applications.py` | `ApplicationService.update_application_status` in `application_service.py` | `ApplicationRepository` in `application_repository.py` / `Application`, `Notification` | `applications`, `notifications` |
| **Saved Jobs (Bookmarks)** | `frontend/src/pages/SavedJobsPage.tsx`, `JobCard.tsx` | `savedJobsApi.list`, `save`, `remove` in `client.ts` | `GET`, `POST`, `DELETE /api/v1/saved-jobs/{job_id}` in `saved_jobs.py` | `JobService.list_saved_jobs`, `save_job`, `remove_saved_job` in `job_service.py` | `SavedJobRepository` in `saved_job_repository.py` / `SavedJob` in `saved_job.py` | `saved_jobs` |
| **In-App Notifications** | `frontend/src/pages/NotificationsPage.tsx`, `Navbar.tsx` | `notificationsApi.list`, `markAllRead` in `client.ts` | `GET`, `PUT /api/v1/notifications/read` in `notifications.py` | `NotificationService.get_user_notifications`, `mark_all_read` in `notification_service.py` | `NotificationRepository` in `notification_repository.py` / `Notification` | `notifications` |
| **Candidate Directory & Recs**| `frontend/src/pages/CandidatesPage.tsx` | `usersApi.candidates`, `recommendations` in `client.ts` | `GET /api/v1/users/job-seekers`, `/recommendations/candidates` | `UserService.search_job_seekers`, `RecommendationService.rank_candidates` | `UserRepository` in `user_repository.py` / `User`, `JobSeekerProfile` | `users`, `job_seeker_profiles` |
| **Job Seeker Recommendations**| `frontend/src/pages/DashboardPage.tsx` (Seeker view) | `jobsApi.recommendations` in `client.ts` | `GET /api/v1/recommendations/jobs-ranked` in `recommendations.py` | `RecommendationService.rank_jobs_for_seeker` in `recommendation_service.py` | `JobRepository` in `job_repository.py` / `Job`, `User` | `jobs`, `users` |
| **Admin Portal & Moderation**| `backend/app/admin/templates/*.html` | Browser Form Post (`/admin/*`) with CSRF | `/admin/login`, `/admin/users/*`, `/admin/jobs/*` in `admin/routes.py` | `AuditService.log_event` in `backend/app/services/audit_service.py` | `UserRepository`, `JobRepository`, `AuditLogRepository`, `TokenRepository` | `users`, `jobs`, `refresh_tokens`, `audit_logs` |

---

## 4. Specific Example: "Where Do I Find the Inbox?"

> [!IMPORTANT]
> **No Inbox/Messaging feature was found in the current implementation.**
> 
> No modification location is provided because the feature does not currently exist.

### How Communication Operates in Version 2
Rather than a chat or inbox interface, communication between job seekers and employers is designed as an asynchronous, state-driven workflow:
1. **Application Status State Machine**: Employers change candidate status between `pending`, `accepted`, and `rejected`.
2. **Persistent In-App Notifications**: Every status change atomically queues a persistent notification delivered to the applicant's notification feed (`/notifications`) and highlighted on the Navbar bell indicator.
3. **Authorized Contact Revelation**: To protect privacy, a job seeker's phone number and email are concealed until they formally submit an application to the employer's active job listing. Once submitted, the employer can inspect the applicant's verified phone number and email on the candidate profile to initiate direct contact (telephone call or standard email).

---

## 5. Feature Traceability Walks

### 5.1 Job Search Execution Trace
```text
1. User types keyword "carpenter" and selects municipality "Basco"
   ↓
2. UI Component: `frontend/src/pages/jobs/JobsPage.tsx`
   - State variables: `keyword`, `municipality`, `employmentType`
   - Event Handler: `handleSearch()`
   ↓
3. Frontend API Client: `jobsApi.list()` in `frontend/src/api/client.ts`
   - Builds query parameters: `?keyword=carpenter&municipality=Basco&limit=50&offset=0`
   - Axios sends GET request to `/api/v1/jobs`
   ↓
4. Backend API Route: `list_jobs()` in `backend/app/api/v1/jobs.py`
   - Injects `db: Session = Depends(get_db)`
   ↓
5. Domain Service: `JobService.list_active_jobs()` in `backend/app/services/job_service.py`
   - Enforces query invariants: `status == 'active'` and `deleted_at IS NULL`
   ↓
6. Repository: `JobRepository.list_active_jobs()` in `backend/app/repositories/job_repository.py`
   - Builds SQLAlchemy query: `select(Job).where(Job.status == "active", Job.deleted_at.is_(None))`
   - Applies SQL `ilike` filters for keyword, municipality, and employment type
   ↓
7. Database: Executes SQL query on `batanes_niche.db`
   ↓
8. Serialization: `JobService._to_job_out()` transforms `Job` model into Pydantic `JobOut` schemas, resolving island names via `GeographyService.resolve_island()`
   ↓
9. Response: FastAPI serializes `List[JobOut]` as JSON HTTP 200 OK
   ↓
10. Reactive UI Update: `JobsPage.tsx` updates `jobs` state array, rendering interactive `JobCard` components
```

---

### 5.2 Job Application Submission Execution Trace
```text
1. Job Seeker clicks "Apply Now" on `frontend/src/pages/jobs/JobDetailPage.tsx`
   ↓
2. Modal Component: Displays cover letter input modal
   - Event Handler: `handleApply()` calls `applicationsApi.apply(jobId, coverLetter)`
   ↓
3. Axios Client: Injects `Authorization: Bearer <access_token>` header via request interceptor
   - Sends POST to `/api/v1/applications` with body `{"job_id": 4, "cover_letter": "..."}`
   ↓
4. Backend Route: `submit_application()` in `backend/app/api/v1/applications.py`
   - Dependency guard: `current_user: User = Depends(require_job_seeker_context)` verifies JWT claims and checks `user.role == 'job_seeker'`
   ↓
5. Domain Service: `ApplicationService.submit_application()` in `backend/app/services/application_service.py`
   - Verification Checks:
     a. Job exists and `job.status == 'active'`
     b. `job.employer_id != seeker.id` (cannot apply to own job)
     c. `ApplicationRepository.has_active_application()` ensures non-duplicate
   ↓
6. Atomic Transaction Boundary:
   - `ApplicationRepository.create(db, Application(job_id=4, seeker_id=seeker.id, status='pending'))`
   - `NotificationRepository.create(db, Notification(user_id=employer.id, type='new_application'))`
   - Executes `db.commit()` (or `db.rollback()` on any failure)
   ↓
7. Response: Returns Pydantic `SeekerApplicationOut` with HTTP 201 Created
   ↓
8. UI Update: `JobDetailPage.tsx` marks `applied = true`, closes modal, and triggers `toastSuccess("Application submitted successfully!")`
```

---

### 5.3 Employer Status Transition Execution Trace
```text
1. Employer selects "Accepted" for an applicant on `frontend/src/pages/DashboardPage.tsx`
   ↓
2. Event Handler: Calls `applicationsApi.updateStatus(applicationId, 'accepted')` in `client.ts`
   - Axios sends PUT to `/api/v1/applications/{app_id}` with body `{"status": "accepted"}`
   ↓
3. Backend Route: `update_application_status()` in `backend/app/api/v1/applications.py`
   - Dependency guard: `current_user = Depends(require_authenticated)`
   ↓
4. Domain Service: `ApplicationService.update_application_status()` in `backend/app/services/application_service.py`
   - Ownership verification: Ensures `application.job.employer_id == current_user.id`
   - Transition validation: Verifies status transition is allowed (`pending` -> `accepted`)
   ↓
5. Atomic Transaction Boundary:
   - Updates `application.status = 'accepted'`
   - Inserts `Notification` for applicant: `title="Application Status Updated"`, `type="application_status_updated"`
   - Executes `db.commit()`
   ↓
6. Response: Returns `EmployerApplicationOut` including applicant's revealed phone number and email
   ↓
7. Reactive UI Update: Employer UI reflects updated badge; applicant's notification counter increments
```

---

## 6. Frontend Modification Map

### Component Hierarchy & Styling System
- **Layout Shell**: `frontend/src/components/layout/Layout.tsx` wraps `Navbar.tsx` and `Footer.tsx`.
- **Route Definitions**: `frontend/src/App.tsx` contains all declarative React Router routes.
- **Route Guards**: `frontend/src/components/auth/ProtectedRoute.tsx` verifies authentication and enforces role constraints (`role="job_seeker"` or `role="employer"`). If an unauthorized role attempts access, they are redirected to `/dashboard`.
- **Authentication State**: `frontend/src/contexts/AuthContext.tsx` provides `user`, `login`, `logout`, `register`, `isAuthenticated`, and `isLoading` throughout the component tree.
- **UI Primitives**: `frontend/src/components/ui/index.tsx` exports `Spinner`, `PageSpinner`, `Badge`, `Skeleton`, `EmptyState`, and `ConfirmDialog`.
- **Form Selectors**: `frontend/src/components/forms/SkillSelector.tsx` provides multi-select chip selection of canonical skills with a custom input for `Other` skills.
- **Styling & Design Tokens**: `frontend/src/index.css` defines all semantic HSL CSS custom variables (`--color-primary`, `--color-secondary`, `--color-bg`, `--color-surface`, `--color-text`, `--color-border`). `tailwind.config.js` maps these tokens to utility classes.

---

## 7. Backend Modification Map

### Layer Responsibilities
- **API Router Layer (`app/api/v1/`)**: Parses HTTP requests, extracts parameters, coordinates dependencies, and returns Pydantic response models.
- **Dependency Guard Layer (`app/api/deps.py`)**: Validates access tokens via `decode_access_token()`, checks token revocation in `revoked_tokens`, and enforces role guards (`require_job_seeker_context`, `require_employer_context`, `require_admin_context`).
- **Domain Service Layer (`app/services/`)**: Enforces business invariants, validates canonical locations, manages multi-entity database transaction boundaries, and coordinates email notifications.
- **Repository Layer (`app/repositories/`)**: Abstract data access layer performing SQLAlchemy `select()`, `insert()`, `update()`, and `delete()` operations.
- **ORM Model Layer (`app/models/`)**: Declarative SQLAlchemy entity definitions mapped to database tables with column types, foreign keys, and check constraints.

---

## 8. Database Modification Map

### 12 Relational Tables & Relationships

| Table Name | Entity Class | Primary Key | Foreign Keys | Key Constraints & Indexes |
|---|---|---|---|---|
| `users` | `User` in `user.py` | `id` (Integer) | None | UNIQUE: `username`, `email`. CHECK: `role IN ('job_seeker', 'employer', 'admin')`, `account_status IN ('active', 'suspended', 'inactive')`. |
| `employer_profiles` | `EmployerProfile` in `user.py` | `user_id` | `users.id` (CASCADE) | 1-to-1 with `users`. |
| `job_seeker_profiles` | `JobSeekerProfile` in `user.py` | `user_id` | `users.id` (CASCADE) | 1-to-1 with `users`. |
| `jobs` | `Job` in `job.py` | `id` (Integer) | `users.id` (CASCADE) | CHECK: `status IN ('active', 'closed', 'draft')`. INDEX: `(status, municipality)`, `employer_id`. |
| `applications` | `Application` in `application.py` | `id` (Integer) | `jobs.id` (CASCADE), `users.id` (CASCADE) | UNIQUE: `(job_id, seeker_id)`. CHECK: `status IN ('pending', 'accepted', 'rejected')`. |
| `saved_jobs` | `SavedJob` in `saved_job.py` | `id` (Integer) | `users.id` (CASCADE), `jobs.id` (CASCADE) | UNIQUE: `(seeker_id, job_id)`. |
| `notifications` | `Notification` in `notification.py`| `id` (Integer) | `users.id` (CASCADE) | CHECK: `type IN ('new_application', 'application_status_updated')`. INDEX: `user_id`, `is_read`. |
| `refresh_tokens` | `RefreshToken` in `token.py` | `id` (Integer) | `users.id` (CASCADE) | UNIQUE: `token_hash`. |
| `revoked_tokens` | `RevokedToken` in `token.py` | `id` (Integer) | None | UNIQUE: `token_jti`. Blacklisted access tokens. |
| `password_reset_tokens`| `PasswordResetToken` in `password_reset_token.py`| `id` (Integer)| `users.id` (CASCADE)| Index: `identifier`. bcrypt-hashed OTPs with 5-attempt limit. |
| `audit_logs` | `AuditLog` in `audit_log.py` | `id` (Integer) | `users.id` (SET NULL) | Append-only audit record of sensitive administrative and auth actions. |
| `error_reports` | `ErrorReport` in `error_report.py`| `id` (Integer) | None | Unhandled 500 server stack traces with scrubbed request bodies. |

---

## 9. Authentication & Role Flow

```text
Unauthenticated Visitor
   ↓
Navigates to /login or /register
   ↓
Submits Credentials -> POST /api/v1/auth/login or /register
   ↓
Backend AuthService verifies credentials & confirms account_status == 'active'
   ↓
Issues Token Pair:
- 15-Minute Stateless Access Token (stored in memory in client.ts)
- 7-Day Stateful Refresh Token (stored in localStorage under 'batanes_refresh_token')
   ↓
Frontend AuthContext stores user object and sets isAuthenticated = true
   ↓
ProtectedRoute inspects user.role:
   ├── Role == 'job_seeker': Accesses /dashboard (Seeker view), /applications, /saved-jobs
   └── Role == 'employer':   Accesses /dashboard (Employer view), /jobs/post, /jobs/my, /candidates
```

---

## 10. Common Modification Scenarios ("I Want to Change...")

### Scenario 1: I Want to Change the Login Form
1. **Frontend View**: Open [LoginPage.tsx](file:///c:/Users/Jonathea%20Gabotero/Documents/GitHub/Batanes_Niche/frontend/src/pages/auth/LoginPage.tsx). Modify state variables, input elements, or styling.
2. **Frontend Logic**: Check `handleSubmit` which calls `login()` from [AuthContext.tsx](file:///c:/Users/Jonathea%20Gabotero/Documents/GitHub/Batanes_Niche/frontend/src/contexts/AuthContext.tsx).
3. **Backend Route**: Open [auth.py](file:///c:/Users/Jonathea%20Gabotero/Documents/GitHub/Batanes_Niche/backend/app/api/v1/auth.py) at endpoint `POST /login`.
4. **Backend Logic**: Open [auth_service.py](file:///c:/Users/Jonathea%20Gabotero/Documents/GitHub/Batanes_Niche/backend/app/services/auth_service.py) in `AuthService.authenticate_user()`.

---

### Scenario 2: I Want to Change the Job Search UI & Filters
1. **Frontend View**: Open [JobsPage.tsx](file:///c:/Users/Jonathea%20Gabotero/Documents/GitHub/Batanes_Niche/frontend/src/pages/jobs/JobsPage.tsx). Modify search inputs, dropdown filters, or sort controls.
2. **Job Card Presentation**: Open [JobCard.tsx](file:///c:/Users/Jonathea%20Gabotero/Documents/GitHub/Batanes_Niche/frontend/src/components/ui/JobCard.tsx) to modify badge presentation, salary format, or layout.
3. **Frontend API Call**: Open [client.ts](file:///c:/Users/Jonathea%20Gabotero/Documents/GitHub/Batanes_Niche/frontend/src/api/client.ts) in `jobsApi.list()`.
4. **Backend Route**: Open [jobs.py](file:///c:/Users/Jonathea%20Gabotero/Documents/GitHub/Batanes_Niche/backend/app/api/v1/jobs.py) in `list_jobs()`.
5. **Backend Database Query**: Open [job_repository.py](file:///c:/Users/Jonathea%20Gabotero/Documents/GitHub/Batanes_Niche/backend/app/repositories/job_repository.py) in `JobRepository.list_active_jobs()`.

---

### Scenario 3: I Want to Add or Modify Profile Fields
1. **Frontend Profile View**: Open [ProfilePage.tsx](file:///c:/Users/Jonathea%20Gabotero/Documents/GitHub/Batanes_Niche/frontend/src/pages/ProfilePage.tsx). Add input fields to the seeker or employer profile sections.
2. **Frontend Payload**: Ensure new fields are mapped in `usersApi.updateProfile()` inside [client.ts](file:///c:/Users/Jonathea%20Gabotero/Documents/GitHub/Batanes_Niche/frontend/src/api/client.ts).
3. **Pydantic Validation**: Open [user.py](file:///c:/Users/Jonathea%20Gabotero/Documents/GitHub/Batanes_Niche/backend/app/schemas/user.py) and update `UserProfileUpdate` and `PrivateUserProfile`.
4. **Backend Business Logic**: Open [user_service.py](file:///c:/Users/Jonathea%20Gabotero/Documents/GitHub/Batanes_Niche/backend/app/services/user_service.py) in `UserService.update_profile()`.
5. **Completeness Score**: If the field affects profile completeness, update `UserService.calculate_profile_completeness()`.
6. **Database Entity**: Open [user.py](file:///c:/Users/Jonathea%20Gabotero/Documents/GitHub/Batanes_Niche/backend/app/models/user.py) to add the column to `User`, `JobSeekerProfile`, or `EmployerProfile`.
7. **Database Migration**: Run `alembic revision --autogenerate -m "add_field_to_profile"` in `backend/`.

---

### Scenario 4: I Want to Modify Job Application Preconditions
1. **Frontend Button & Modal**: Open [JobDetailPage.tsx](file:///c:/Users/Jonathea%20Gabotero/Documents/GitHub/Batanes_Niche/frontend/src/pages/jobs/JobDetailPage.tsx). Update `handleApply()` or the application modal.
2. **Backend Route**: Open [applications.py](file:///c:/Users/Jonathea%20Gabotero/Documents/GitHub/Batanes_Niche/backend/app/api/v1/applications.py) at `POST /applications`.
3. **Service Rules & Validation**: Open [application_service.py](file:///c:/Users/Jonathea%20Gabotero/Documents/GitHub/Batanes_Niche/backend/app/services/application_service.py) in `ApplicationService.submit_application()`. Add or adjust precondition checks.
4. **Repository Check**: Open [application_repository.py](file:///c:/Users/Jonathea%20Gabotero/Documents/GitHub/Batanes_Niche/backend/app/repositories/application_repository.py) if new query checks are required.

---

### Scenario 5: I Want to Change Notification Messages or Triggers
1. **Backend Notification Dispatch**: Open [application_service.py](file:///c:/Users/Jonathea%20Gabotero/Documents/GitHub/Batanes_Niche/backend/app/services/application_service.py) where `Notification` objects are created during application submission and status updates.
2. **Notification Service**: Open [notification_service.py](file:///c:/Users/Jonathea%20Gabotero/Documents/GitHub/Batanes_Niche/backend/app/services/notification_service.py).
3. **Frontend Presentation**: Open [NotificationsPage.tsx](file:///c:/Users/Jonathea%20Gabotero/Documents/GitHub/Batanes_Niche/frontend/src/pages/NotificationsPage.tsx) and [Navbar.tsx](file:///c:/Users/Jonathea%20Gabotero/Documents/GitHub/Batanes_Niche/frontend/src/components/layout/Navbar.tsx).

---

### Scenario 6: I Want to Adjust the Two-Tier Recommendation Algorithm
1. **Algorithm Implementation**: Open [recommendation_service.py](file:///c:/Users/Jonathea%20Gabotero/Documents/GitHub/Batanes_Niche/backend/app/services/recommendation_service.py).
   - Adjust `calculate_skill_score()` (currently 0–70 points).
   - Adjust `score_distance()` in [geography_service.py](file:///c:/Users/Jonathea%20Gabotero/Documents/GitHub/Batanes_Niche/backend/app/services/geography_service.py) (currently 0–30 points).
   - Adjust tier classification in `rank_candidates()` and `rank_jobs_for_seeker()`.
2. **Frontend Presentation**: Open [DashboardPage.tsx](file:///c:/Users/Jonathea%20Gabotero/Documents/GitHub/Batanes_Niche/frontend/src/pages/DashboardPage.tsx) (Seeker recommended jobs) and [CandidatesPage.tsx](file:///c:/Users/Jonathea%20Gabotero/Documents/GitHub/Batanes_Niche/frontend/src/pages/CandidatesPage.tsx) (Employer candidate recommendations).
3. **Specification Reference**: Consult [09-Recommendation-Engine.md](file:///c:/Users/Jonathea%20Gabotero/Documents/GitHub/Batanes_Niche/development/Documentation/09-Recommendation-Engine.md).

---

### Scenario 7: I Want to Work with or Configure Development Demo Mode
1. **Backend Environment Flag**: Open [backend/.env](file:///c:/Users/Jonathea%20Gabotero/Documents/GitHub/Batanes_Niche/backend/.env) and toggle `DEMO_MODE=True` or `DEMO_MODE=False`. Note that Demo Mode requires `ENVIRONMENT` to be set to a development tier (`development`, `dev`, `local`, `test`).
2. **Backend Config Logic**: Open [config.py](file:///c:/Users/Jonathea%20Gabotero/Documents/GitHub/Batanes_Niche/backend/app/core/config.py) to inspect `is_demo_mode_active` and its production safeguards.
3. **Authentication Handlers**: Open [auth_service.py](file:///c:/Users/Jonathea%20Gabotero/Documents/GitHub/Batanes_Niche/backend/app/services/auth_service.py) in `AuthService.demo_authenticate()` and [auth.py](file:///c:/Users/Jonathea%20Gabotero/Documents/GitHub/Batanes_Niche/backend/app/api/v1/auth.py) for `/demo-status` and `/demo-login`.
4. **Frontend Login UI**: Open [LoginPage.tsx](file:///c:/Users/Jonathea%20Gabotero/Documents/GitHub/Batanes_Niche/frontend/src/pages/auth/LoginPage.tsx) to inspect `#demo-access-section` and button bindings.
5. **Session Management**: Open [AuthContext.tsx](file:///c:/Users/Jonathea%20Gabotero/Documents/GitHub/Batanes_Niche/frontend/src/contexts/AuthContext.tsx) in `demoLogin()` to see how standard tokens are stored.

---

## 11. Next Steps & Documentation Map

- To review visual workflows and system flowcharts, see [**20-System-Flowcharts.md**](./20-System-Flowcharts.md).
- To inspect database schemas, constraints, and data dictionaries, see [**04-Database-and-ERD.md**](./04-Database-and-ERD.md).
- To inspect REST API endpoints and contracts, see [**05-API-Architecture.md**](./05-API-Architecture.md).
- For local environment setup, testing commands, and CLI recipes, see [**17-Developer-Guide.md**](./17-Developer-Guide.md).
