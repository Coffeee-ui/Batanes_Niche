# TypeScript Backend Migration Plan (`backend-ts/`)

## 1. Overview & Objective

Migrate the Batanes Niche backend from Python/FastAPI to TypeScript/Node.js in the new directory `backend-ts/` at the repository root.

### Core Mandates:
- **Zero Frontend Changes**: The frontend remains completely untouched (`frontend/`).
- **Bit-for-Bit API Contract Parity**: Same routes, HTTP methods, status codes (`201` for creations, `200` for reads/updates, `429` for rate limits, `422` for validation errors, `500` with `trace_id`), and `{ "detail": ... }` error schema.
- **Database Parity**: Replicate all 12 tables and constraints in Prisma, operating directly against SQLite (`backend/batanes_niche.db`) during development and PostgreSQL in production.
- **Strict Typing**: Zero implicit `any`, strict compiler options.

---

## 2. Technology Choices (Approved)

- **Web Framework**: Express.js 4.x
- **ORM**: Prisma ORM 5.x
- **Template Engine**: Nunjucks (for 1:1 Jinja2 template port in `/admin`)
- **Schema Validation**: Zod 3.x
- **Auth & Tokens**: `jsonwebtoken` (HS256) + `bcryptjs`
- **Rate Limiting**: `express-rate-limit`

---

## 3. Ordered Implementation Phases

### Phase A: Foundation & Setup
1. Create `backend-ts/` directory.
2. Initialize `package.json` with dependencies and scripts (`dev`, `build`, `start`, `test`).
3. Configure `tsconfig.json` (strict mode, NodeNext or CommonJS, noEmitOnError).
4. Create `.env` mirroring `backend/.env`.
5. Create Prisma schema (`prisma/schema.prisma`) matching all 12 tables and run `prisma generate`.

### Phase B: Core & Database Layers
1. `src/core/config.ts`: Environment validation via Zod.
2. `src/core/constants.ts`: Geographic lists, standard skills, education levels, employment types, business types.
3. `src/core/geography.ts`: Canonical Batanes hierarchy, transit matrices, distance score functions.
4. `src/core/security.ts`: JWT access & refresh token signing/verification, bcrypt hashing.
5. `src/database/client.ts`: PrismaClient singleton.

### Phase C: Repositories & Schemas
1. Repositories:
   - `userRepository.ts`
   - `jobRepository.ts`
   - `applicationRepository.ts`
   - `notificationRepository.ts`
   - `tokenRepository.ts` (refresh tokens, revoked tokens, password reset tokens)
   - `auditLogRepository.ts`
   - `errorReportRepository.ts`
2. Schemas & Serializers (Zod):
   - `auth.ts`, `user.ts`, `job.ts`, `application.ts`, `notification.ts`, `meta.ts`

### Phase D: Services Layer
1. `skillService.ts`: Skill normalization and exact matching.
2. `recommendationService.ts`: 70/30 deterministic scoring algorithm.
3. `authService.ts`: Registration, authentication, token rotation, logout, OTP reset.
4. `userService.ts`: Profile management, completeness scoring, candidate directory search.
5. `jobService.ts`: Job listings, public preview, CRUD, bookmarking.
6. `applicationService.ts`: Application lifecycle and employer status transition.
7. `notificationService.ts`: In-app notification creation and read state.
8. `auditService.ts`: Audit event logging.
9. `errorLoggingService.ts`: 500 error recording.
10. `emailService.ts`: OTP email dispatcher.

### Phase E: Middleware & API Routes
1. Middleware:
   - `logging.ts`: Structured JSON access logger.
   - `errorHandler.ts`: 500 handler with trace ID and incident capture.
   - `rateLimiter.ts`: Sliding window rate limits matching SlowAPI.
2. API Router (`/api/v1`):
   - `auth.ts` (9 endpoints)
   - `users.ts` (3 endpoints)
   - `jobs.ts` (7 endpoints)
   - `applications.ts` (3 endpoints)
   - `savedJobs.ts` (3 endpoints)
   - `recommendations.ts` (2 endpoints)
   - `notifications.ts` (2 endpoints)
   - `meta.ts` (1 endpoint)

### Phase F: Admin UI (Nunjucks SSR)
1. `admin/auth.ts`: Signed cookies & CSRF verification.
2. `admin/routes.ts`: 12 admin controller routes.
3. `templates/*.njk`: 7 Nunjucks templates ported from Jinja2.
4. Static assets mounting (`/admin/static`).

### Phase G: Server Entrypoint & Probes
1. `src/main.ts`: Express application setup, security headers, CORS, `/health`, `/ready`.
2. Static compilation check: `npx tsc --noEmit`.
3. Verification against database and React frontend.
