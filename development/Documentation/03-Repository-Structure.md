# 03 - Repository Structure

## 1. Top-Level Repository Overview

The **Batanes Niche Job Portal** repository is structured into distinct top-level directories separating backend code, frontend single-page application, container orchestration, and operational runbooks.

```text
Batanes_Niche/
├── backend/                  # FastAPI backend application, models, migrations, tests
├── frontend/                 # React 18 single-page application, components, styles
├── docker/                   # Docker buildfiles and production Nginx reverse proxy config
├── development/              # Operational documentation, testing contracts, Windows batch scripts
├── docker-compose.yml        # Multi-container orchestration (db, backend, frontend)
├── README.md                 # Developer entry point and quickstart guide
└── .gitignore                # Git exclusions (venv, node_modules, sqlite db, logs)
```

---

## 2. Backend Directory Breakdown (`backend/`)

The backend follows a layered domain architecture using FastAPI, SQLAlchemy 2.0, Alembic, and Jinja2.

```text
backend/
├── alembic/                          # Alembic database migration environment
│   ├── versions/                     # Migration scripts (cf8c97336bac_initial_12_tables.py)
│   ├── env.py                        # Alembic migration runner configuration
│   ├── script.py.mako                # Migration template file
│   └── README                        # Alembic instructions
├── app/                              # Core application source code
│   ├── admin/                        # Server-rendered Jinja2 administrative portal
│   │   ├── templates/                # HTML Jinja2 templates (dashboard, users, jobs, logs)
│   │   ├── auth.py                   # Signed cookie session management & CSRF helpers
│   │   └── routes.py                 # Admin route handlers & view controllers
│   ├── api/                          # REST API presentation layer
│   │   ├── v1/                       # API version 1 route endpoints
│   │   │   ├── auth.py               # /api/v1/auth endpoints
│   │   │   ├── users.py              # /api/v1/users endpoints
│   │   │   ├── jobs.py               # /api/v1/jobs endpoints
│   │   │   ├── applications.py       # /api/v1/applications endpoints
│   │   │   ├── recommendations.py    # /api/v1/recommendations endpoints
│   │   │   ├── saved_jobs.py         # /api/v1/saved-jobs endpoints
│   │   │   ├── notifications.py      # /api/v1/notifications endpoints
│   │   │   ├── meta.py               # /api/v1/meta endpoints
│   │   │   └── health.py             # /api/v1/health & /api/v1/ready probes
│   │   └── deps.py                   # Dependency injection (db session, auth guards)
│   ├── core/                         # Core infrastructure & configuration
│   │   ├── config.py                 # Pydantic BaseSettings (.env parsing)
│   │   ├── security.py               # bcrypt, JWT creation/decoding, OTP generation
│   │   ├── geography.py              # Canonical Batanes geographic hierarchy
│   │   └── limiter.py                # SlowAPI rate limiter instance
│   ├── database/                     # Database engine and session factory
│   │   ├── session.py                # SQLAlchemy engine, SessionLocal, Base model
│   │   └── base.py                   # Metadata registry importing all models
│   ├── middleware/                   # HTTP middleware interceptors
│   │   ├── error_handler.py          # Global exception handler (500 scrub & log)
│   │   └── logging_middleware.py     # Structured HTTP request/response logger
│   ├── models/                       # SQLAlchemy 2.0 ORM database entities
│   │   ├── user.py                   # User, EmployerProfile, JobSeekerProfile
│   │   ├── job.py                    # Job entity
│   │   ├── application.py            # Application entity
│   │   ├── saved_job.py              # SavedJob entity
│   │   ├── notification.py           # Notification entity
│   │   ├── token.py                  # RefreshToken, RevokedToken entities
│   │   ├── password_reset_token.py   # PasswordResetToken entity
│   │   ├── error_report.py           # ErrorReport entity
│   │   └── audit_log.py              # AuditLog entity
│   ├── repositories/                 # Data access layer (SQLAlchemy query abstraction)
│   │   ├── user_repository.py        # User CRUD & candidate directory queries
│   │   ├── job_repository.py         # Job CRUD, search filters, soft-deletes
│   │   ├── application_repository.py # Application CRUD & duplicate checks
│   │   ├── saved_job_repository.py   # SavedJob CRUD
│   │   ├── notification_repository.py# Notification CRUD & mark-as-read
│   │   ├── token_repository.py       # Refresh & revoked token queries
│   │   ├── password_reset_repository.py # OTP token management
│   │   ├── error_report_repository.py# ErrorReport persistence
│   │   └── audit_log_repository.py   # Append-only audit log queries
│   ├── schemas/                      # Pydantic v2 data validation & serialization
│   │   ├── auth.py                   # UserRegister, UserLogin, Token, PasswordReset
│   │   ├── user.py                   # UserProfile, JobSeekerSummary, Update schemas
│   │   ├── job.py                    # JobCreate, JobUpdate, JobOut schemas
│   │   ├── application.py            # ApplicationCreate, ApplicationOut schemas
│   │   ├── saved_job.py              # SavedJobOut schema
│   │   ├── notification.py           # NotificationOut schema
│   │   ├── recommendation.py         # CandidateRanking, JobRanking schemas
│   │   └── meta.py                   # Geography, options schemas
│   ├── services/                     # Business logic and domain rules
│   │   ├── auth_service.py           # Auth, registration, token rotation, OTP reset
│   │   ├── user_service.py           # Profile completeness, candidate directory
│   │   ├── job_service.py            # Job validation, lifecycle, formatting
│   │   ├── application_service.py    # Application transactions, contact reveal
│   │   ├── recommendation_service.py # Deterministic two-tier matching engine
│   │   ├── geography_service.py      # Location validation & distance scoring
│   │   ├── notification_service.py   # In-app notifications
│   │   ├── saved_jobs_service.py     # Bookmark management
│   │   ├── audit_service.py          # Append-only audit logging
│   │   ├── error_logging_service.py  # 500 error reporting & secrets scrubbing
│   │   └── email_delivery_service.py # SMTP OTP delivery with dev simulation
│   ├── cli.py                        # Management CLI (create-admin, seed-data)
│   └── main.py                       # FastAPI application entry point & router mounting
├── tests/                            # Comprehensive Pytest test suite
│   ├── conftest.py                   # Pytest fixtures & in-memory test database
│   ├── test_admin.py                 # Jinja2 admin routes & session tests
│   ├── test_applications.py          # Application lifecycle & duplicate tests
│   ├── test_auth.py                  # Auth, registration, and token tests
│   ├── test_geography.py             # Canonical geography validation tests
│   ├── test_jobs.py                  # Job lifecycle, search, and filter tests
│   ├── test_otp.py                   # 6-digit OTP password reset tests
│   ├── test_privacy.py               # Contact reveal & applicant privacy tests
│   ├── test_recommendations.py       # Two-tier recommendation engine tests
│   ├── test_regressions.py           # Regression and boundary tests
│   ├── test_services_coverage.py     # Domain service coverage tests
│   └── test_user.py                  # User profile & completeness score tests
├── alembic.ini                       # Alembic configuration
├── pyproject.toml                    # Pytest and coverage configuration
└── requirements.txt                  # Python production dependencies
```

