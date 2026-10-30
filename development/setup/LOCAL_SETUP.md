# Batanes Niche Job Portal - Local Setup Guide (Version 2)

Welcome to the **Batanes Niche Job Portal Version 2**. This guide outlines the steps required to set up, run, and develop both the TypeScript backend and React frontend locally.

---

## 1. Prerequisites

Ensure you have the following installed on your machine:
- **Node.js**: Version 20.x or higher (LTS recommended)
- **pnpm**: Version 9.x or higher (e.g. `pnpm@12.4.2`)
- **Git**: Latest version

---

## 2. Repository Structure

```
Batanes_Niche/
+-- backend/                  # TypeScript + Express.js + Prisma Backend
¦   +-- prisma/               # Prisma database schema and migrations
¦   +-- src/                  # Core application, API routers, services, repositories
¦   +-- package.json          # Backend dependencies & scripts
+-- frontend/                 # React 18 + Vite + Tailwind SPA
¦   +-- src/                  # Components, pages, contexts, design tokens
¦   +-- package.json          # Frontend dependencies & scripts
¦   +-- vite.config.ts        # Vite configuration & proxy
+-- docker/                   # Production Docker & Nginx configurations
+-- development/              # Setup, testing, and operational runbooks
¦   +-- Documentation/        # Technical architecture documentation
¦   +-- setup/                # Local and production setup documentation
¦   +-- testing/              # Testing contracts and execution guides
¦   +-- scripts/              # Windows batch utility scripts & database seeds
+-- docker-compose.yml        # Multi-container orchestration
```

---

## 3. Fast-Track Setup (Single Command)

For Windows environments, run the automated setup script from the repository root:

```cmd
development\scripts\setup.bat
```

This script automatically:
1. Installs all workspace dependencies (`pnpm install`)
2. Generates the Prisma ORM client (`pnpm --filter batanes-niche-backend prisma:generate`)
3. Sets up the local SQLite database and seeds baseline and demo data (`pnpm db:setup`)

---

## 4. Manual Step-by-Step Setup

### Step 1: Install Workspace Dependencies
From the repository root:
```bash
pnpm install
```

### Step 2: Configure Environment Variables
Copy `.env.example` to `backend/.env` (or verify `backend/.env` exists):
```bash
cp .env.example backend/.env
```

Default local development values:
```env
PORT=8000
ENVIRONMENT=development
DATABASE_URL=file:./dev.db
JWT_SECRET_KEY=batanes_super_secret_jwt_key_development_only_minimum_32_chars
ADMIN_SESSION_SECRET=batanes_super_secret_admin_session_key_minimum_32_chars
CORS_ORIGIN=http://localhost:5173
```

### Step 3: Initialize Database & Seed Data
Generate the Prisma client and seed the local database:
```bash
pnpm --filter batanes-niche-backend prisma:generate
pnpm db:setup
```

### Step 4: Start Development Servers
You can start both backend and frontend concurrently:
```bash
development\scripts\start.bat
```

Or run them in separate terminals:
```bash
# Terminal 1 - Backend:
pnpm --filter batanes-niche-backend dev

# Terminal 2 - Frontend:
pnpm --filter batanes-niche-frontend dev
```

- **Frontend Application**: `http://localhost:5173`
- **Backend API Base**: `http://localhost:8000/api/v1`
- **Server-Rendered Admin Portal**: `http://localhost:8000/admin`
- **Health Check**: `http://localhost:8000/health`

---

## 5. Automated Operational Scripts

Located in `development/scripts/`:

- **Setup Environment**: `development\scripts\setup.bat` (installs deps, generates Prisma, runs `db:setup`)
- **Initialize / Seed DB**: `pnpm db:setup` or `development\scripts\init-db.bat`
- **Reset DB**: `pnpm db:reset` (drops & recreates clean local database)
- **Start All Services**: `development\scripts\start.bat` (launches backend on :8000 and frontend on :5173)
- **Stop All Services**: `development\scripts\stop.bat` (terminates active dev processes)
- **Run Tests & Checks**: `development\scripts\test.bat` (typecheck + vitest)

---

## 6. Running Local Tests & Verification

```bash
# Verify TypeScript types across all packages
pnpm typecheck

# Run Vitest test suite
pnpm test

# Build both backend and frontend for production
pnpm build
```