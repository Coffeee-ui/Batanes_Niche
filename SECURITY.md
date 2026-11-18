# Application Security & Governance Specification

This document details the security architecture, threat model mitigations, authentication mechanisms, and operational security policies implemented in the **Batanes Niche Job Portal**.

---

## 1. Authentication & Token Architecture

The platform implements a **dual-channel authentication model**:

```
+-----------------------------------------------------------------------------------------+
|                                    AUTHENTICATION ARCHITECTURE                          |
+-----------------------------------------------------------------------------------------+
|                                                                                         |
|  [CHANNEL 1: Public SPA API]                                                            |
|  - Short-Lived Access Token: JWT (HS256, 15-minute lifespan, stored in memory only)     |
|  - Long-Lived Refresh Token: High-entropy random string (7-day lifespan)                |
|  - Refresh Token Hashing: SHA-256 hashed before database persistence                   |
|  - Refresh Token Rotation: Single-use tokens; rotation invalidates prior token          |
|  - Token Compromise Detection: Re-use of revoked token immediately kills ALL sessions  |
|  - Access Token Revocation: JTI registered in `revoked_tokens` table upon logout         |
|                                                                                         |
|  [CHANNEL 2: Administrative SSR Portal]                                                 |
|  - Session Token: HMAC-SHA256 signed cookie (`batanes_admin_session`, 12-hour lifespan) |
|  - Cookie Security: HttpOnly=true, Secure=true (in production), SameSite=Lax            |
|  - CSRF Token: Random hex string in separate cookie (`batanes_admin_csrf`)              |
|  - Double-Submit CSRF: Compared via timing-safe equal comparison on state-modifications |
|                                                                                         |
+-----------------------------------------------------------------------------------------+
```

### In-Memory Access Token Storage
In accordance with OWASP recommendations, JWT access tokens are held strictly in JavaScript memory (`frontend/src/api/client.ts`) and never stored in `localStorage` or `sessionStorage`. If an access token expires (15 minutes), Axios transparently intercepts the 401 response and requests a new token pair using the stored refresh token.

---

## 2. Authorization & Role-Based Access Control (RBAC)

Every API endpoint enforces strict role boundaries:

| Role | Permissions & Access Scope | Restrictions |
|---|---|---|
| **Public Guest** | View active job previews (`GET /api/v1/jobs/preview`), view job details (`GET /api/v1/jobs/:id`), register, log in, request password reset OTP. | Cannot apply, save jobs, view applicant lists, or post jobs. |
| **Job Seeker** | Browse full job postings, manage seeker profile, upload/delete resume, submit applications, save jobs, receive notifications. | Cannot post jobs, cannot view other seekers' resumes, cannot access candidate search directory. |
| **Employer** | Create, edit, and archive job postings, view candidates in candidate directory, review applicants for own postings, change application statuses. | Cannot apply for jobs, cannot browse job seeker listings directly. |
| **Platform Administrator** | Access `/admin` portal: monitor real-time system metrics, manage users (activate, suspend), moderate job postings, review audit logs, inspect error incidents. | Completely separated from SPA token exchange. |

---

## 3. Password Hashing & Credential Handling

- **Algorithm**: `bcryptjs` using a minimum cost factor of 12 rounds.
- **Salt Generation**: Cryptographically random unique salt per password hash.
- **One-Time Passwords (OTP)**:
  - 6-digit numeric OTP generated using `crypto.randomInt(100000, 1000000)`.
  - Hashed with `bcryptjs` (10 rounds) before storing in `password_reset_tokens`.
  - Enforces a 15-minute expiration window and maximum 5 verification attempts.

---

## 4. Rate Limiting & Anti-Brute-Force Controls

Rate limiters protect authentication and public endpoints from credential stuffing and denial of service:

| Protected Endpoint | Window | Max Requests | Exceeded Action |
|---|---|---|---|
| `POST /api/v1/auth/login` | 60 seconds | 5 | Returns HTTP 429 (`Rate limit exceeded`) |
| `POST /admin/login` | 60 seconds | 5 | Returns HTTP 429 |
| `POST /api/v1/auth/register` | 60 seconds | 5 | Returns HTTP 429 |
| `POST /api/v1/auth/forgot-password` | 60 seconds | 3 | Returns HTTP 429 |
| `POST /api/v1/auth/reset-password` | 60 seconds | 5 | Returns HTTP 429 |
| `POST /api/v1/auth/demo-login` | 60 seconds | 10 | Returns HTTP 429 |

---

## 5. Input Validation, Injection Prevention & Sanitization

1. **SQL Injection Prevention**:
   - 100% of database interactions are executed through **Prisma ORM** using parameterized prepared statements. No raw string interpolation is permitted.
2. **Input Validation**:
   - All incoming API request bodies and query parameters are strictly validated using **Zod schemas** (`backend/src/schemas/`).
   - Unrecognized fields are stripped or rejected with HTTP 422.
3. **Log & Error Report Sanitization**:
   - `backend/src/middleware/errorHandler.ts` uses `sanitizeRequestBody()` to recursively redact sensitive fields (`password`, `password_hash`, `new_password`, `confirm_password`, `otp_code`, `token`, `secret`, `authorization`) before logging or recording to the `error_reports` table.

---

## 6. File Upload Security (Resume Verification)

Resume uploads (`POST /api/v1/users/resume`) implement defense-in-depth verification:
1. **File Extension Whitelist**: Only `.pdf` and `.docx` are accepted.
2. **Magic Byte / Signature Inspection**:
   - PDF files must start with magic bytes `%PDF` (`0x25, 0x50, 0x44, 0x46`).
   - DOCX files must start with ZIP container magic bytes `PK` (`0x50, 0x4B`).
3. **Payload Size Limit**: Maximum file size strictly enforced at **5 MB**.
4. **Filename Sanitization**: User-provided filenames are completely discarded on disk. Files are persisted using predictable random names: `resume_{userId}_{timestamp}.{ext}`.
5. **Access Control**: Resume downloads are accessible only by the resume owner, platform administrators, or employers reviewing an active application submitted by that candidate.

---

## 7. HTTP Security Headers

Express applies security headers via **Helmet** and custom middleware:
- **`X-Content-Type-Options: nosniff`**: Prevents MIME-sniffing exploits.
- **`X-Frame-Options: DENY`**: Protects against clickjacking.
- **`Strict-Transport-Security: max-age=31536000; includeSubDomains`**: Enforces HTTPS in production.
- **`Referrer-Policy: strict-origin-when-cross-origin`**: Protects referral URL privacy.
- **Content Security Policy (CSP)**: Protects administrative SSR against malicious script injection while allowing necessary admin styles.

---

## 8. Production Operational Security Checklist

- [ ] Rotate `JWT_SECRET_KEY` and `ADMIN_SESSION_SECRET` on Render if suspected compromised.
- [ ] Ensure `DEMO_MODE=false` in Render environment variables.
- [ ] Set `ALLOWED_ORIGINS` to the exact Vercel production domain; avoid wildcards (`*`).
- [ ] Ensure `ADMIN_INITIAL_PASSWORD` is removed or wiped from environment variables after initial database bootstrap.
- [ ] Periodically inspect the `audit_logs` table in the Admin Portal for suspicious login failures or privilege escalations.
