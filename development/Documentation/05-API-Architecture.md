# 05 - API Architecture

## 1. REST API Design Principles

The **Batanes Niche Job Portal** exposes a standard RESTful HTTP API mounted at `/api/v1`.

### Core Standards
1. **JSON Over HTTP**: All requests and responses exchange UTF-8 JSON payloads with `Content-Type: application/json`.
2. **Stateless Authentication**: Protected endpoints require an `Authorization: Bearer <access_token>` header containing a valid, signed JWT access token.
3. **Deterministic Status Codes**:
   - `200 OK`: Request succeeded with a response body.
   - `201 Created`: Resource successfully created (e.g., registration, job creation, application submission).
   - `204 No Content`: Resource deleted or state cleared with no response payload.
   - `400 Bad Request`: Validation failure, duplicate application, or invalid state transition.
   - `401 Unauthorized`: Missing, expired, blacklisted, or cryptographically invalid token.
   - `403 Forbidden`: Authenticated user lacks the necessary role or resource ownership.
   - `404 Not Found`: Target resource does not exist or has been soft-deleted.
   - `422 Unprocessable Entity`: Request body failed Pydantic schema validation.
   - `429 Too Many Requests`: Rate limit exceeded.
   - `500 Internal Server Error`: Unhandled server exception (sanitized; recorded to `error_reports`).
4. **Uniform Error Format**:
   ```json
   {
     "detail": "Descriptive, user-safe error message"
   }
   ```

---

## 2. Global Rate Limiting Architecture

Rate limits are enforced at the router layer using **SlowAPI** backed by in-memory token buckets:

| Endpoint Group | Default Limit | Purpose |
|---|---|---|
| `/api/v1/auth/login` | `5/minute` | Brute-force credential stuffing mitigation |
| `/api/v1/auth/register` | `5/minute` | Automated bot registration prevention |
| `/api/v1/auth/forgot-password` | `3/minute` | OTP dispatch spam prevention |
| `/api/v1/auth/reset-password` | `5/minute` | OTP brute-force defense |
| Standard Read Endpoints | `60/minute` | General API availability protection |
| Mutation Endpoints | `30/minute` | Write throttling |

---

## 3. Complete API Endpoint Catalog

### 3.1 Authentication Router (`/api/v1/auth`)

| Method | Path | Auth | Role | Request Schema | Response Schema | Status | Description & Rules |
|---|---|---|---|---|---|---|---|
| `POST` | `/api/v1/auth/register` | None | Public | `UserRegister` | `Token` + User | `201`, `400` | Registers `job_seeker` or `employer`. Validates location against canonical geography. Issues initial access + refresh tokens. |
| `POST` | `/api/v1/auth/login` | None | Public | `UserLogin` | `Token` | `200`, `401`, `403` | Verifies credentials with bcrypt. Rejects suspended accounts. Returns JWT access token + rotating refresh token. |
| `POST` | `/api/v1/auth/refresh` | None | Public | `TokenRefreshRequest` | `Token` | `200`, `401` | Rotates refresh token. Implements compromise detection (revoked token presentation invalidates all user sessions). |
| `POST` | `/api/v1/auth/logout` | Bearer | Any | `LogoutRequest` (optional) | `{"detail": "..."}` | `200`, `401` | Blacklists access token JTI in `revoked_tokens` and marks refresh token revoked. |
| `POST` | `/api/v1/auth/forgot-password` | None | Public | `ForgotPasswordRequest` | `{"detail": "..."}` | `200` | Dispatches 6-digit OTP via email. Returns generic 200 to prevent user enumeration. |
| `POST` | `/api/v1/auth/reset-password` | None | Public | `ResetPasswordRequest` | `{"detail": "..."}` | `200`, `400` | Verifies bcrypt-hashed OTP (max 5 attempts), updates password, and revokes all active refresh tokens. |
| `GET` | `/api/v1/auth/me` | Bearer | Any | None | `PrivateUserProfile` | `200`, `401` | Returns authenticated user identity, role, profile details, and profile completeness score. |

### 3.2 Users Router (`/api/v1/users`)

