# API Reference – Batanes Niche Job Portal v2.0

**Base URL (Production):** `https://batanes-niche-backend.onrender.com`  
**Base URL (Local Dev):** `http://localhost:8000`  
**API Version Prefix:** `/api/v1`  
**Authentication:** Bearer JWT (Authorization header) for SPA endpoints; Signed HttpOnly session cookie (`batanes_admin_session`) for Admin SSR.

---

## Authentication Conventions

| Header | Value | Notes |
|---|---|---|
| `Authorization` | `Bearer <access_token>` | 15-minute JWT (HS256). Do not persist in localStorage. |
| `Content-Type` | `application/json` | Required for POST/PUT request bodies. |
| `X-Trace-ID` | `<uuid>` | Optional request correlation ID. |

**Token Lifecycle:**
- Access Token: 15-minute lifespan, stored in memory only.
- Refresh Token: 7-day lifespan, single-use rotation, hashed (SHA-256) in `refresh_tokens` table.
- OTP (Password Reset): 6-digit numeric, 15-minute expiry, max 5 attempts, bcrypt-hashed.

---

## Authentication Endpoints (`/auth`)

| Endpoint | Method | Auth Required | Description |
|---|---|---|---|
| `/api/v1/auth/register` | POST | None | Register new seeker or employer account. Rate limited: 5 req/60s. |
| `/api/v1/auth/login` | POST | None | Authenticate with username/password. Returns JWT pair. Rate limited: 5 req/60s. |
| `/api/v1/auth/refresh` | POST | None (refresh_token in body) | Rotate refresh token. Returns new access + refresh tokens. |
| `/api/v1/auth/logout` | POST | Bearer JWT | Revoke access token (JTI blocklist) + all refresh tokens. |
| `/api/v1/auth/forgot-password` | POST | None | Request 6-digit OTP to registered email. Rate limited: 3 req/60s. |
| `/api/v1/auth/reset-password` | POST | None | Submit OTP + new password. Rate limited: 5 req/60s. |
| `/api/v1/auth/me` | GET | Bearer JWT | Return authenticated user's profile object. |
| `/api/v1/auth/demo-status` | GET | None | Check if demo mode is active. Returns role options. |
| `/api/v1/auth/demo-login` | POST | None | 1-click demo login (seeker/employer). Rate limited: 10 req/60s. Only active when DEMO_MODE=true. |

### Request Bodies

**POST /auth/register**
```json
{
  "username": "string (3–30 chars, alphanumeric+underscore)",
  "email": "string (valid email)",
  "password": "string (8+ chars)",
  "full_name": "string",
  "role": "job_seeker | employer",
  "municipality": "Basco | Mahatao | Ivana | Uyugan | Sabtang | Itbayat",
  "barangay": "string (optional)",
  "phone_number": "string (optional)"
}
```

**POST /auth/login**
```json
{
  "username": "string (username or email)",
  "password": "string"
}
```

**POST /auth/refresh**
```json
{ "refresh_token": "string" }
```

**POST /auth/forgot-password**
```json
{ "email": "string" }
```

**POST /auth/reset-password**
```json
{
  "email": "string",
  "otp_code": "string (6-digit)",
  "new_password": "string (8+ chars)"
}
```

**POST /auth/demo-login**
```json
{ "role": "job_seeker | employer" }
```

---

## Users Endpoints (`/users`)

