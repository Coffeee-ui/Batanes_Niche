# Installation and Deployment Guide – Batanes Niche Job Portal v2.0

**Analysis Date:** 2026-11-18  
**Branch:** New-Features  
**Deployment Stack:** Vercel (Frontend) · Render (Backend) · Supabase (Database)

---

## System Requirements

| Component | Minimum Requirement |
|---|---|
| Node.js | v20.0.0 or higher |
| pnpm | v9.0.0 or higher (v12.4.2 recommended) |
| Operating System | Windows 10/11, macOS 12+, Ubuntu 20.04+ |
| RAM | 2 GB minimum (4 GB recommended for development) |
| Disk Space | ~500 MB (including node_modules) |

---

## Part 1: Local Development Setup

### Option A: Automated Setup (Windows — Recommended)

```cmd
:: 1. Clone the repository
git clone https://github.com/your-org/Batanes_Niche.git
cd Batanes_Niche

:: 2. Run the automated setup script
development\scripts\setup.bat

:: 3. Start both servers (opens two background processes)
development\scripts\start.bat

:: 4. Run typechecks and tests
development\scripts\test.bat

:: 5. Stop all servers
development\scripts\stop.bat
```

### Option B: Manual Cross-Platform Setup

#### Step 1: Install pnpm (if not installed)
```bash
npm install -g pnpm
# Or use corepack:
corepack enable
corepack prepare pnpm@latest --activate
```

#### Step 2: Install dependencies
```bash
# From repository root — installs both backend and frontend
pnpm install
```

#### Step 3: Configure environment variables
```bash
# Copy the root-level template
cp .env.example .env

# Backend .env is at: backend/.env
# Review and edit backend/.env — no credentials needed for SQLite dev
```

**Required backend/.env for SQLite (default):**
```env
NODE_ENV=development
ENVIRONMENT=development
PORT=8000
DB_PROVIDER=sqlite
DATABASE_URL="file:../../Database/batanes_niche.db"
JWT_SECRET_KEY=change_me_to_a_random_secret_in_production
ADMIN_SESSION_SECRET=change_me_to_a_random_secret_in_production
ALLOWED_ORIGINS=["http://localhost:5173"]
DEBUG=true
DEMO_MODE=true
```

#### Step 4: Initialize the database
```bash
# Generate Prisma client
pnpm --filter batanes-niche-backend prisma:generate

# Create SQLite DB, push schema, and seed demo data
pnpm db:setup
```

#### Step 5: Start development servers

**Terminal 1 — Backend:**
```bash
pnpm dev:backend
# Server: http://localhost:8000
# Admin:  http://localhost:8000/admin
# Health: http://localhost:8000/health
# Ready:  http://localhost:8000/ready
```

**Terminal 2 — Frontend:**
```bash
pnpm dev:frontend
# App: http://localhost:5173
```

---

## Part 2: Database Management

### SQLite ↔ PostgreSQL Switching

No application code changes are needed. Only update `backend/.env`:

| Setting | SQLite (Dev) | PostgreSQL (Prod) |
|---|---|---|
| `DB_PROVIDER` | `sqlite` | `postgres` |
| `DATABASE_URL` | `file:../../Database/batanes_niche.db` | Supabase Pooler URL (port 6543) |
| `DIRECT_URL` | *(not needed)* | Supabase Direct URL (port 5432) |

### Database CLI Commands

| Command | Purpose |
|---|---|
| `pnpm db:setup` | Create DB → push schema → seed (all-in-one) |
| `pnpm db:seed` | Run seed only (idempotent, skips existing records) |
| `pnpm db:push` | Sync provider → push schema (no seed) |
| `pnpm db:reset` | Drop all tables → recreate → seed (dev only, guarded against production) |
| `pnpm db:migrate` | Alias for `pnpm db:setup` |

### SQLite Database Location
```
Database/batanes_niche.db
```

---

## Part 3: Testing and Quality Checks

```bash
# TypeScript typechecks (both packages)
pnpm typecheck

# Frontend Vitest tests (including zero-jargon audit)
pnpm test

# Full workspace build
pnpm build
```

---

## Part 4: Production Deployment

### 4.1 Supabase Database Provisioning

