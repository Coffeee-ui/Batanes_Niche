# Security Analysis – Batanes Niche Job Portal v2.0

**Analysis Date:** 2026-11-18  
**Analyst:** Automated documentation analysis based on actual source code inspection.

---

## 1. Authentication Architecture

### 1.1 Dual-Channel Authentication Model

The platform implements two completely independent authentication channels:

#### Channel 1: Public SPA REST API (JWT)
| Property | Implementation | Status |
|---|---|---|
| Access Token Format | JWT (HS256) | ✅ Implemented |
| Access Token Lifespan | 15 minutes | ✅ Implemented |
| Access Token Storage | In-memory only (JavaScript variable in AuthContext) | ✅ Implemented |
| Refresh Token Format | High-entropy random string | ✅ Implemented |
| Refresh Token Lifespan | 7 days | ✅ Implemented |
| Refresh Token Hashing | SHA-256 before database persistence | ✅ Implemented |
| Refresh Token Rotation | Single-use; rotation invalidates prior token | ✅ Implemented |
| Reuse Detection | Re-use of revoked token kills all sessions | ✅ Implemented |
| Access Token Revocation | JTI registered in `revoked_tokens` table on logout | ✅ Implemented |

#### Channel 2: Administrative SSR Portal (Session Cookie)
| Property | Implementation | Status |
|---|---|---|
| Session Token | HMAC-SHA256 signed cookie | ✅ Implemented |
| Cookie Name | `batanes_admin_session` | ✅ Implemented |
| Cookie Options | HttpOnly=true, Secure=true (production), SameSite=Lax | ✅ Implemented |
| Session Lifespan | 12 hours | ✅ Implemented |
| CSRF Token | Random hex in `batanes_admin_csrf` cookie | ✅ Implemented |
| CSRF Verification | Double-submit pattern, timing-safe comparison | ✅ Implemented |

---

## 2. Authorization and RBAC

### 2.1 Role Definitions

| Role | Storage Value | Access Scope |
|---|---|---|
| Guest (unauthenticated) | N/A | Browse active job previews; register; login; forgot-password |
| Job Seeker | `job_seeker` | Browse jobs; manage profile + resume; apply; save jobs; notifications |
| Employer | `employer` | Post/edit/archive jobs; view candidates; manage applications |
| Administrator | `admin` | SSR admin portal only; no frontend SPA access |

### 2.2 Middleware Enforcement (`backend/src/api/deps.ts`)

| Middleware | Purpose | Status |
|---|---|---|
| `requireAuthenticated` | Verify Bearer JWT, attach user to request | ✅ Implemented |
| `requireEmployerContext` | Enforce employer role after authentication | ✅ Implemented |
| `requireJobSeekerContext` | Enforce job_seeker role after authentication | ✅ Implemented |
| `authenticateOptional` | Attach user if token present, allow guest access | ✅ Implemented |
| `requireAdminSession` | Verify admin session cookie, redirect to login | ✅ Implemented |

---

## 3. Password and Credential Handling

| Mechanism | Implementation | Status |
|---|---|---|
| Password Hashing Algorithm | bcryptjs | ✅ Implemented |
| bcrypt Cost Factor | 12 rounds (login/register) | ✅ Implemented |
| OTP Hashing | bcryptjs 10 rounds | ✅ Implemented |
| OTP Generation | `crypto.randomInt(100000, 1000000)` | ✅ Implemented |
| OTP Expiry | 15 minutes | ✅ Implemented |
| OTP Max Attempts | 5 (tracked in `attempts_count` column) | ✅ Implemented |
| Salt Generation | Cryptographically unique per password | ✅ Implemented (bcrypt built-in) |

---

## 4. Rate Limiting

| Endpoint | Window | Max Requests | Implementation |
|---|---|---|---|
| `POST /api/v1/auth/login` | 60s | 5 | `loginLimiter` (express-rate-limit) |
| `POST /admin/login` | 60s | 5 | `loginLimiter` |
| `POST /api/v1/auth/register` | 60s | 5 | `registerLimiter` |
| `POST /api/v1/auth/forgot-password` | 60s | 3 | `forgotPasswordLimiter` |
| `POST /api/v1/auth/reset-password` | 60s | 5 | `resetPasswordLimiter` |
| `POST /api/v1/auth/demo-login` | 60s | 10 | `demoLoginLimiter` |

All rate limit responses: HTTP 429 `{ "detail": "Rate limit exceeded. Please try again shortly." }`

---

## 5. Input Validation

