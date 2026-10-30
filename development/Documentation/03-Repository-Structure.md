# 03 - Repository Structure

## 1. Top-Level Repository Overview

The **Batanes Niche Job Portal** repository is structured as a unified **pnpm workspace** separating backend service code, frontend single-page application, container orchestration, and operational runbooks.

```text
Batanes_Niche/
+-- backend/                  # TypeScript + Express.js backend with Prisma ORM and Nunjucks SSR
+-- frontend/                 # React 18 single-page application, components, styles (Vite + Tailwind)
+-- Database/                 # SQLite database storage (batanes_niche.db) for local zero-setup dev
+-- docker/                   # Docker buildfiles and production Nginx reverse proxy config
+-- development/              # Operational documentation, database seeders, and developer scripts
+-- docker-compose.yml        # Multi-container orchestration (db, backend, frontend)
+-- package.json              # Root workspace orchestration and filter scripts
+-- pnpm-workspace.yaml       # pnpm workspace definition (packages: backend, frontend)
+-- pnpm-lock.yaml            # Deterministic workspace dependency lockfile
+-- README.md                 # Developer entry point and quickstart guide
+-- .gitignore                # Git exclusions (node_modules, dist, sqlite db, logs)
```

---

## 2. Backend Directory Breakdown (`backend/`)

The backend follows a layered domain architecture using TypeScript, Express.js 4.x, Prisma ORM 5.x, Zod 3.x, and Nunjucks templates for administrative server-side rendering.

```text
backend/
+-- prisma/                                 # Prisma schema and migrations
¦   +-- schema.prisma                       # Bit-for-bit Prisma schema mapping all 12 tables
+-- src/                                    # Application source code
¦   +-- admin/                              # Server-rendered administrative portal (/admin)
¦   ¦   +-- auth.ts                         # Signed cookie session management & CSRF helpers
¦   ¦   +-- routes.ts                       # Admin route handlers & SSR controllers
¦   +-- api/                                # REST API presentation layer
¦   ¦   +-- deps.ts                         # Request context, auth guards, role checks
¦   ¦   +-- v1/                             # API version 1 route endpoints
¦   ¦       +-- index.ts                    # Root v1 router aggregating domain routers
¦   ¦       +-- applications.ts             # /api/v1/applications endpoints
¦   ¦       +-- auth.ts                     # /api/v1/auth endpoints
¦   ¦       +-- jobs.ts                     # /api/v1/jobs endpoints
¦   ¦       +-- meta.ts                     # /api/v1/meta endpoints
¦   ¦       +-- notifications.ts            # /api/v1/notifications endpoints
¦   ¦       +-- recommendations.ts          # /api/v1/recommendations endpoints
¦   ¦       +-- savedJobs.ts                # /api/v1/saved-jobs endpoints
¦   ¦       +-- users.ts                    # /api/v1/users endpoints
¦   +-- core/                               # Core infrastructure & configuration
¦   ¦   +-- config.ts                       # Environment variable validation via Zod
¦   ¦   +-- constants.ts                    # Geographic hierarchy, standard skills, catalogs
¦   ¦   +-- errors.ts                       # Custom HTTP domain error classes
¦   ¦   +-- geography.ts                    # Canonical Batanes geographic hierarchy
¦   ¦   +-- security.ts                     # bcryptjs hashing, JWT sign/verify, OTP generation
¦   +-- database/                           # Database client and synchronization
¦   ¦   +-- client.ts                       # PrismaClient singleton with connection tuning
¦   ¦   +-- reset.ts                        # Safe development database reset utility
¦   ¦   +-- seed.ts                         # Seed runner invoking baseline and sample seeds
¦   ¦   +-- syncProvider.ts                 # Dynamic provider switcher (SQLite <-> PostgreSQL)
¦   +-- middleware/                         # HTTP middleware interceptors
¦   ¦   +-- errorHandler.ts                 # Global exception handler ({ detail: ... } schema)
¦   ¦   +-- logging.ts                      # Structured HTTP request/response logger
¦   ¦   +-- rateLimiter.ts                  # IP and endpoint rate limiting
¦   +-- repositories/                       # Data access layer (Prisma query abstraction)
¦   ¦   +-- applicationRepository.ts        # Application queries & duplicate checks
¦   ¦   +-- auditLogRepository.ts           # Append-only audit log persistence
¦   ¦   +-- errorReportRepository.ts        # ErrorReport persistence & scrubbed payloads
¦   ¦   +-- jobRepository.ts                # Job CRUD, search filters, soft-deletes
¦   ¦   +-- notificationRepository.ts       # Notification queries & mark-as-read
¦   ¦   +-- passwordResetRepository.ts      # OTP token management & attempt tracking
¦   ¦   +-- savedJobRepository.ts           # SavedJob queries
¦   ¦   +-- tokenRepository.ts              # Refresh & revoked token management
¦   ¦   +-- userRepository.ts              # User CRUD & candidate directory queries
¦   +-- schemas/                            # Zod data validation & serialization schemas
¦   ¦   +-- application.ts                  # Application validation schemas
¦   ¦   +-- auth.ts                         # Registration, login, OTP reset schemas
¦   ¦   +-- common.ts                       # Pagination & message schemas
¦   ¦   +-- job.ts                          # Job create, update, filter schemas
¦   ¦   +-- meta.ts                         # Geographic metadata schemas
¦   ¦   +-- notification.ts                 # Notification output schemas
¦   ¦   +-- recommendation.ts               # Candidate & job ranking schemas
¦   ¦   +-- user.ts                         # User profile schemas
¦   +-- services/                           # Business logic and domain rules
¦   ¦   +-- applicationService.ts           # Application transactions, contact reveal
¦   ¦   +-- auditService.ts                 # Append-only audit logging & payload scrubbing
¦   ¦   +-- authService.ts                  # Auth, registration, token rotation, OTP reset
¦   ¦   +-- emailDeliveryService.ts         # Nodemailer OTP delivery with console fallback
¦   ¦   +-- errorLoggingService.ts          # 500 error reporting & secrets scrubbing
¦   ¦   +-- geographyService.ts             # Location validation & distance scoring
¦   ¦   +-- jobService.ts                   # Job validation, lifecycle, saved jobs
¦   ¦   +-- notificationService.ts          # In-app notification creation & dispatch
¦   ¦   +-- recommendationService.ts        # Deterministic 70/30 two-tier matching engine
¦   ¦   +-- skillService.ts                 # Canonical skill catalog normalization & matching
¦   ¦   +-- userService.ts                  # Profile completeness, candidate directory
¦   +-- static/                             # Static assets for administrative portal
¦   ¦   +-- admin.css                       # Admin interface stylesheet
¦   +-- templates/                          # Nunjucks SSR templates for admin portal
¦   ¦   +-- base.njk                        # Base admin layout
¦   ¦   +-- login.njk                       # Admin authentication form
¦   ¦   +-- dashboard.njk                   # Metrics & system statistics
¦   ¦   +-- users.njk                       # User moderation view
¦   ¦   +-- jobs.njk                        # Job moderation view
¦   ¦   +-- audit_logs.njk                  # Append-only audit logs viewer
¦   ¦   +-- error_reports.njk               # System error reports viewer
¦   +-- main.ts                             # Application entry point & Express server bootstrap
+-- package.json                            # Backend scripts & Node dependencies
+-- tsconfig.json                           # TypeScript compiler configuration (strict mode)
```

