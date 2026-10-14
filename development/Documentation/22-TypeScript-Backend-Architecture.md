# 22. TypeScript Backend Architecture & Migration Reference

## Executive Summary

This document specifies the architecture, technology stack, data layer, security model, and API contract preservation for the **TypeScript / Node.js Backend (`backend-ts/`)** of the Batanes Niche Job Portal.

The TypeScript backend is engineered as a bit-for-bit, behaviorally identical drop-in replacement for the original Python/FastAPI backend (`backend/`). It preserves 100% of the public and private API contracts, status codes, request/response JSON schemas, database schemas, and business rules without requiring any modifications to the React single-page frontend.

---

## 1. Architectural Philosophy & Constraints

1. **Zero Frontend Modifications**:
   - The React 18 + Vite frontend communicates identically with either backend implementation without changing a single line of code, URL path, header, or type definition.
2. **Identical API Contract**:
   - Every endpoint, HTTP verb, query parameter, request body, status code (e.g., `201 Created` on registration, job creation, application submission, and job bookmarking), and response payload matches FastAPI/Pydantic schemas.
3. **Identical Error Format (`{ "detail": ... }`)**:
   - Error responses adhere strictly to `{ "detail": string | Array<{ loc: string[], msg: string }> }`. Zod validation errors return HTTP 422 Unprocessable Entity formatted to mirror FastAPI `RequestValidationError`.
4. **Database & Data Parity**:
   - The database schema is bit-for-bit compatible with the existing 12 tables and constraints in SQLite (`backend/batanes_niche.db`) and PostgreSQL. Prisma models map directly to existing table and column names using `@map` / `@@map`.
5. **No Logic Alterations**:
   - Business rules, geographic scoring, deterministic 70/30 recommendation formulas, token rotation algorithms, and SSR admin functionality remain strictly identical.

---

## 2. Technology Stack Mapping

| Layer / Concern | Python Original (`backend/`) | TypeScript Replacement (`backend-ts/`) | Rationale & Parity Notes |
| :--- | :--- | :--- | :--- |
| **Runtime & Language** | Python 3.11+ | Node.js (v18+) / TypeScript 5.4+ | Strict typing, zero implicit `any`, modern async/await |
| **HTTP Framework** | FastAPI (ASGI / Starlette) | Express.js 4.x | High-performance, mature ecosystem, middleware flex |
| **ORM & Database Client** | SQLAlchemy 2.0 (Sync) | Prisma ORM 5.x | Type-safe queries, exact schema parity, native migrations |
| **Schema Validation** | Pydantic v2 | Zod 3.x | Schema-first validation, formats errors to `{ detail: ... }` |
| **Authentication & JWT** | PyJWT (HS256) | `jsonwebtoken` | Identical HS256 signature, claim verification & expiration |
| **Password Hashing** | Passlib / bcrypt | `bcryptjs` | 100% algorithm & salt compatible with existing user hashes |
| **Rate Limiting** | SlowAPI | `express-rate-limit` | Identical sliding window rate limiting returning HTTP 429 |
| **Admin UI (SSR)** | Jinja2 Templates | Nunjucks | Near 1:1 syntax compatibility with Jinja2 templates |
| **Admin Session Security** | itsdangerous signed cookies | HMAC-SHA256 signed cookies | Signed HttpOnly session cookies & double-submit CSRF |
| **Email Delivery** | Python `smtplib` | `nodemailer` | SMTP delivery with TLS/STARTTLS support |
| **Logging** | Python `logging` | `morgan` + Custom JSON Logger | Structured JSON logging with `trace_id` injection |

---

## 3. Directory Structure (`backend-ts/`)

