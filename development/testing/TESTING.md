# Batanes Niche Job Portal - Testing Strategy & Contracts (Version 2)

This document specifies the **testing architecture, test contracts, execution instructions, and coverage requirements** for **Version 2** of the **Batanes Niche Job Portal**.

---

## 1. Core Testing Principles

1. **Root-Cause Fixes Over Patches**:
   - Zero tolerance for masking bugs (no silent `.catch(() => {})`, no loose `as any` type assertions, no dummy return bypasses).
   - Any API schema changes must be reflected synchronously across both Pydantic models and TypeScript interfaces.
2. **Deterministic Isolation**:
   - Every backend test runs against an isolated async in-memory SQLite database (`sqlite+aiosqlite:///:memory:`) rebuilt per test transaction.
   - Frontend tests mock external network boundaries using Vitest and verify component behavior without reliance on live servers.
3. **Zero-Jargon Public UI Contract**:
   - Automated tests strictly forbid internal architecture terminology (`FastAPI`, `PostgreSQL`, `SQLAlchemy`, `Alembic`, `RBAC`, `Docker`, `WebSockets`) from rendering in user-facing views.

---

## 2. Backend Test Suite

### Overview
- **Framework**: `pytest` 8.x + `pytest-asyncio`
- **Coverage Tool**: `pytest-cov`
- **Target Coverage**: **>= 85%** across all domain services, repositories, and security modules.
- **Current Status**: **43 passed, 0 failures, 86% coverage**.

### Test Modules

| Test File | Scope / Responsibilities |
|---|---|
| `backend/tests/test_auth.py` | Registration, login, token refresh, invalid credentials, password hashing, and user profile retrieval. |
| `backend/tests/test_jobs.py` | Job creation, retrieval, updates, deletion, filtering by municipality, salary formatting, and employer authorization. |
| `backend/tests/test_applications.py` | Job application submission, duplicate prevention, status transitions (pending -> accepted/rejected), and seeker/employer scoping. |
| `backend/tests/test_recommendations.py` | Domain recommendation engine, Batanes residency weighting, skill match scoring, and candidate rankings. |
| `backend/tests/test_admin.py` | Jinja2 server-rendered admin portal, session cookies, role guards, user moderation, and audit logs. |
| `backend/tests/test_security.py` | Password complexity, JWT signature verification, token expiration, SQL injection safety, and path traversal prevention. |
| `backend/tests/test_services_coverage.py` | End-to-end domain services: `AuditService`, `NotificationService`, `MetaOptionsService`, `SavedJobsService`, and `AnalyticsService`. |

### Running Backend Tests
```bash
# Activate virtual environment
cd backend
.\venv\Scripts\activate

# Run full test suite with coverage report
pytest tests/ --cov=app --cov-report=term-missing --cov-report=html

# Run a specific test file
pytest tests/test_jobs.py -v
```

---

## 3. Frontend Test Suite

### Overview
- **Framework**: `Vitest` 1.6.x + `jsdom`
- **Testing Library**: `@testing-library/react` + `@testing-library/jest-dom`
- **Current Status**: **12 passed, 0 failures**.

### Test Modules

| Test File | Scope / Responsibilities |
|---|---|
| `frontend/src/test/JobCard.test.tsx` | Verifies job metadata rendering, formatted compensation, skills badges, bookmark button visibility for seekers, and suppression for employers. |
| `frontend/src/test/Navbar.test.tsx` | Verifies dynamic role-based navigation links for guests, authenticated job seekers, and authenticated employers. |
| `frontend/src/test/AuthContext.test.tsx` | Verifies login flow, token persistence, silent token refresh, user state hydration, and logout cleanup. |
| `frontend/src/test/zero_jargon.test.ts` | Static analysis audit that scans all `.tsx` and `.html` files to enforce zero internal technical jargon in the user-facing UI. |

### Running Frontend Tests
```bash
cd frontend

# Run all tests once
npm test

# Run tests in watch mode
npx vitest

# Run TypeScript typecheck & production build verification
npm run build
```

---

## 4. Acceptance Criteria & Continuous Integration

Every pull request or release tag must pass all of the following checks:
1. `pytest tests/ --cov=app` passes with **0 failures** and **>= 85% coverage**.
2. `npm run build` exits with code **0** and **0 TypeScript errors**.
3. `npm test` passes with **0 failures** across all component and zero-jargon tests.
4. No secrets or credentials committed in the repository.
