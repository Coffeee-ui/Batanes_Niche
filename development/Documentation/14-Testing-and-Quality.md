# 14 - Testing and Quality Assurance

## 1. Testing Philosophy & Core Principles

The **Batanes Niche Job Portal** enforces strict software quality guarantees through automated testing and static type validation across both backend services and frontend components.

### Core Testing Principles
1. **Root-Cause Verification**:
   - Zero tolerance for masking bugs or swallow-and-ignore patterns (no silent `.catch(() => {})`, no loose `as any` type bypasses, no dummy return values).
   - Any API schema change must be reflected synchronously across TypeScript interfaces and Prisma models.
2. **Deterministic Isolation**:
   - Backend services compile with strict TypeScript checks (`noImplicitAny`, `strictNullChecks`).
   - Frontend tests mock external network boundaries using Vitest and verify component behavior in a simulated DOM environment.
3. **Zero-Jargon Public Contract**:
   - Public-facing user interfaces strictly forbid internal system terminology (*FastAPI*, *PostgreSQL*, *JWT*, *SQLAlchemy*, *Alembic*, *Docker*, *WebSockets*).
   - Compliance is continuously validated via an automated static analysis audit (`zero_jargon.test.ts`).

---

## 2. Backend Type Safety & Verification

The TypeScript backend enforces type safety and schema validation via **TypeScript 5.x** and **Prisma ORM Client**:

- **Static Type Safety**: `pnpm --filter batanes-niche-backend typecheck` enforces 100% strict type validity across all controllers, services, repositories, and models.
- **Production Build Validation**: `pnpm --filter batanes-niche-backend build` compiles TypeScript to verified JavaScript in `backend/dist/`.
- **Database Schema Validation**: `pnpm --filter batanes-niche-backend prisma:generate` validates the Prisma schema against database constraints.

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

### 4.1 Running All Workspace Tests
```bash
# Run all tests across the workspace (Vitest suite)
pnpm test

# Run strict TypeScript type verification across all workspaces
pnpm typecheck
```

### 4.2 Running Backend Checks
```bash
# Verify backend TypeScript compilation and types
pnpm --filter batanes-niche-backend typecheck

# Build backend for production
pnpm --filter batanes-niche-backend build
```

### 4.3 Running Frontend Tests
```bash
# Run all frontend tests once
pnpm --filter batanes-niche-frontend test

# Run tests in interactive watch mode
pnpm --filter batanes-niche-frontend exec vitest

# Verify frontend production build
pnpm --filter batanes-niche-frontend build
```

### 4.4 Automated Windows Test Script
```cmd
# Runs both backend typecheck/build and frontend test suites sequentially
development\scripts\test.bat
```

---

## 5. Continuous Integration (CI) Acceptance Gates

Every release build or pull request must pass the following acceptance gates with zero exceptions:

| Gate # | Check / Command | Acceptance Criteria | Failure Action |
|:---:|---|---|---|
| **1** | `pnpm typecheck` | 0 TypeScript errors across backend and frontend | Block release |
| **2** | `pnpm test` | 0 failed tests across all Vitest suites | Block release |
| **3** | `pnpm --filter batanes-niche-frontend exec vitest run src/test/zero_jargon.test.ts` | 0 jargon violations in user-facing strings | Block release |
| **4** | `pnpm build` | Exits with code 0; successful production build | Block release |

---

## 6. Next Steps

- To inspect production container deployment and database migrations, see [**15-Deployment-and-Operations.md**](./15-Deployment-and-Operations.md).
- For data analyst SQL queries and measure definitions, see [**16-Data-Analysis-Reference.md**](./16-Data-Analysis-Reference.md).
- For complete developer environment onboarding, see [**17-Developer-Guide.md**](./17-Developer-Guide.md).