---

## 3. Frontend Directory Breakdown (`frontend/`)

The frontend is a single-page application built with React 18, TypeScript, Vite, and Tailwind CSS.

```text
frontend/
+-- public/                                 # Static assets served at root
¦   +-- favicon.ico                         # Application favicon
+-- src/                                    # Application source code
¦   +-- api/                                # HTTP client and API integration
¦   ¦   +-- client.ts                       # Axios instance, Bearer token, silent refresh interceptor
¦   +-- components/                         # Reusable UI and layout components
¦   ¦   +-- auth/                           # Authentication components
¦   ¦   ¦   +-- ProtectedRoute.tsx          # Role-based route guard wrapper
¦   ¦   +-- forms/                          # Form input controls
¦   ¦   ¦   +-- SkillSelector.tsx           # Canonical skill multi-select with custom 'Other' input
¦   ¦   +-- layout/                         # Structural layout components
¦   ¦   ¦   +-- Footer.tsx                  # Application footer with Batanes context & navigation
¦   ¦   ¦   +-- Layout.tsx                  # Main shell component wrapping Navbar, Outlet, Footer
¦   ¦   ¦   +-- Navbar.tsx                  # Navigation bar with role-aware menu & notifications bell
¦   ¦   +-- ui/                             # Shared UI presentation components
¦   ¦       +-- index.tsx                   # Shared UI primitives (Spinner, PageSpinner, Modal)
¦   ¦       +-- JobCard.tsx                 # Interactive vacancy card with bookmark toggle
¦   ¦       +-- Toast.tsx                   # Reactive toast notification alert system
¦   +-- contexts/                           # React Context state providers
¦   ¦   +-- AuthContext.tsx                 # Global authentication state, login, logout, refresh
¦   +-- pages/                              # Page-level route views
¦   ¦   +-- auth/                           # Authentication pages
¦   ¦   ¦   +-- ForgotPasswordPage.tsx      # Multi-step 6-digit OTP password reset view
¦   ¦   ¦   +-- LoginPage.tsx               # User authentication form
¦   ¦   ¦   +-- RegisterPage.tsx            # Dual-role account registration form
¦   ¦   +-- jobs/                           # Job domain pages
¦   ¦   ¦   +-- JobDetailPage.tsx           # Job details, requirements, application submission
¦   ¦   ¦   +-- JobsPage.tsx                # Public job catalog with multi-facet filters
¦   ¦   ¦   +-- MyJobsPage.tsx              # Employer job management view (active & closed)
¦   ¦   ¦   +-- PostJobPage.tsx             # Employer vacancy creation form
¦   ¦   +-- ApplicationsPage.tsx            # Job seeker submitted applications & tracking
¦   ¦   +-- CandidatesPage.tsx              # Employer candidate search & recommendations view
¦   ¦   +-- DashboardPage.tsx               # Unified dashboard (Seeker or Employer view)
¦   ¦   +-- LandingPage.tsx                 # Public homepage with search hero & island highlights
¦   ¦   +-- NotificationsPage.tsx           # In-app notifications feed with mark-as-read
¦   ¦   +-- ProfilePage.tsx                 # User profile editing & completeness score gauge
¦   ¦   +-- SavedJobsPage.tsx               # Job seeker bookmarked vacancies catalog
¦   +-- test/                               # Frontend Vitest test suite
¦   ¦   +-- AuthContext.test.tsx            # AuthContext login and hydration tests
¦   ¦   +-- DemoMode.test.tsx               # Demo mode 1-click credentials test
¦   ¦   +-- JobCard.test.tsx                # JobCard presentation & bookmark visibility tests
¦   ¦   +-- JobPreviewCard.test.tsx         # Guest job preview redaction tests
¦   ¦   +-- Navbar.test.tsx                 # Dynamic role-based navigation tests
¦   ¦   +-- setup.ts                        # Vitest environment setup
¦   ¦   +-- zero_jargon.test.ts             # Static scan enforcing zero technical jargon in UI
¦   +-- types/                              # TypeScript type definitions
¦   ¦   +-- index.ts                        # Shared interfaces (User, Job, Application, etc.)
¦   +-- App.tsx                             # Root routing component with route guards
¦   +-- index.css                           # Design tokens (HSL CSS variables) & global styles
¦   +-- main.tsx                            # Application DOM bootstrap
+-- index.html                              # HTML entry point (title, viewport, root div)
+-- package.json                            # Node dependencies & execution scripts
+-- postcss.config.js                       # PostCSS plugin configuration
+-- tailwind.config.js                      # Tailwind CSS configuration with custom palette
+-- tsconfig.json                           # TypeScript compiler configuration
+-- vite.config.ts                          # Vite bundler configuration & local API proxy
```

