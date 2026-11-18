# Production Troubleshooting Runbook

This guide diagnoses and resolves common operational, build, runtime, and deployment issues encountered across **Vercel**, **Render**, and **Supabase**.

---

## 1. Backend Service Issues (Render)

### Issue 1.1: Backend Crashes on Startup with `FATAL: JWT_SECRET_KEY is a development placeholder`
- **Symptom**: In Render deployment logs:
  ```text
  [Config Error] FATAL: JWT_SECRET_KEY is a development placeholder.
  Set a strong, randomly-generated secret in the Render Environment Variables dashboard.
  ```
- **Root Cause**: `ENVIRONMENT=production` is set, but `JWT_SECRET_KEY` or `ADMIN_SESSION_SECRET` still contains the development default value.
- **Resolution**:
  1. Open your terminal and generate two new 64-character secrets:
     ```bash
     openssl rand -hex 32
     openssl rand -hex 32
     ```
  2. In the Render Dashboard -> **Environment**, assign the generated values to `JWT_SECRET_KEY` and `ADMIN_SESSION_SECRET`.
  3. Click **Save Changes** to redeploy.

---

### Issue 1.2: Backend Fails Readiness Check (`GET /ready` returns 503)
- **Symptom**: `curl https://your-backend.onrender.com/ready` returns:
  ```json
  {"status":"not_ready","database":"disconnected","error":"..."}
  ```
- **Root Cause**: The backend cannot connect to Supabase PostgreSQL.
- **Resolution**:
  1. **Verify `DATABASE_URL` format**:
     Ensure the host matches Supabase's transaction pooler (`aws-0-[region].pooler.supabase.com`) on port `6543`.
  2. **Verify `?pgbouncer=true`**:
     Prisma requires `?pgbouncer=true` when querying a transaction pooler.
  3. **Verify Database Password**:
     Special characters in database passwords must be URL-encoded (e.g., `#` becomes `%23`).
  4. **Check Supabase Project Status**:
     Ensure your Supabase project is active and not paused due to inactivity.

---

### Issue 1.3: Render Web Service Times Out During Build
- **Symptom**: Build exceeds timeout or runs out of memory during `pnpm install`.
- **Root Cause**: Monorepo dependencies installing unnecessarily or lockfile mismatch.
- **Resolution**:
  Ensure the **Build Command** in Render is set to:
  ```bash
  pnpm install --frozen-lockfile && pnpm --filter batanes-niche-backend exec prisma generate && pnpm --filter batanes-niche-backend run build:render
  ```

---

## 2. Frontend Issues (Vercel)

### Issue 2.1: Page Refresh Returns 404 on Vercel
- **Symptom**: Navigating to `https://batanes-niche.vercel.app` works, but refreshing while on `/jobs`, `/login`, or `/profile` displays a Vercel 404 page.
- **Root Cause**: The React Single-Page Application uses client-side routing (`react-router-dom`). Without rewrite configuration, Vercel looks for a physical static file at `/jobs/index.html`.
- **Resolution**:
  Verify that `frontend/vercel.json` exists in your repository with the rewrite rule:
  ```json
  {
    "rewrites": [
      { "source": "/((?!api/).*)", "destination": "/index.html" }
    ]
  }
  ```
  Ensure the root directory in Vercel project settings is set to `frontend`.

---

### Issue 2.2: CORS Blocked When Calling Backend from Vercel
- **Symptom**: Browser console logs:
  ```text
  Access to XMLHttpRequest at 'https://batanes-niche-backend.onrender.com/api/v1/jobs' from origin
  'https://batanes-niche.vercel.app' has been blocked by CORS policy.
  ```
- **Root Cause**: The Render backend's `ALLOWED_ORIGINS` variable does not include the exact Vercel frontend domain.
- **Resolution**:
  1. In Render Dashboard -> `batanes-niche-backend` -> **Environment**:
  2. Set `ALLOWED_ORIGINS` to a JSON array containing your Vercel domain:
     ```json
     ["https://batanes-niche.vercel.app"]
     ```
  3. Avoid trailing slashes in the origin URL (e.g. `https://batanes-niche.vercel.app/` is invalid for CORS).
  4. Save changes and wait for the backend to reload.

