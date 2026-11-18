# Production Deployment Guide: Vercel, Render & Supabase

This guide provides end-to-end instructions for deploying the **Batanes Niche Job Portal** to production using:
- **Vercel** for the React Single-Page Application (Frontend).
- **Render** for the Express.js / Node.js REST API and Admin SSR Portal (Backend).
- **Supabase** for the managed PostgreSQL database and connection pooler (Database).

---

## Prerequisites

Before starting, ensure you have active accounts on:
1. [GitHub](https://github.com) (Repository containing your project code)
2. [Supabase](https://supabase.com) (PostgreSQL cloud database)
3. [Render](https://render.com) (Web service hosting)
4. [Vercel](https://vercel.com) (Frontend hosting)
5. `openssl` or Node.js installed locally to generate secure cryptographic secrets.

---

## Phase 1: Supabase Database Provisioning

### Step 1.1: Create a Supabase Project
1. Log in to your [Supabase Dashboard](https://supabase.com/dashboard) and click **New Project**.
2. Fill in the project configuration:
   - **Name**: `batanes-niche-prod`
   - **Database Password**: Enter a strong, high-entropy password (save this securely).
   - **Region**: Select `Southeast Asia (Singapore) - ap-southeast-1` or `Tokyo - ap-northeast-1` for lowest latency to the Philippines.
   - **Pricing Plan**: Free or Pro.
3. Click **Create new project** and wait 1–2 minutes for provisioning to complete.

### Step 1.2: Obtain Connection Strings
1. In your Supabase project dashboard, navigate to **Project Settings** (gear icon) -> **Database**.
2. Scroll to the **Connection string** section:
   - Under **Connection pooling** (port `6543`), select **Transaction** mode. Copy the URL. Append `?pgbouncer=true` to the end. This is your `DATABASE_URL`.
     ```text
     postgresql://postgres.[PROJECT-REF]:[YOUR-PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true
     ```
   - Under **Direct connection** (port `5432`), copy the direct URI. This is your `DIRECT_URL`.
     ```text
     postgresql://postgres.[PROJECT-REF]:[YOUR-PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres
     ```

### Step 1.3: Apply Database Schema
You can initialize the schema using either of the following approaches:

#### Approach A: Direct Prisma Push (From Local Machine)
```bash
cd backend
# Set environment variables in your terminal session
DATABASE_URL="postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres"

# Push schema directly to Supabase
npx prisma db push --schema=prisma/schema.prisma
```

#### Approach B: Supabase SQL Editor
1. In your Supabase Dashboard, open **SQL Editor**.
2. Click **New query**.
3. Open `Database/migrations/001_initial_schema.sql` from this repository, copy its entire contents, paste into the query editor, and click **Run**.
4. Verify that the tables (`users`, `jobs`, `applications`, `audit_logs`, etc.) appear under **Table Editor**.

### Step 1.4: Bootstrap the Initial Platform Administrator
1. Generate a bcrypt password hash on your local computer:
   ```bash
   node -e "console.log(require('bcryptjs').hashSync('YOUR_NEW_SECURE_ADMIN_PASSWORD', 12));"
   ```
2. Open `Database/migrations/002_seed_production_admin.sql`.
3. In the SQL Editor, paste the script, replacing `<PASTE_BCRYPT_HASH_HERE>` with your generated hash and `admin@batanesniche.ph` with your designated admin email.
4. Click **Run**. Your production administrator is now initialized.

---

## Phase 2: Render Backend API Deployment

### Step 2.1: Create Render Web Service
1. Log in to [Render Dashboard](https://dashboard.render.com).
2. Click **New +** -> **Web Service**.
3. Connect your GitHub repository (`Batanes_Niche`).
4. Configure the service settings:
   - **Name**: `batanes-niche-backend`
   - **Region**: `Singapore` (match Supabase region)
   - **Branch**: `main`
   - **Root Directory**: Leave blank (monorepo root)
   - **Runtime**: `Node`
   - **Build Command**:
     ```bash
     pnpm install --frozen-lockfile && pnpm --filter batanes-niche-backend exec prisma generate && pnpm --filter batanes-niche-backend run build:render
     ```
   - **Start Command**:
     ```bash
     node backend/dist/main.js
     ```
   - **Plan**: Free or Starter.

### Step 2.2: Configure Render Environment Variables
Under the **Environment** tab, click **Add Environment Variable** for each of the following:

| Variable Name | Example / Recommended Value | Description |
|---|---|---|
| `NODE_ENV` | `production` | Node.js production mode |
| `ENVIRONMENT` | `production` | Disables demo mode, enforces HTTPS cookies and secrets |
| `PORT` | `10000` | Port assigned by Render |
| `BASE_URL` | `https://batanes-niche-backend.onrender.com` | Your actual Render public URL |
| `DB_PROVIDER` | `postgres` | Explicitly selects PostgreSQL provider |
| `DATABASE_URL` | `postgresql://postgres.[REF]:[PASS]@...pooler...:6543/postgres?pgbouncer=true` | Supabase Transaction Pooler URL |
| `DIRECT_URL` | `postgresql://postgres.[REF]:[PASS]@...pooler...:5432/postgres` | Supabase Direct Connection URL |
| `JWT_SECRET_KEY` | *(Generate 64-char hex)* `openssl rand -hex 32` | Production JWT access signing key |
| `ADMIN_SESSION_SECRET` | *(Generate 64-char hex)* `openssl rand -hex 32` | Production admin session cookie signing key |
| `ALLOWED_ORIGINS` | `["https://batanes-niche.vercel.app"]` | Your Vercel frontend URL(s) as JSON array |
| `DEBUG` | `false` | Disables verbose debug logging |
| `DEMO_MODE` | `false` | Strictly disables 1-click test credentials |
| `RESEND_API_KEY` | `re_xxxxxxxxxxxxxxxxxxxx` | **Required for live email.** API key from [resend.com](https://resend.com). Without this, OTPs are only logged to the server console (simulation mode). |
| `RESEND_FROM_EMAIL` | `noreply@yourdomain.ph` | Verified sender address in your Resend account. Must be a domain verified in Resend. |
| `MAIL_FROM_NAME` | `Batanes Niche Job Portal` | Outgoing sender display name used in OTP emails. |

### Step 2.3: Health Check Configuration
1. In Render, scroll down to **Advanced Settings** → **Health Check Path**.
2. Enter `/health`.
3. Click **Create Web Service**.
4. Monitor the deployment logs. When deployment completes, verify:
   ```bash
   curl -f https://your-backend.onrender.com/health
   # Response: {"status":"healthy","timestamp":"...","app":"Batanes Niche Job Portal","version":"2.0.0"}
   ```

> [!NOTE]
> **Email delivery**: The application uses the **Resend HTTP API** for OTP email delivery — not SMTP. Set `RESEND_API_KEY` to enable live email. Without it, OTP codes are logged to the Render service logs only (simulation mode). To test live email, use the Forgot Password flow after deployment.

---

## Phase 3: Vercel Frontend Deployment

### Step 3.1: Import Project to Vercel
1. Log in to [Vercel Dashboard](https://vercel.com/dashboard) and click **Add New...** -> **Project**.
2. Connect your GitHub repository (`Batanes_Niche`).
3. In the configuration screen:
   - **Framework Preset**: `Vite`
   - **Root Directory**: Click **Edit** and select `frontend`.
   - **Build Command**: `pnpm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `pnpm install`

### Step 3.2: Configure Environment Variables
Under **Environment Variables**, add:

| Key | Value | Description |
|---|---|---|
| `VITE_API_BASE_URL` | `https://batanes-niche-backend.onrender.com` | Public HTTPS URL of your Render backend API |

### Step 3.3: Deploy Frontend
1. Click **Deploy**.
2. Once the build finishes, your site is available at `https://batanes-niche.vercel.app` (or custom domain).
3. Copy your live Vercel domain name.

### Step 3.4: Synchronize CORS on Render
1. Return to your **Render Dashboard** -> `batanes-niche-backend` -> **Environment**.
2. Update `ALLOWED_ORIGINS` to include your exact Vercel production domain:
   ```json
   ["https://batanes-niche.vercel.app"]
   ```
3. Save changes. Render will perform a zero-downtime rolling reload.

---

## Phase 4: Post-Deployment Verification

Verify each user flow in production:

1. **Health & Readiness Check**:
   - `curl -i https://your-backend.onrender.com/health` -> HTTP 200 `{"status":"healthy"}`
   - `curl -i https://your-backend.onrender.com/ready` -> HTTP 200 `{"status":"ready","database":"connected"}`
2. **Public Guest Browse**:
   - Navigate to `https://batanes-niche.vercel.app/jobs`.
   - Verify job listings and preview cards render without CORS errors in browser DevTools.
3. **SPA Client-Side Navigation & Refresh**:
   - Navigate to `https://batanes-niche.vercel.app/jobs`.
   - Refresh the page (`F5`). Verify the page loads cleanly rather than returning 404.
4. **Job Seeker Registration & Login**:
   - Register a new account under a valid Batanes municipality (e.g., Basco, Sabtang).
   - Log in and verify profile information persists.
5. **Administrative Governance UI**:
   - Navigate to `https://your-backend.onrender.com/admin/login`.
   - Log in with the administrative credentials created in Step 1.4.
   - Confirm access to Dashboard, Users, Jobs, Error Reports, and Audit Trail.