---

## 3. Frontend Directory Breakdown (`frontend/`)

The frontend is a single-page application built with React 18, TypeScript, Vite, and Tailwind CSS.

```text
frontend/
├── public/                           # Static assets served at root
│   └── favicon.ico                   # Application favicon
├── src/                              # Application source code
│   ├── api/                          # HTTP client and API integration
│   │   └── client.ts                 # Axios instance, Bearer token, silent refresh interceptor
│   ├── components/                   # Reusable UI and layout components
│   │   ├── common/                   # Shared UI primitives (Badge, Card, Modal, Spinner)
│   │   ├── feedback/                 # User feedback components (LoadingSpinner, EmptyState)
│   │   ├── jobs/                     # Job-specific components (JobCard, JobFilterBar, JobForm)
│   │   ├── layout/                   # Structural layout (Navbar, Footer, Layout container)
│   │   └── ui/                       # Toast notification provider & alerts
│   ├── contexts/                     # React Context state providers
│   │   ├── AuthContext.tsx           # Global authentication state, login, logout, refresh
│   │   └── ToastContext.tsx          # Global toast notification queue
│   ├── pages/                        # Page-level route views
│   │   ├── HomePage.tsx              # Public landing page with hero and featured vacancies
│   │   ├── LoginPage.tsx             # User authentication form
│   │   ├── RegisterPage.tsx          # User registration with role invariant selection
│   │   ├── ForgotPasswordPage.tsx    # Password reset request (OTP dispatch)
│   │   ├── ResetPasswordPage.tsx     # OTP verification and new password entry
│   │   ├── JobsPage.tsx              # Public job catalog with multi-facet filters
│   │   ├── JobDetailPage.tsx         # Job details, requirements, and application submission
│   │   ├── PostJobPage.tsx           # Employer job creation form
│   │   ├── EditJobPage.tsx           # Employer job modification form
│   │   ├── DashboardPage.tsx         # Job seeker dashboard (applications & saved jobs)
│   │   ├── EmployerDashboardPage.tsx # Employer dashboard (job listings & applicant review)
│   │   ├── CandidatesPage.tsx        # Employer candidate search & recommendation directory
│   │   ├── ProfilePage.tsx           # User profile editing & completeness score gauge
│   │   ├── NotificationsPage.tsx     # In-app notifications feed with mark-as-read
│   │   └── NotFoundPage.tsx          # 404 error page
│   ├── test/                         # Frontend Vitest test suite
│   │   ├── AuthContext.test.tsx      # AuthContext login and hydration tests
│   │   ├── JobCard.test.tsx          # JobCard presentation & bookmark visibility tests
│   │   ├── Navbar.test.tsx           # Dynamic role-based navigation tests
│   │   ├── setup.ts                  # Vitest environment setup
│   │   └── zero_jargon.test.ts       # Static scan enforcing zero technical jargon in UI
│   ├── types/                        # TypeScript type definitions
│   │   └── index.ts                  # Shared interfaces (User, Job, Application, etc.)
│   ├── App.tsx                       # Root routing component with route guards
│   ├── index.css                     # Design tokens (HSL CSS variables) & global styles
│   └── main.tsx                      # Application DOM bootstrap
├── index.html                        # HTML entry point (title, viewport, root div)
├── package.json                      # Node dependencies & execution scripts
├── postcss.config.js                 # PostCSS plugin configuration
├── tailwind.config.js                # Tailwind CSS configuration with custom color palette
├── tsconfig.json                     # TypeScript compiler configuration
└── vite.config.ts                    # Vite bundler configuration & local API proxy
```