| Mechanism | Implementation | Status |
|---|---|---|
| Request body validation | Zod schemas (`backend/src/schemas/`) | ✅ Implemented |
| Unrecognized field stripping | Zod `.parse()` with `strip` mode | ✅ Implemented |
| SQL injection prevention | Prisma ORM — 100% parameterized queries | ✅ Implemented |
| Sort parameter whitelist | Explicit allowlist: `['newest', 'salary_desc', 'salary_asc']` | ✅ Implemented |

---

## 6. File Upload Security

Endpoint: `POST /api/v1/users/resume`

| Control | Implementation | Status |
|---|---|---|
| Extension whitelist | Only `.pdf` and `.docx` accepted | ✅ Implemented |
| Magic byte verification | PDF: `%PDF` (0x25,0x50,0x44,0x46), DOCX: `PK` (0x50,0x4B) | ✅ Implemented |
| Maximum file size | 5 MB | ✅ Implemented |
| Filename sanitization | User filename discarded; stored as `resume_{userId}_{timestamp}.{ext}` | ✅ Implemented |
| Access control | Owner / Admin / Employer (applicant only) | ✅ Implemented |

---

## 7. HTTP Security Headers

| Header | Value | Mechanism | Status |
|---|---|---|---|
| `X-Content-Type-Options` | `nosniff` | Custom middleware | ✅ Implemented |
| `X-Frame-Options` | `DENY` | Custom middleware | ✅ Implemented |
| `Strict-Transport-Security` | `max-age=31536000; includeSubDomains` (production only) | Custom middleware | ✅ Implemented |
| `Content-Security-Policy` | `default-src 'self'`, configured for admin SSR | Helmet | ✅ Implemented |
| `Referrer-Policy` | `strict-origin-when-cross-origin` | Helmet | ✅ Implemented |
| `Cross-Origin-Resource-Policy` | `cross-origin` | Helmet | ✅ Implemented |

---

## 8. CORS Configuration

| Property | Configuration | Status |
|---|---|---|
| Allowed Origins | `ALLOWED_ORIGINS` env variable (JSON array, no wildcards in production) | ✅ Implemented |
| Allowed Methods | GET, POST, PUT, DELETE, OPTIONS | ✅ Implemented |
| Allowed Headers | Content-Type, Authorization, X-Trace-ID, Accept | ✅ Implemented |
| Credentials | `credentials: true` | ✅ Implemented |

---

## 9. Error Handling and Log Sanitization

| Mechanism | Implementation | Status |
|---|---|---|
| Global error handler | `backend/src/middleware/errorHandler.ts` | ✅ Implemented |
| Sensitive field redaction | `sanitizeRequestBody()` — redacts: password, password_hash, new_password, confirm_password, otp_code, token, secret, authorization | ✅ Implemented |
| Error persistence | Sanitized errors logged to `error_reports` table | ✅ Implemented |
| Stack traces in production | Suppressed in production mode | ✅ Implemented |

---

## 10. Audit Logging

| Event Logged | Status |
|---|---|
| `ADMIN_LOGIN_SUCCESS` | ✅ Implemented |
| `ADMIN_LOGIN_FAILURE` | ✅ Implemented |
| `ADMIN_LOGIN_FAILURE_SUSPENDED` | ✅ Implemented |
| `ADMIN_LOGOUT` | ✅ Implemented |
| `USER_SUSPEND` | ✅ Implemented |
| `USER_RESTORE` | ✅ Implemented |
| `JOB_DISABLE` | ✅ Implemented |
| `JOB_RESTORE` | ✅ Implemented |

Audit logs are **append-only** (no delete endpoint) and store: timestamp, actor_id, actor_role, IP address, action, target type, target ID, and details JSON.

---

## 11. Identified Gaps and Recommendations

| Gap | Severity | Recommendation |
|---|---|---|
| Resume storage ephemeral on Render | Medium | Migrate to Supabase Storage, S3, or Cloudflare R2. The codebase already notes this explicitly. |
| No rate limiting on general API endpoints | Low | Consider adding global API rate limiting (e.g., 100 req/min per IP) using express-rate-limit. |
| `DIRECT_URL` credential exposure risk | Medium | Rotate Supabase direct connection credentials after schema push. Use separate DB roles for ORM vs migrations. |
| No explicit account lockout (login) | Low | Rate limiter provides brute-force protection. Consider adding temporary lockout after N failed attempts as defense-in-depth. |
| DEMO_MODE in production | High | Strictly enforce `DEMO_MODE=false` in Render production environment. Demo credentials are well-known. |
