# Batanes Niche Job Portal - Testing Strategy & Contracts (Version 2)

This document specifies the **testing architecture, test contracts, execution instructions, and coverage requirements** for **Version 2** of the **Batanes Niche Job Portal**.

---

## 1. Core Testing Principles

1. **Root-Cause Fixes Over Patches**:
   - Zero tolerance for masking bugs (no silent `.catch(() => {})`, no loose `as any` type assertions, no dummy return bypasses).
   - Any API schema changes must be reflected synchronously across TypeScript interfaces and Prisma models.
2. **Deterministic Isolation**:
   - Backend services compile under strict TypeScript static analysis (`noImplicitAny`, `strictNullChecks`).
   - Frontend tests mock external network boundaries using Vitest and verify component behavior without reliance on live servers.
3. **Zero-Jargon Public UI Contract**:
   - Automated tests strictly forbid internal architecture terminology (`FastAPI`, `PostgreSQL`, `SQLAlchemy`, `Alembic`, `RBAC`, `Docker`, `WebSockets`) from rendering in user-facing views.

---

## 2. Backend Verification Suite

### Overview
- **Type Checker**: TypeScript 5.x (`tsc --noEmit`)
- **Database Validation**: Prisma ORM Client Schema Validation
- **Status**: **0 TypeScript errors, 100% build pass**.

### Running Backend Checks
```bash
# Type-check backend code
pnpm --filter batanes-niche-backend typecheck

# Verify production build compilation
pnpm --filter batanes-niche-backend build
```

---

## 3. Frontend Test Suite

### Overview
- **Framework**: `Vitest` 1.6.x + `jsdom`
- **Testing Library**: `@testing-library/react` + `@testing-library/jest-dom`
- **Status**: **Passing with 0 failures**.

### Test Modules

| Test File | Scope / Responsibilities |
|---|---|
| `frontend/src/test/JobCard.test.tsx` | Verifies job metadata rendering, formatted compensation, skills badges, bookmark button visibility for seekers, and suppression for employers. |
| `frontend/src/test/Navbar.test.tsx` | Verifies dynamic role-based navigation links for guests, authenticated job seekers, and authenticated employers. |
| `frontend/src/test/AuthContext.test.tsx` | Verifies login flow, token persistence, silent token refresh, user state hydration, and logout cleanup. |
| `frontend/src/test/zero_jargon.test.ts` | Static analysis audit that scans all `.tsx` and `.html` files to enforce zero internal technical jargon in the user-facing UI. |

### Running Frontend Tests
```bash
# Run all tests once
pnpm --filter batanes-niche-frontend test

# Run tests in watch mode
pnpm --filter batanes-niche-frontend exec vitest

# Run TypeScript typecheck & production build verification
pnpm --filter batanes-niche-frontend build
```

---

## 4. Acceptance Criteria & Continuous Integration

Every pull request or release tag must pass all of the following checks:
1. `pnpm typecheck` passes with **0 TypeScript errors**.
2. `pnpm test` passes across all component and zero-jargon tests.
3. `pnpm build` exits with code **0** across backend and frontend workspaces.
4. No secrets or credentials committed in the repository.