| Endpoint | Method | Auth Required | Role | Description |
|---|---|---|---|---|
| `/api/v1/users/profile` | GET | Bearer JWT | Any | Get own private profile. |
| `/api/v1/users/profile` | PUT | Bearer JWT | Any | Update profile fields. Zod-validated. |
| `/api/v1/users/job-seekers` | GET | Bearer JWT | Employer only | Search/browse candidate directory. Query: `municipality`, `island`, `skill`, `limit`, `offset`. |
| `/api/v1/users/resume` | POST | Bearer JWT | Job Seeker | Upload resume (PDF/DOCX, max 5MB). Magic-byte validated. Multipart form-data. |
| `/api/v1/users/resume` | DELETE | Bearer JWT | Job Seeker (own) | Delete own resume file + clear resume_url. |
| `/api/v1/users/resume` | GET | Bearer JWT | Owner / Admin / Employer (applicant) | Download own resume. |
| `/api/v1/users/resume/:userId` | GET | Bearer JWT | Owner / Admin / Employer (applicant) | Download resume by user ID. Access-controlled. |

---

## Jobs Endpoints (`/jobs`)

| Endpoint | Method | Auth Required | Role | Description |
|---|---|---|---|---|
| `/api/v1/jobs/preview` | GET | None | Public | List active job preview cards (truncated). Query: `limit`, `offset`. |
| `/api/v1/jobs` | GET | Optional | Seeker / Guest | List active jobs. Full data for authenticated seekers, preview for guests. Query: `municipality`, `island`, `keyword`/`q`, `employment_type`, `category`, `sort` (newest/salary_desc/salary_asc), `limit`, `offset`. X-Total-Count header. |
| `/api/v1/jobs` | POST | Bearer JWT | Employer | Create job posting. Body: JobCreateSchema. |
| `/api/v1/jobs/my` | GET | Bearer JWT | Employer | List own postings. Query: `include_closed`, `limit`, `offset`. |
| `/api/v1/jobs/:jobId` | GET | Optional | Public / Seeker / Employer | Get job by ID. Public access allowed. |
| `/api/v1/jobs/:jobId` | PUT | Bearer JWT | Employer (owner) | Update job posting. Body: JobUpdateSchema. |
| `/api/v1/jobs/:jobId` | DELETE | Bearer JWT | Employer (owner) | Soft-delete (archive) job. Sets status=closed, deleted_at=now. |

---

## Applications Endpoints (`/applications`)

| Endpoint | Method | Auth Required | Role | Description |
|---|---|---|---|---|
| `/api/v1/applications` | POST | Bearer JWT | Job Seeker | Submit application. Body: `{ job_id, cover_letter?, resume_url? }`. Triggers notifications to seeker + employer. |
| `/api/v1/applications` | GET | Bearer JWT | Seeker or Employer | List own applications (seeker) or applicants for own jobs (employer). Query: `job_id`, `limit`, `offset`. |
| `/api/v1/applications/:appId` | PUT | Bearer JWT | Employer (owner) | Update application status (pending → accepted/rejected). Triggers notification to seeker. |
| `/api/v1/applications/:appId/withdraw` | POST | Bearer JWT | Seeker or Employer | Withdraw application. Seeker may withdraw their own; employer may close. |

---

## Saved Jobs Endpoints (`/saved-jobs`)

| Endpoint | Method | Auth Required | Role | Description |
|---|---|---|---|---|
| `/api/v1/saved-jobs` | GET | Bearer JWT | Job Seeker | List bookmarked jobs. |
| `/api/v1/saved-jobs/:jobId` | POST | Bearer JWT | Job Seeker | Bookmark a job. |
| `/api/v1/saved-jobs/:jobId` | DELETE | Bearer JWT | Job Seeker | Remove a bookmark. |

---

## Recommendations Endpoints (`/recommendations`)

| Endpoint | Method | Auth Required | Role | Description |
|---|---|---|---|---|
| `/api/v1/recommendations/candidates` | GET | Bearer JWT | Employer | Rank job seekers by skill match (0–70 pts) + geographic proximity (0–30 pts). Query: `municipality`, `barangay`, `skills`, `limit`. Returns `{ tier_1: [...scored], tier_2: [...unscored] }`. |
| `/api/v1/recommendations/jobs-ranked` | GET | Bearer JWT | Job Seeker | Rank active jobs for the authenticated seeker using same scoring formula. Query: `limit`. Returns `{ tier_1: [...scored], tier_2: [...unscored] }`. |

