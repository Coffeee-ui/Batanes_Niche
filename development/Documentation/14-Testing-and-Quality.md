# 14 - Testing and Quality Assurance

## 1. Testing Philosophy & Core Principles

The **Batanes Niche Job Portal** enforces strict software quality guarantees through automated testing across both backend services and frontend components.

### Core Testing Principles
1. **Root-Cause Verification**:
   - Zero tolerance for masking bugs or swallow-and-ignore patterns (no silent `.catch(() => {})`, no loose `as any` type bypasses, no dummy return values).
   - Any API schema change must be reflected synchronously across both Pydantic models and TypeScript interfaces.
2. **Deterministic Isolation**:
   - Every backend test runs against an isolated in-memory SQLite database (`sqlite:///:memory:`) rebuilt per test transaction.
   - Frontend tests mock external network boundaries using Vitest and verify component behavior in a simulated DOM environment.
3. **Zero-Jargon Public Contract**:
   - Public-facing user interfaces strictly forbid internal system terminology (*FastAPI*, *PostgreSQL*, *JWT*, *SQLAlchemy*, *Alembic*, *Docker*, *WebSockets*).
   - Compliance is continuously validated via an automated static analysis audit (`zero_jargon.test.ts`).

---

## 2. Backend Test Suite (`backend/tests/`)

The backend test suite is built on **Pytest 8.x** with **pytest-cov**, targeting **>= 85% coverage** across all domain services, repositories, and security utilities.

### Backend Test Modules

| Test File | Test Scope & Assertions |
|---|---|
| `test_auth.py` | Public registration for seekers and employers; login credential validation; JWT access token generation; stateful refresh token rotation; duplicate username/email rejection. |
| `test_jobs.py` | Job posting creation; ownership validation on update and delete; municipality search filters; salary range matching; soft-deletion verification (`deleted_at IS NOT NULL`). |
| `test_applications.py` | Application submission; self-application prevention; duplicate application prevention (`uq_applications_job_seeker`); status transition state machine; atomic notification generation. |
| `test_recommendations.py` | Two-tier scoring engine; skill overlap tokenization and substring matching; geographic distance matrix scoring; Tier 1 and Tier 2 ordering and tie-breaking. |
| `test_admin.py` | Server-rendered Jinja2 admin routes; signed session cookie authentication; CSRF token validation; user account suspension; job listing moderation; audit log inspection. |
| `test_geography.py` | Canonical geography validation; composite barangay matching (e.g., *Kayhuvokan (Santa Rosa)*); deterministic island resolution; distance score points. |
| `test_otp.py` | CSPRNG 6-digit OTP generation; bcrypt OTP hashing; 15-minute expiration; attempt counter increment; lockout after 5 failed verification attempts; zero account enumeration. |
| `test_privacy.py` | Candidate directory sanitization (omission of email and phone); authorized contact reveal to employers upon application submission. |
| `test_regressions.py` | Refresh token compromise reuse detection; immediate access token JTI blacklisting on logout; active account status checks. |
| `test_services_coverage.py` | End-to-end domain services: `AuditService` secrets scrubbing; `ErrorLoggingService` 500 error capture; `EmailDeliveryService` simulation; `SavedJobsService` bookmarks. |
| `test_user.py` | Profile completeness score calculation (0–100 points); profile attribute updates; canonical location validation on profile update. |

---

## 3. Frontend Test Suite (`frontend/src/test/`)

The frontend test suite is implemented with **Vitest 1.6.x** and **@testing-library/react** running in a JSDOM environment.

### Frontend Test Modules

| Test File | Test Scope & Assertions |
|---|---|
| `JobCard.test.tsx` | Verifies job title, employer, location badges, and salary formatting; verifies bookmark button renders for seekers and is suppressed for employers. |
| `Navbar.test.tsx` | Verifies dynamic role-based navigation links for guests (Login, Register), authenticated job seekers (Dashboard, Saved Jobs), and authenticated employers (Post Job, Candidates). |
| `AuthContext.test.tsx` | Verifies login authentication flow, in-memory access token storage, localStorage refresh token management, silent refresh replay, and logout cache cleanup. |
| `zero_jargon.test.ts` | Automated static analysis scanner that inspects all `.tsx` and `.html` source files to assert that no internal technical architecture terms render in user-facing UI text. |

---

## 4. Test Execution Guide

### 4.1 Running Backend Tests
```bash
# Navigate to backend directory and activate virtual environment
cd backend
.\venv\Scripts\activate

# Run full test suite with coverage report
pytest tests/ --cov=app --cov-report=term-missing

# Run a specific test module with verbose output
pytest tests/test_recommendations.py -v
```

### 4.2 Running Frontend Tests
```bash
# Navigate to frontend directory
cd frontend

# Run all component tests once
npm test

# Run tests in interactive watch mode
npx vitest

# Verify TypeScript type safety and production build
npm run build
```

### 4.3 Automated Windows Test Script
```cmd
# Runs both backend and frontend test suites sequentially
development\scripts\test.bat
```

---

## 5. Continuous Integration (CI) Acceptance Gates

Every release build or pull request must pass the following four acceptance gates with zero exceptions:

| Gate # | Check / Command | Acceptance Criteria | Failure Action |
|:---:|---|---|---|
| **1** | `pytest tests/ --cov=app` | 0 failed tests; **>= 85% coverage** | Block release |
| **2** | `npm test` | 0 failed tests across all component tests | Block release |
| **3** | `npx vitest run src/test/zero_jargon.test.ts` | 0 jargon violations in user-facing strings | Block release |
| **4** | `npm run build` | Exits with code 0; **0 TypeScript errors** | Block release |

---

## 6. Next Steps

- To inspect production container deployment and database migrations, see [**15-Deployment-and-Operations.md**](./15-Deployment-and-Operations.md).
- For data analyst SQL queries and measure definitions, see [**16-Data-Analysis-Reference.md**](./16-Data-Analysis-Reference.md).
- For complete developer environment onboarding, see [**17-Developer-Guide.md**](./17-Developer-Guide.md).