```text
backend-ts/
├── prisma/
│   └── schema.prisma           # Exact 12-table Prisma schema with mapping
├── src/
│   ├── admin/
│   │   ├── auth.ts             # Admin cookie session, CSRF issuance & verification
│   │   └── routes.ts           # Admin SSR controller (12 server-rendered routes)
│   ├── api/
│   │   ├── deps.ts             # Auth dependencies & middleware guards (requireRole, etc.)
│   │   └── v1/                 # REST API router modules
│   │       ├── auth.ts         # /api/v1/auth router (9 endpoints)
│   │       ├── users.ts        # /api/v1/users router (3 endpoints)
│   │       ├── jobs.ts         # /api/v1/jobs router (7 endpoints)
│   │       ├── applications.ts # /api/v1/applications router (3 endpoints)
│   │       ├── savedJobs.ts    # /api/v1/saved-jobs router (3 endpoints)
│   │       ├── recommendations.ts # /api/v1/recommendations router (2 endpoints)
│   │       ├── notifications.ts   # /api/v1/notifications router (2 endpoints)
│   │       ├── meta.ts         # /api/v1/meta router (1 endpoint)
│   │       └── index.ts        # API v1 router aggregator
│   ├── core/
│   │   ├── config.ts           # Zod-validated environment settings
│   │   ├── constants.ts        # Common skills, education, employment, business types
│   │   ├── geography.ts        # Canonical 3 islands, 6 municipalities, 29 barangays
│   │   └── security.ts         # JWT token issuance, password hashing & verification
│   ├── database/
│   │   └── client.ts           # PrismaClient singleton instance
│   ├── middleware/
│   │   ├── errorHandler.ts     # Global 500 handler with trace_id & incident logging
│   │   ├── logging.ts          # Structured HTTP request logging
│   │   └── rateLimiter.ts      # Rate limiters matching SlowAPI limits
│   ├── repositories/           # Direct Prisma query abstraction layer
│   │   ├── userRepository.ts
│   │   ├── jobRepository.ts
│   │   ├── applicationRepository.ts
│   │   ├── notificationRepository.ts
│   │   ├── tokenRepository.ts
│   │   ├── auditLogRepository.ts
│   │   └── errorReportRepository.ts
│   ├── schemas/                # Zod request validation and response serializers
│   │   ├── auth.ts
│   │   ├── user.ts
│   │   ├── job.ts
│   │   ├── application.ts
│   │   ├── notification.ts
│   │   └── meta.ts
│   ├── services/               # Core business logic layer
│   │   ├── authService.ts      # Register, login, refresh rotation, logout, OTP reset
│   │   ├── userService.ts      # Profiles, completeness score, candidate search
│   │   ├── jobService.ts       # Job CRUD, public preview, bookmarking
│   │   ├── applicationService.ts # Submissions, transitions, role-based views
│   │   ├── recommendationService.ts # Deterministic 70/30 matching engine
│   │   ├── skillService.ts     # Catalog normalization and parsing
│   │   ├── notificationService.ts # Persistent event notifications
│   │   ├── auditService.ts     # Security event audit logging
│   │   ├── errorLoggingService.ts # Incident reporting & stack trace capture
│   │   └── emailService.ts     # OTP email dispatch via SMTP
│   ├── templates/              # Nunjucks templates for Admin SSR (7 templates)
│   │   ├── base.njk
│   │   ├── login.njk
│   │   ├── dashboard.njk
│   │   ├── users.njk
│   │   ├── jobs.njk
│   │   ├── audit_logs.njk
│   │   └── error_reports.njk
│   ├── static/                 # Static assets for Admin UI
│   │   └── admin.css
│   └── main.ts                 # Express application entrypoint, middleware, probes
├── package.json
├── tsconfig.json
└── .env
```

---

## 4. Database Schema Parity (12 Tables)

The Prisma schema matches the SQLite and PostgreSQL schemas exactly:

1. `users`: Core account identity, role (`job_seeker`, `employer`, `admin`), account status (`active`, `suspended`, `inactive`), profile completeness.
2. `employer_profiles`: 1-to-1 extension with `company_name`, `company_address`, `business_type`.
3. `job_seeker_profiles`: 1-to-1 extension with `bio`, `education`, `experience_years`.
4. `jobs`: Listings with `salary_min`, `salary_max`, `employment_type`, `required_skills`, `status`, soft-delete `deleted_at`.
5. `applications`: Many-to-one between `jobs` and `users` (seeker), `status` (`pending`, `accepted`, `rejected`), unique `(job_id, seeker_id)`.
6. `saved_jobs`: Bookmarks with unique `(seeker_id, job_id)`.
7. `notifications`: Persistent notifications with `type` (`new_application`, `application_status_updated`).
8. `refresh_tokens`: Token rotation with hashed tokens, expiry, and revocation flags.
9. `revoked_tokens`: JTI blacklist for logged-out access tokens.
10. `password_reset_tokens`: 6-digit OTP tokens with bcrypt hashes, attempt counters, and expiry.
11. `error_reports`: Unhandled 500 error incident tracking with sanitized `trace_id`.
12. `audit_logs`: Security and administrative action auditing.

---

## 5. Verification & Testing Strategy

- **Static Type Check**: `npx tsc --noEmit` verifies 100% strict compliance without errors.
- **Contract Test Suite**: Jest / Supertest suite verifies all 32 REST endpoints and 12 Admin SSR routes.
- **Frontend Interoperability**: With `backend-ts` listening on `http://localhost:8000`, the React frontend (`http://localhost:5173`) runs all operations seamlessly:
  - Guest job preview
  - Job seeker & Employer registration
  - Normal & Demo logins
  - Profile editing with completeness recalculation
  - Job creation, filtering, and detail views
  - Job application submission and employer status acceptance/rejection
  - Recommendation engine calculations
  - Admin login, dashboard stats, account status toggling, and audit log viewing