---

## 4. Development & Operational Scripts (`development/`)

Contains operational runbooks, local scripts, and the complete documentation suite.

```text
development/
├── Documentation/                    # Comprehensive Developer Documentation Package (18 files)
│   ├── README.md                     # Documentation index & cross-reference guide
│   ├── 01-System-Overview.md         # Vision, personas, scope, and non-features
│   ├── 02-Architecture.md            # Multi-tier system architecture and Mermaid diagrams
│   ├── 03-Repository-Structure.md    # Complete codebase directory breakdown (this document)
│   ├── 04-Database-and-ERD.md        # Database schema, Mermaid ERD, and Data Dictionary
│   ├── 05-API-Architecture.md        # REST API specifications and endpoint catalog
│   ├── 06-Authentication-and-Security.md # Security, JWT rotation, OTP, and session rules
│   ├── 07-User-Roles-and-Permissions.md # Role definitions, capability matrix, ownership
│   ├── 08-Business-Workflows.md      # End-to-end business workflows and flowcharts
│   ├── 09-Recommendation-Engine.md  # Deterministic matching algorithm and formulas
│   ├── 10-Frontend-Architecture.md   # React SPA, routing, state, and design tokens
│   ├── 11-Administrative-UI.md       # Server-rendered Jinja2 admin portal (/admin)
│   ├── 12-Notifications-and-Applications.md # Application lifecycle & notification coupling
│   ├── 13-Geography-and-Reference-Data.md # Canonical Batanes geography & seeding
│   ├── 14-Testing-and-Quality.md     # Testing strategy, Pytest, Vitest, and CI gates
│   ├── 15-Deployment-and-Operations.md # Production Docker, Nginx, PostgreSQL, backups
│   ├── 16-Data-Analysis-Reference.md # Entity relationships, measures, and analytical SQL
│   ├── 17-Developer-Guide.md         # Local setup, CLI commands, and extension guides
│   └── 18-Architecture-Decisions.md  # 14 Architecture Decision Records (ADRs)
├── scripts/                          # Windows batch scripts for rapid local development
│   ├── setup.bat                     # Automated venv creation, dep install, migrations
│   ├── start.bat                     # Launches backend (8000) and frontend (5173)
│   ├── stop.bat                      # Terminates running dev processes
│   └── test.bat                      # Runs backend and frontend test suites
├── setup/                            # Detailed operational setup runbooks
│   ├── LOCAL_SETUP.md                # Comprehensive local development setup guide
│   └── PRODUCTION_SETUP.md           # 19-step production deployment runbook
└── testing/                          # Testing philosophy and contracts
    └── TESTING.md                    # Testing contracts, coverage standards, zero-jargon rules
```