---

### Issue 2.3: Frontend Makes Requests to `localhost:8000` in Production
- **Symptom**: Network tab in browser DevTools shows API calls failing against `http://localhost:8000/api/v1/...`.
- **Root Cause**: `VITE_API_BASE_URL` was not configured in Vercel before the build.
- **Resolution**:
  1. In the Vercel Dashboard -> **Project Settings -> Environment Variables**:
  2. Add `VITE_API_BASE_URL` with your public Render URL:
     ```text
     https://batanes-niche-backend.onrender.com
     ```
  3. Go to the **Deployments** tab and click **Redeploy** (environment variables are baked in during Vite build).

---

## 3. Database & Prisma Operations (Supabase)

### Issue 3.1: Prisma Schema Push Fails with Prepared Statement Error
- **Symptom**: When running `npx prisma db push`, you see:
  ```text
  ERROR: prepared statement "s0" already exists
  ```
- **Root Cause**: Running schema push through the Transaction Pooler (port `6543`). Transaction poolers multiplex connections and disallow prepared statement state.
- **Resolution**:
  Ensure that schema push commands use the direct connection on port `5432`:
  ```bash
  DATABASE_URL="postgresql://postgres.[REF]:[PASS]@...:5432/postgres" npx prisma db push
  ```

---

### Issue 3.2: Database Connection Limits Reached
- **Symptom**: Error in backend logs:
  ```text
  FATAL: remaining connection slots are reserved for non-replication superuser connections
  ```
- **Root Cause**: Too many direct connections opened to PostgreSQL.
- **Resolution**:
  Ensure the backend application runtime uses the **Transaction Pooler URL** (`:6543` with `?pgbouncer=true`). PgBouncer multiplexes hundreds of application queries over a compact pool of 10–20 database connections.

---

## 4. Administrative Portal & Authentication

### Issue 4.1: Admin Login Immediately Redirects Back to Login Screen
- **Symptom**: Submitting valid admin credentials on `/admin/login` reloads the login form with no error.
- **Root Cause**: Cookie `secure: true` flag was set, but the request was served over plain HTTP, causing the browser to discard the cookie.
- **Resolution**:
  Always access the admin portal over HTTPS in production (`https://your-backend.onrender.com/admin/login`). Render provides automatic SSL certificates for all web services.

---

### Issue 4.2: Password Reset OTP Not Arriving in User Inbox
- **Symptom**: User clicks "Forgot Password", but no email arrives.
- **Root Cause**: `RESEND_API_KEY` is not configured, or domain verification in Resend is incomplete.
- **Resolution**:
  When `RESEND_API_KEY` is empty, the backend runs in **Email Simulation Mode** to prevent application crashes. The 6-digit OTP is output directly to the backend logs in Render:
  ```text
  [EMAIL_SIMULATION] Password reset OTP sent to user@example.com. OTP Code: 123456 (Simulation mode)
  ```
  To enable live email delivery:
  1. Obtain an API key from [Resend](https://resend.com).
  2. Set `RESEND_API_KEY` in the Render service environment variables.
  3. Ensure `RESEND_FROM_EMAIL` matches a verified domain in your Resend account (or defaults to `onboarding@resend.dev` for testing).

---

## 5. File Uploads & Documents (Resumes)

### Issue 5.1: Uploaded Resumes Disappear After Backend Redeployment
- **Symptom**: Job applicants upload resumes successfully, but after a code deploy on Render, downloading the resume returns HTTP 404.
- **Root Cause**: Render free instances use an ephemeral filesystem. Any file written to disk is discarded when the container restarts or redeploys.
- **Resolution**:
  1. **Option A (Render Persistent Disk)**:
     On a paid Render service, attach a **Persistent Disk** (e.g. mounted at `/var/data/uploads`) and set `UPLOAD_DIR=/var/data/uploads` in Render environment variables.
  2. **Option B (Object Storage)**:
     Integrate cloud object storage (e.g. Supabase Storage, AWS S3, or Cloudflare R2).