---

## Notifications Endpoints (`/notifications`)

| Endpoint | Method | Auth Required | Role | Description |
|---|---|---|---|---|
| `/api/v1/notifications` | GET | Bearer JWT | Any | List own notifications (newest first). Query: `limit`. |
| `/api/v1/notifications/read` | PUT | Bearer JWT | Any | Mark all notifications as read. |
| `/api/v1/notifications/:id/read` | PUT | Bearer JWT | Any | Mark single notification as read. |

---

## Meta / Reference Data Endpoints (`/meta`)

| Endpoint | Method | Auth Required | Description |
|---|---|---|---|
| `/api/v1/meta/options` | GET | None | Return canonical reference data: geography hierarchy, municipalities, skills list, education levels, employment types, business types. |

---

## System Health Endpoints

| Endpoint | Method | Description |
|---|---|---|
| `/health` | GET | Liveness probe. Returns `{ status: "healthy", timestamp, app, version }`. |
| `/ready` | GET | Readiness probe. Verifies database connectivity. Returns `{ status: "ready", database: "connected", provider: "postgresql|sqlite" }` or HTTP 503. |

---

## Admin SSR Endpoints (`/admin`)

> All admin endpoints use Nunjucks server-rendered HTML. Session authentication via `batanes_admin_session` signed cookie. CSRF token required for all state-modifying POST actions.

| Endpoint | Method | Auth | Description |
|---|---|---|---|
| `/admin/login` | GET | None | Render login page. |
| `/admin/login` | POST | None | Authenticate admin. Rate limited: 5 req/60s. Sets session + CSRF cookies. |
| `/admin/logout` | POST | Session | Destroy session. Clears cookies. |
| `/admin/dashboard` | GET | Session | System metrics: user count, active jobs, applications, recent audit logs. |
| `/admin/users` | GET | Session | List users. Query: `q` (search), `role`, `status`. |
| `/admin/users/:userId/suspend` | POST | Session + CSRF | Suspend user, revoke all refresh tokens. |
| `/admin/users/:userId/restore` | POST | Session + CSRF | Restore suspended user. |
| `/admin/jobs` | GET | Session | List all jobs (admin view). Query: `status`. |
| `/admin/jobs/:jobId/disable` | POST | Session + CSRF | Disable job listing. |
| `/admin/jobs/:jobId/restore` | POST | Session + CSRF | Restore disabled job listing. |
| `/admin/error-reports` | GET | Session | View 500 error incidents (last 100). |
| `/admin/audit-logs` | GET | Session | View append-only audit trail (last 100 entries). |

---

## Standard Error Responses

| HTTP Status | Meaning |
|---|---|
| `200` | Success |
| `201` | Created |
| `400` | Bad Request (validation failure) |
| `401` | Unauthorized (missing/invalid JWT) |
| `403` | Forbidden (insufficient role permissions) |
| `404` | Not Found |
| `409` | Conflict (e.g., duplicate application) |
| `422` | Unprocessable Entity (Zod validation failure) |
| `429` | Too Many Requests (rate limit exceeded) |
| `500` | Internal Server Error (logged to error_reports) |
| `503` | Service Unavailable (database not ready) |

**Error Response Body:**
```json
{
  "message": "Human-readable error description"
}
```

---

## Rate Limiting Summary

| Endpoint | Window | Max Requests |
|---|---|---|
| POST /auth/login | 60s | 5 |
| POST /admin/login | 60s | 5 |
| POST /auth/register | 60s | 5 |
| POST /auth/forgot-password | 60s | 3 |
| POST /auth/reset-password | 60s | 5 |
| POST /auth/demo-login | 60s | 10 |

> **Never expose credentials, tokens, API keys, or secret values in this document.** All sensitive configuration must be stored securely in environment variables.