---

## 4. Development & Operational Scripts (`development/`)

Contains operational runbooks, local utility scripts, seed data scripts, and the documentation suite.

```text
development/
+-- Documentation/                          # Comprehensive Developer Documentation Package (23 files)
¦   +-- README.md                           # Documentation index & cross-reference guide
¦   +-- 01-System-Overview.md               # Vision, personas, scope, and non-features
¦   +-- 02-Architecture.md                  # Multi-tier system architecture and Mermaid diagrams
¦   +-- 03-Repository-Structure.md          # Complete codebase directory breakdown (this document)
¦   +-- 04-Database-and-ERD.md              # Database schema, Mermaid ERD, and Data Dictionary
¦   +-- 05-API-Architecture.md              # REST API specifications and endpoint catalog
¦   +-- 06-Authentication-and-Security.md   # Security, JWT rotation, OTP, and session rules
¦   +-- 07-User-Roles-and-Permissions.md    # Role definitions, capability matrix, ownership
¦   +-- 08-Business-Workflows.md            # End-to-end business workflows and flowcharts
¦   +-- 09-Recommendation-Engine.md        # Deterministic matching algorithm and formulas
¦   +-- 10-Frontend-Architecture.md         # React SPA, routing, state, and design tokens
¦   +-- 11-Administrative-UI.md             # Server-rendered Nunjucks admin portal (/admin)
¦   +-- 12-Notifications-and-Applications.md# Application lifecycle & notification coupling
¦   +-- 13-Geography-and-Reference-Data.md  # Canonical Batanes geography & seeding
¦   +-- 14-Testing-and-Quality.md           # Testing strategy, Type checks, Vitest, CI gates
¦   +-- 15-Deployment-and-Operations.md     # Production Docker, Nginx, PostgreSQL, backups
¦   +-- 16-Data-Analysis-Reference.md       # Entity relationships, measures, analytical SQL
¦   +-- 17-Developer-Guide.md               # Local setup, CLI commands, and extension recipes
¦   +-- 18-Architecture-Decisions.md        # 16 Architecture Decision Records (ADRs)
¦   +-- 19-Skills-and-Business-Type-Catalog.md # 18 skills, enterprise catalog, normalization
¦   +-- 20-System-Flowcharts.md             # Three-level visual workflows (User, Specific, System)
¦   +-- 21-Developer-Architecture-Guide.md  # Practical developer modification & feature lookup matrix
¦   +-- 22-Backend-Architecture.md          # Specification for Express.js + Prisma backend
¦   +-- 23-Database-Environment-Switching.md# SQLite <-> PostgreSQL zero-code switching
+-- scripts/                                # Local development and database automation scripts
¦   +-- seeds/                              # Database seeding scripts
¦   ¦   +-- baseline.ts                     # Baseline operational data (geography, skills, admin)
¦   ¦   +-- sample.ts                       # Realistic sample data (employers, seekers, jobs)
¦   ¦   +-- utils.ts                        # Seed helpers, password hashing, SQLite path resolution
¦   +-- init-db.bat                         # Wrapper for pnpm db:setup
¦   +-- init-db.ts                          # Idempotent database setup and seeder CLI
¦   +-- setup.bat                           # Automated local environment setup
¦   +-- start.bat                           # Launches backend (8000) and frontend (5173) concurrently
¦   +-- stop.bat                            # Terminates running development server processes
¦   +-- test.bat                            # Runs type checking and Vitest test suites
¦   +-- tsconfig.json                       # TypeScript config for standalone development scripts
+-- setup/                                  # Detailed operational setup runbooks
¦   +-- LOCAL_SETUP.md                      # Comprehensive local development setup guide
¦   +-- PRODUCTION_SETUP.md                 # 19-step production deployment runbook
+-- testing/                                # Testing philosophy and contracts
    +-- TESTING.md                          # Testing contracts, coverage standards, zero-jargon rules
```