| Method | Path | Auth | Role | Request Schema | Response Schema | Status | Description & Rules |
|---|---|---|---|---|---|---|---|
| `GET` | `/api/v1/users/profile` | Bearer | Any | None | `PrivateUserProfile` | `200`, `401` | Retrieves full private profile with contact info and 100-point completeness score. |
| `PUT` | `/api/v1/users/profile` | Bearer | Any | `UserProfileUpdate` | `PrivateUserProfile` | `200`, `400`, `401` | Updates profile attributes. Validates municipality/barangay against canonical geography if changed. |
| `GET` | `/api/v1/users/job-seekers` | Bearer | Employer, Admin | Query: `query`, `skills`, `municipality`, `limit`, `offset` | `List[PublicJobSeekerSummary]` | `200`, `401`, `403` | Sanitized candidate directory. Email and phone number are strictly omitted to protect applicant privacy. |

### 3.3 Jobs Router (`/api/v1/jobs`)

| Method | Path | Auth | Role | Request Schema | Response Schema | Status | Description & Rules |
|---|---|---|---|---|---|---|---|
| `GET` | `/api/v1/jobs` | Optional | Public | Query: `query`, `municipality`, `employment_type`, `salary_min`, `limit`, `offset` | `List[JobOut]` | `200` | Retrieves active, non-deleted job vacancies (`status = 'active' AND deleted_at IS NULL`). |
| `GET` | `/api/v1/jobs/{id}` | Optional | Public | Path: `id` | `JobOut` | `200`, `404` | Retrieves details of a specific job listing. |
| `POST` | `/api/v1/jobs` | Bearer | Employer | `JobCreate` | `JobOut` | `201`, `400`, `403` | Creates a new vacancy. Validates location against canonical geography. |
| `PUT` | `/api/v1/jobs/{id}` | Bearer | Employer | Path: `id`, Body: `JobUpdate` | `JobOut` | `200`, `403`, `404` | Updates an existing vacancy. Enforces ownership check (`job.employer_id == user.id`). |
| `DELETE` | `/api/v1/jobs/{id}` | Bearer | Employer | Path: `id` | `{"detail": "..."}` | `200`, `403`, `404` | Soft-deletes a vacancy by setting `deleted_at = utcnow()`. Enforces ownership. |
| `GET` | `/api/v1/jobs/my` | Bearer | Employer | Query: `limit`, `offset` | `List[JobOut]` | `200`, `403` | Lists all vacancies owned by the authenticated employer (active and closed, excluding deleted). |

### 3.4 Applications Router (`/api/v1/applications`)

| Method | Path | Auth | Role | Request Schema | Response Schema | Status | Description & Rules |
|---|---|---|---|---|---|---|---|
| `POST` | `/api/v1/applications` | Bearer | Job Seeker | `ApplicationCreate` | `SeekerApplicationOut` | `201`, `400`, `403` | Submits application. Prevents duplicates. Atomically creates employer notification. |
| `GET` | `/api/v1/applications` | Bearer | Seeker / Employer | Query: `limit`, `offset` | `List[Union[SeekerAppOut, EmployerAppOut]]` | `200`, `401` | Role-filtered: Seekers get submitted apps with job info; Employers get received apps with authorized contact info. |
| `PATCH` | `/api/v1/applications/{id}/status` | Bearer | Employer | Path: `id`, Body: `ApplicationUpdate` | `EmployerApplicationOut` | `200`, `400`, `403`, `404` | Transitions status (`pending` <-> `accepted`/`rejected`). Atomically creates seeker notification. Enforces ownership. |

### 3.5 Recommendations Router (`/api/v1/recommendations`)

| Method | Path | Auth | Role | Request Schema | Response Schema | Status | Description & Rules |
|---|---|---|---|---|---|---|---|
| `GET` | `/api/v1/recommendations/candidates` | Bearer | Employer | Query: `job_id`, `limit` | `CandidateRankingResponse` | `200`, `403`, `404` | Ranks candidates against specified job using deterministic two-tier formula (70 skill / 30 geo). Ownership enforced. |
| `GET` | `/api/v1/recommendations/jobs-ranked` | Bearer | Job Seeker | Query: `limit` | `JobRankingResponse` | `200`, `403` | Ranks available vacancies for authenticated seeker using two-tier formula based on profile skills and municipality. |