---

## 5. Docker & Infrastructure Configuration (`docker/`)

```text
docker/
├── backend.Dockerfile                # Multi-stage Dockerfile for FastAPI backend
├── frontend.Dockerfile               # Multi-stage Dockerfile compiling React to static assets
└── nginx.conf                        # Production Nginx reverse proxy routing and caching
```

---

## 6. Where Code Belongs: Developer Extension Guide

When adding or modifying functionality, follow these strict placement rules:

| Task | Correct File / Directory Location | What NOT to Do |
|---|---|---|
| **Add a new REST API endpoint** | `backend/app/api/v1/<domain>.py` | Do not put business rules or SQL in route handlers. Call a service. |
| **Add a new business rule or calculation** | `backend/app/services/<domain>_service.py` | Do not put calculations inside models or database repositories. |
| **Add a database table or column** | `backend/app/models/<domain>.py` + create Alembic migration in `backend/alembic/versions/` | Do not modify the database directly without an Alembic migration script. |
| **Add a database query or filter** | `backend/app/repositories/<domain>_repository.py` | Do not write raw SQL or ORM filter queries in services or routes. |
| **Add a frontend page or view** | `frontend/src/pages/<PageName>.tsx` + register route in `frontend/src/App.tsx` | Do not put large page layouts directly inside App.tsx or components/. |
| **Add a reusable UI element** | `frontend/src/components/common/<ComponentName>.tsx` | Do not hardcode ad-hoc CSS colors; use semantic CSS tokens. |
| **Add an admin screen or tool** | `backend/app/admin/routes.py` + `backend/app/admin/templates/<template>.html` | Do not build admin screens inside the React frontend SPA. |
| **Add an automated test** | Backend: `backend/tests/test_<domain>.py`<br/>Frontend: `frontend/src/test/<Component>.test.tsx` | Do not skip tests when adding or changing service functionality. |

---

## 7. Next Steps

- To examine the exact database schema, foreign keys, and constraints, see [**04-Database-and-ERD.md**](./04-Database-and-ERD.md).
- To review the REST API routing contracts and schema definitions, see [**05-API-Architecture.md**](./05-API-Architecture.md).
- To understand user roles and capability matrices, see [**07-User-Roles-and-Permissions.md**](./07-User-Roles-and-Permissions.md).