---

## 5. Docker & Infrastructure Configuration (`docker/`)

```text
docker/
+-- backend.Dockerfile                      # Multi-stage production build for Node.js + Express backend
+-- frontend.Dockerfile                     # Multi-stage production build for React + Vite SPA (Nginx)
+-- nginx.conf                              # Production Nginx reverse proxy routing and caching
```

---

## 6. Where Code Belongs: Developer Extension Guide

When adding or modifying functionality, follow these strict placement rules:

| Task | Correct File / Directory Location | What NOT to Do |
|---|---|---|
| **Add a new REST API endpoint** | `backend/src/api/v1/<domain>.ts` | Do not put business rules or SQL in route handlers. Call a service. |
| **Add a new business rule or calculation** | `backend/src/services/<domain>Service.ts` | Do not put calculations inside schemas or database repositories. |
| **Add a database table or column** | `backend/prisma/schema.prisma` + run `pnpm run db:push` | Do not edit the SQLite file or database directly. |
| **Add a database query or filter** | `backend/src/repositories/<domain>Repository.ts` | Do not write Prisma query calls directly inside services or route handlers. |
| **Add a request/response schema** | `backend/src/schemas/<domain>.ts` | Do not rely on untyped `any` or skip runtime validation with Zod. |
| **Add a frontend page or view** | `frontend/src/pages/<PageName>.tsx` + register route in `frontend/src/App.tsx` | Do not put large page layouts directly inside App.tsx or components/. |
| **Add a reusable UI element** | `frontend/src/components/ui/<ComponentName>.tsx` | Do not hardcode ad-hoc CSS colors; use semantic CSS tokens. |
| **Add an admin screen or tool** | `backend/src/admin/routes.ts` + `backend/src/templates/<template>.njk` | Do not build admin screens inside the React frontend SPA. |
| **Add an automated test** | Frontend: `frontend/src/test/<Component>.test.tsx` | Do not skip tests when adding or changing service functionality. |

---

## 7. Next Steps

- For step-by-step developer navigation and feature modification maps, see [**21-Developer-Architecture-Guide.md**](./21-Developer-Architecture-Guide.md).
- For comprehensive multi-level visual workflows, see [**20-System-Flowcharts.md**](./20-System-Flowcharts.md).
- To examine the exact database schema, foreign keys, and constraints, see [**04-Database-and-ERD.md**](./04-Database-and-ERD.md).