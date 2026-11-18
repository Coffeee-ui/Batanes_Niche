# Environment Variables Reference Guide

This document provides a comprehensive specification of all environment variables used by the **Batanes Niche Job Portal** across the Frontend (Vercel), Backend (Render), and Database (Supabase).

---

## 1. How to Generate Cryptographic Secrets

For production deployment, never use development default values. Generate high-entropy 64-character hex strings:

```bash
# Using OpenSSL (Linux, macOS, Git Bash, WSL)
openssl rand -hex 32

# Using Node.js (Windows PowerShell / Command Prompt / Any OS)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## 2. Backend Environment Variables (Configured on Render)

These variables must be populated in the **Render Dashboard -> Web Service -> Environment** tab.

| Variable | Required | Default / Dev Fallback | Where Set | Description |
|---|---|---|---|---|
| `NODE_ENV` | Yes | `development` | Render | Set to `production` in production. Optimizes Express performance and error behavior. |
| `ENVIRONMENT` | Yes | `development` | Render | Application environment: `development` or `production`. Controls demo mode, strict secrets, and HTTPS cookies. |
| `DEBUG` | No | `true` | Render | Boolean (`true` or `false`). Set to `false` in production to suppress internal query debug logs. |
| `PORT` | Yes | `8000` | Render | Server listening port. On Render, automatically set to `10000`. |
| `APP_NAME` | No | `Batanes Niche Job Portal` | Render | Application brand name used in logs, emails, and health checks. |
| `BASE_URL` | Yes | `http://localhost:8000` | Render | Public HTTPS root URL of the deployed backend service (e.g. `https://batanes-niche-backend.onrender.com`). |
| `DEMO_MODE` | No | `false` in prod | Render | Controls 1-click test logins (`ivatan_guide`, `batanes_inn`). **Must be `false` in production.** |
| `DB_PROVIDER` | Yes | `sqlite` in dev | Render | Database dialect: `postgres` for Supabase, `sqlite` for local dev. |
| `DATABASE_URL` | Yes | Local SQLite file path | Render | Primary database connection string. On Supabase, use the **Transaction Pooler URL** (port `6543`) with `?pgbouncer=true`. |
| `DIRECT_URL` | Yes | Empty | Render | Supabase **Direct Connection URL** (port `5432`). Required for Prisma schema pushes and migration execution. |
| `DB_POOL_MIN` | No | `2` | Render | Minimum database connection pool size. |
| `DB_POOL_MAX` | No | `10` | Render | Maximum database connection pool size per instance. |
| `DB_TIMEOUT_SEC` | No | `30` | Render | Connection timeout in seconds. |
| `DB_SSL` | No | `false` | Render | Enforce explicit SSL if connection string lacks SSL mode parameters. |
| `UPLOAD_DIR` | No | `uploads/resumes` | Render | Absolute or relative path for uploaded resume documents. When using Render Persistent Disk, set to `/var/data/uploads`. |
| `JWT_SECRET_KEY` | **CRITICAL** | Dev placeholder | Render | Secret key for signing and verifying user access JWTs. **Minimum 64 characters.** Process fails startup if default placeholder is detected in production. |
| `JWT_ALGORITHM` | No | `HS256` | Render | Cryptographic algorithm for JWT signing (`HS256`). |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | No | `15` | Render | Lifespan of short-lived JWT access tokens in minutes (default: 15 min). |
| `REFRESH_TOKEN_EXPIRE_DAYS` | No | `7` | Render | Lifespan of rotating refresh tokens in days (default: 7 days). |
| `ADMIN_SESSION_SECRET` | **CRITICAL** | Dev placeholder | Render | HMAC-SHA256 secret key for signing administrative session cookies. Process fails startup if default placeholder is detected in production. |
| `ALLOWED_ORIGINS` | Yes | Localhost array | Render | JSON array or comma-separated list of allowed frontend origins for CORS. Example: `["https://batanes-niche.vercel.app"]`. |
| `RESEND_API_KEY` | **Required for live email** | Empty (simulation mode) | Render | API key from [resend.com](https://resend.com). **When set**, the application delivers OTP emails via the Resend HTTP API. **When absent**, OTPs are safely logged to the server console only (simulation mode — no email is sent). Obtain from your Resend dashboard. |
| `RESEND_FROM_EMAIL` | Conditional | `onboarding@resend.dev` | Render | Verified sender address configured in your Resend account. Example: `noreply@batanesniche.ph`. Must match a domain verified in Resend. If absent, falls back to `MAIL_FROM` or Resend's default onboarding address. |
| `MAIL_FROM` | No | `noreply@batanesniche.ph` | Render | Fallback sender address used in email subjects and display names when `RESEND_FROM_EMAIL` is not set. |
| `MAIL_FROM_NAME` | No | `Batanes Niche Job Portal` | Render | Outgoing sender display name used in OTP email headers. |
| `ADMIN_INITIAL_EMAIL` | No | `admin@batanesniche.ph` | Render / Seed | Email used when seeding the initial platform administrator. |
| `ADMIN_INITIAL_PASSWORD` | Conditional | Empty | Render / Seed | Plaintext password used when seeding the initial platform administrator. Required when running seeding in production. |

> [!NOTE]
> **Email delivery mechanism**: The application uses the **Resend HTTP API** (`https://api.resend.com/emails`) for OTP email delivery — not SMTP/nodemailer. The variables `MAIL_HOST`, `MAIL_PORT`, `MAIL_USERNAME`, `MAIL_PASSWORD`, `MAIL_STARTTLS`, and `MAIL_SSL_TLS` are defined in `backend/src/core/config.ts` for future use but are **not currently read by the email delivery service**. Do not configure SMTP credentials expecting them to send OTP emails — set `RESEND_API_KEY` instead.
>
> **Simulation mode**: If `RESEND_API_KEY` is not set, the OTP code is logged to the backend server console (`[EMAIL_SIMULATION] Password reset OTP sent to <email>. OTP Code: <code>`). This is acceptable for local development but must not be used in production.

---

## 3. Frontend Environment Variables (Configured on Vercel)

These variables must be populated in the **Vercel Dashboard -> Project Settings -> Environment Variables** tab.

> [!IMPORTANT]
> In Vite, only variables prefixed with `VITE_` are exposed to the client bundle. Private backend secrets must NEVER be prefixed with `VITE_` or added to the frontend environment.

| Variable | Required | Default / Dev Fallback | Where Set | Description |
|---|---|---|---|---|
| `VITE_API_BASE_URL` | Yes | Empty (uses `/api/v1` dev proxy) | Vercel | Full HTTPS URL of the Render backend without trailing slash. Example: `https://batanes-niche-backend.onrender.com`. |

---

## 4. Environment File Matrix

| Environment File | Location | Tracked in Git? | Purpose |
|---|---|---|---|
| `.env.example` | Root (`/`) | **Yes** | Master template documenting all backend variables. |
| `frontend/.env.example` | `frontend/` | **Yes** | Frontend template documenting client-side variables. |
| `backend/.env` | `backend/` | **No** (gitignored) | Local developer environment file for backend development. |
| `frontend/.env.local` | `frontend/` | **No** (gitignored) | Local developer overrides for frontend Vite server. |
| `.env` | Root (`/`) | **No** (gitignored) | Monorepo fallback environment file. |