1. Create a Supabase project at [supabase.com](https://supabase.com).
2. Select region: **Southeast Asia (Singapore)** or **Tokyo** for lowest Philippines latency.
3. Retrieve two connection strings from Project Settings → Database:
   - **Transaction Pooler (port 6543)** → use as `DATABASE_URL`
   - **Direct Connection (port 5432)** → use as `DIRECT_URL`
4. Apply schema: Either `npx prisma db push` from local or use `Database/migrations/001_initial_schema.sql` in Supabase SQL Editor.
5. Bootstrap admin: Use `Database/migrations/002_seed_production_admin.sql` with a bcrypt-hashed password.

### 4.2 Render Backend Deployment

**Service Configuration:**
- **Build Command:** `pnpm install --frozen-lockfile && pnpm --filter batanes-niche-backend exec prisma generate && pnpm --filter batanes-niche-backend run build:render`
- **Start Command:** `node backend/dist/main.js`
- **Health Check Path:** `/health`
- **Region:** Singapore

**Required Environment Variables on Render:**

| Variable | Value |
|---|---|
| `NODE_ENV` | `production` |
| `ENVIRONMENT` | `production` |
| `PORT` | `10000` |
| `DB_PROVIDER` | `postgres` |
| `DATABASE_URL` | Supabase Transaction Pooler URL |
| `DIRECT_URL` | Supabase Direct Connection URL |
| `JWT_SECRET_KEY` | `openssl rand -hex 32` |
| `ADMIN_SESSION_SECRET` | `openssl rand -hex 32` |
| `ALLOWED_ORIGINS` | `["https://your-app.vercel.app"]` |
| `DEMO_MODE` | `false` |
| `DEBUG` | `false` |
| `MAIL_HOST` | SMTP hostname |
| `MAIL_PORT` | `587` |
| `MAIL_USERNAME` | SMTP username |
| `MAIL_PASSWORD` | SMTP app password |
| `MAIL_FROM` | Sender email address |
| `MAIL_FROM_NAME` | `Batanes Niche Job Portal` |
| `MAIL_STARTTLS` | `true` |

> ⚠️ **Never commit secrets to the repository.** Generate all secrets using `openssl rand -hex 32`.

### 4.3 Vercel Frontend Deployment

1. Connect GitHub repository to Vercel.
2. Set **Root Directory** to `frontend`.
3. **Framework:** Vite. **Build Command:** `pnpm run build`. **Output Directory:** `dist`.
4. Add environment variable: `VITE_API_BASE_URL=https://your-backend.onrender.com`
5. Deploy.

### 4.4 Post-Deployment Verification

```bash
# Health check
curl -i https://your-backend.onrender.com/health

# Database readiness
curl -i https://your-backend.onrender.com/ready

# Public job browse
# Navigate to https://your-app.vercel.app/jobs

# Admin portal
# Navigate to https://your-backend.onrender.com/admin/login
```

---

## Part 5: Docker Compose (Local Postgres Alternative)

```bash
# Start local Postgres + Nginx + Node services
docker-compose up -d

# Stop services
docker-compose down
```

> Review `docker-compose.yml` for service configuration. Docker Compose is intended for local infrastructure simulation; production deployments use Render + Supabase.

---

## Troubleshooting

| Issue | Resolution |
|---|---|
| `DATABASE_URL not set` | Confirm `backend/.env` exists with correct `DATABASE_URL` for the active provider. |
| Prisma client not found | Run `pnpm --filter batanes-niche-backend prisma:generate`. |
| Port 8000 already in use | Kill the process: `netstat -ano \| findstr :8000` then `taskkill /PID <pid> /F` |
| `CORS` errors in browser | Ensure `ALLOWED_ORIGINS` in backend `.env` includes the exact frontend URL. |
| Admin login fails after DB switch | Re-run `pnpm db:setup` to restore seed admin account in the new database. |
| Vitest tests fail | Run `pnpm typecheck` first to identify TypeScript errors. |
| Resume files lost on Render | Known limitation — ephemeral filesystem. Migrate to Supabase Storage or S3. |
| OTP emails not sending | Verify `MAIL_HOST`, `MAIL_USERNAME`, and `MAIL_PASSWORD`. Check SMTP app-password configuration. |

For additional troubleshooting guidance, refer to: [TROUBLESHOOTING.md](../TROUBLESHOOTING.md)