### 3.6 Saved Jobs Router (`/api/v1/saved-jobs`)

| Method | Path | Auth | Role | Request Schema | Response Schema | Status | Description & Rules |
|---|---|---|---|---|---|---|---|
| `GET` | `/api/v1/saved-jobs` | Bearer | Job Seeker | Query: `limit`, `offset` | `List[SavedJobOut]` | `200`, `403` | Retrieves vacancies bookmarked by authenticated job seeker. |
| `POST` | `/api/v1/saved-jobs` | Bearer | Job Seeker | `SavedJobCreate` | `SavedJobOut` | `201`, `400`, `403` | Bookmarks a vacancy. Prevents duplicate bookmarks via `uq_saved_jobs_user_job`. |
| `DELETE` | `/api/v1/saved-jobs/{id}` | Bearer | Job Seeker | Path: `id` | `{"detail": "..."}` | `200`, `403`, `404` | Removes a bookmarked vacancy. Ownership enforced. |

### 3.7 Notifications Router (`/api/v1/notifications`)

| Method | Path | Auth | Role | Request Schema | Response Schema | Status | Description & Rules |
|---|---|---|---|---|---|---|---|
| `GET` | `/api/v1/notifications` | Bearer | Any | Query: `limit`, `offset` | `List[NotificationOut]` | `200`, `401` | Retrieves in-app notifications for authenticated user sorted by `created_at DESC`. |
| `POST` | `/api/v1/notifications/read` | Bearer | Any | None | `{"detail": "..."}` | `200`, `401` | Marks all unread notifications as read (`is_read = True`) for authenticated user. |

### 3.8 Metadata & Reference Router (`/api/v1/meta`)

| Method | Path | Auth | Role | Request Schema | Response Schema | Status | Description & Rules |
|---|---|---|---|---|---|---|---|
| `GET` | `/api/v1/meta/options` | None | Public | None | `MetadataOptions` | `200` | Returns canonical islands, municipalities, barangays, employment types, and curated skill badges. |

### 3.9 System Probes (`/health`, `/ready`)

| Method | Path | Auth | Role | Request Schema | Response Schema | Status | Description & Rules |
|---|---|---|---|---|---|---|---|
| `GET` | `/health` | None | Public | None | `{"status": "healthy"}` | `200` | Liveness probe verifying HTTP gateway responsiveness. |
| `GET` | `/ready` | None | Public | None | `{"status": "ready", "database": "connected"}` | `200`, `503` | Readiness probe executing an active SQL check (`SELECT 1`) against the database. |

---

## 4. Query Parameter & Pagination Specifications

Standard pagination uses `limit` and `offset`:
- `limit`: Integer, default `50`, maximum `100`.
- `offset`: Integer, default `0`.

Job catalog filters:
- `query`: String (matches substring in title, description, or required skills).
- `municipality`: String (exact match against canonical municipality).
- `employment_type`: String (`Full-time`, `Part-time`, `Contract`, `Seasonal`, `Internship`).
- `salary_min`: Float (filters for jobs with `salary_max >= salary_min` or `salary_min >= salary_min`).

---

## 5. Explicit Non-Existent APIs (Out-of-Scope Notice)

The following endpoints do **not** exist in Version 2 and must not be called:
- `POST /api/v1/chat/*` (No direct messaging or chat endpoints).
- `GET /api/v1/ws/*` (No WebSocket connections).
- `POST /api/v1/sync/*` (No offline synchronization or batch upload endpoints).

---

## 6. Next Steps

- For token formats, cryptographic hashing, and security guards, see [**06-Authentication-and-Security.md**](./06-Authentication-and-Security.md).
- For role capability boundaries and row ownership validation, see [**07-User-Roles-and-Permissions.md**](./07-User-Roles-and-Permissions.md).
- For complete end-to-end API interaction sequences, see [**08-Business-Workflows.md**](./08-Business-Workflows.md).
