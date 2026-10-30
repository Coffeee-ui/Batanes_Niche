# Batanes Niche Job Portal (Version 2)

[![Backend](https://img.shields.io/badge/typescript-passing-success.svg)](./backend)
[![Typecheck](https://img.shields.io/badge/typecheck-passing-brightgreen.svg)](./backend)
[![Frontend Tests](https://img.shields.io/badge/vitest-passing-success.svg)](./frontend/src/test)
[![Zero Jargon](https://img.shields.io/badge/ui_contract-zero__jargon-blue.svg)](./frontend/src/test/zero_jargon.test.ts)

A production-ready, hyper-localized employment marketplace engineered specifically for the province of **Batanes, Philippines**. The platform connects local job seekers across the three permanently inhabited islands (**Batan Island**, **Sabtang Island**, and **Itbayat Island**) with verified local enterprises and municipal initiatives through deterministic skill and transit-aware matching.

---

## 1. System Identity & Core Purpose

Batanes faces distinct labor market challenges: open ocean water barriers between islands, seasonal monsoonal weather disrupting sea transit, an economy dominated by micro-enterprises in tourism and traditional trades, and high outward migration of skilled Ivatan workers.

The **Batanes Niche Job Portal** provides:
- **Hyper-Local Matching**: Transparent transit accessibility calculations across the 6 municipalities and 29 barangays.
- **Explainable Recommendations**: A deterministic two-tier matching engine weighting trade skills (0–70 pts) and geographic distance (0–30 pts).
- **Zero-Jargon Public Experience**: Clean, accessible interfaces tailored for local trade workers and enterprise proprietors without intimidating technical terminology.
- **Isolated Server-Rendered Administration**: A secure Nunjucks administrative portal completely decoupled from the client-side single-page application.

> [!IMPORTANT]
> **Version 2 Scope Boundaries**:
> The Version 2 implementation intentionally **omits real-time chat, instant messaging, WebSockets, and offline background synchronization**. Communication is handled reliably via persistent in-app notifications, structured application status updates, and authorized direct email/telephone contact once an application is submitted.

---

## 2. Technology Stack

```text
Frontend (SPA):       React 18.3 | TypeScript 5.4+ | Vite 5.3 | Tailwind CSS 3.4 | Axios
Backend (REST API):   Node.js 20+ | Express.js 4.19 | TypeScript 5.4+ | Zod | Rate Limiter | Helmet
Admin UI (SSR):       Nunjucks 3.2 Templates | HMAC-SHA256 Signed Cookies | Double-Submit CSRF
Persistence:          Prisma ORM 5.15 | PostgreSQL 16 (Production) | SQLite (Dev / Test)
Database Migrations:  Prisma Client & Schema Push (`prisma db push`) | Dynamic Sync (`syncProvider.ts`)
Workspace & Packages: pnpm 12+ Monorepo Workspace
Containerization:     Docker Compose | Nginx 1.27 Reverse Proxy | Node 20 Alpine
Testing & Quality:    TypeScript Compiler (`tsc --noEmit`) | Vitest 1.6 + JSDOM (Frontend & Zero-Jargon Audit)
```

---

## 3. System Architecture Summary

The system is built as a **Modular Monolith** with four strictly decoupled tiers:

```text
                      +-------------------------------------------------------+
                      |                      WEB CLIENT                       |
                      +-------------------------------------------------------+
                                  |                               |
                      Public Web Traffic                   Admin Web Traffic
                     (React 18 SPA Assets)                (Server-Rendered UI)
                                  |                               |
                                  v                               v
                      +-----------------------+       +-----------------------+
                      |   React 18 SPA        |       |  Nunjucks Admin Portal|
                      |   (Vite + Tailwind)   |       |  (Express.js SSR)     |
                      +-----------------------+       +-----------------------+
                                  |                               |
                           REST API Calls                    Form Posts
                           (Bearer JWT)                     (Session Cookie)
                                  |                               |
                                  +---------------+---------------+
                                                  |
                                                  v
                                      +-----------------------+
                                      | Express.js Application|
                                      | Backend Gateway (TS)  |
                                      +-----------------------+
                                                  |
                     +----------------------------+----------------------------+
                     |                            |                            |
                     v                            v                            v
          +--------------------+        +--------------------+        +--------------------+
          |  Domain Services   |        |  Core Middleware   |        | External Services  |
          |  (Business Logic)  |        |  (CORS, Helmet,    |        | (SMTP Email OTP    |
          |                    |        |   RateLimit, CSRF) |        |  Delivery)         |
          +--------------------+        +--------------------+        +--------------------+
                     |
                     v
          +--------------------+
          | Repository Layer   |
          | (Prisma ORM)       |
          +--------------------+
                     |
                     v
          +--------------------+
          | Relational DB      |
          | (PostgreSQL 16     |
          |  / SQLite local)   |
          +--------------------+
```

- **Client Presentation**: React 18 SPA handles public job search, seeker dashboard, and employer applicant reviews.
- **Admin Isolation**: Nunjucks Admin Portal under `/admin` operates on signed HttpOnly session cookies (`batanes_admin_session`) and CSRF tokens (`batanes_admin_csrf`).
- **Domain Services**: Business logic, two-tier recommendations, and profile completeness calculations are centralized in domain services (`backend/src/services/`).
- **Repository Pattern**: All database queries are encapsulated in repository classes (`backend/src/repositories/`).

---

## 4. User Roles & Major Features

| Role | Access Scope & Key Features |
|---|---|
| **Guest** | Browse and filter active vacancies; view job details; register as seeker or employer; request OTP password reset. |
| **Job Seeker** | Complete profile (with 100-point gauge); apply to active vacancies; track application statuses; bookmark jobs; receive in-app notifications. |
| **Employer** | Post, edit, and soft-delete vacancies; review applicants with authorized contact details; transition application statuses (`pending` $\leftrightarrow$ `accepted`/`rejected`); search candidate directory with recommendation scoring. |
| **Administrator** | Access `/admin`; monitor system dashboard metrics; suspend/restore user accounts; disable/restore job listings; inspect 500 error reports; review append-only audit trail logs. |

---

## 5. Quickstart: Local Development Onboarding

### Option A: Automated Windows Batch Scripts (Recommended)
For rapid onboarding on Windows, run the scripts in `development/scripts/`:

```cmd
:: 1. Automated workspace setup: install pnpm packages, generate Prisma client, seed SQLite
development\scripts\setup.bat

:: 2. Launch Express backend (port 8000) and React frontend (port 5173) concurrently
development\scripts\start.bat

:: 3. Run typechecks and frontend tests (vitest + zero-jargon contract)
development\scripts\test.bat

:: 4. Stop all running background dev servers
development\scripts\stop.bat
```

---

### Option B: Manual Setup (Cross-Platform)

#### Prerequisites
- **Node.js**: `v20.0.0` or higher
- **pnpm**: `v9.0.0` or higher (`npm install -g pnpm` or `corepack enable`)

#### 1. Install Dependencies & Initialize Database
From the repository root:

```bash
# Install workspace dependencies across backend and frontend
pnpm install

# Copy environment variables template if .env does not exist
cp .env.example .env

# Generate Prisma Client for the active database provider
pnpm --filter batanes-niche-backend prisma:generate

# Initialize SQLite database schema and seed baseline + demo records
pnpm db:setup
```

#### 2. Start Development Servers

**Terminal 1 — Backend (Express.js + TypeScript):**
```bash
pnpm dev:backend
# Or: cd backend && pnpm dev
```
- **REST API Base**: `http://localhost:8000/api/v1`
- **Admin Portal (SSR)**: `http://localhost:8000/admin`
- **Health Check (Liveness Probe)**: `http://localhost:8000/health`
- **Readiness Check (DB Probe)**: `http://localhost:8000/ready`

**Terminal 2 — Frontend (React 18 + Vite):**
```bash
pnpm dev:frontend
# Or: cd frontend && pnpm dev
```
- **React Application**: `http://localhost:5173` (proxies `/api` to `http://localhost:8000`)

---

## 6. Database Configuration: SQLite ↔ Supabase/PostgreSQL

The database layer is **environment-switchable** — the active database is controlled entirely through `.env` with no application code changes required.

### Option A: Run on SQLite (Default Development — Zero Setup)

`backend/.env` (or root `.env`):
```env
DB_PROVIDER=sqlite
DATABASE_URL="file:../../Database/batanes_niche.db"
```

Initialize or migrate SQLite:
```bash
pnpm db:setup
# Or run development\scripts\init-db.bat on Windows
```

Verify readiness: `GET http://localhost:8000/ready` → `{ "status": "ready", "database": "connected", "provider": "sqlite" }`

---

### Option B: Switch to Supabase / PostgreSQL (Production Simulation)

#### Step 1 — Update `backend/.env` (no code changes needed):
```env
DB_PROVIDER=postgres

# Supabase Transaction Pooler (port 6543) — used at runtime:
DATABASE_URL="postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres?pgbouncer=true"

# Supabase Direct Connection (port 5432) — used by Prisma schema push:
DIRECT_URL="postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:5432/postgres"

# For local Docker Postgres instead of Supabase:
# DATABASE_URL="postgresql://batanes_user:change_me_in_production@localhost:5432/batanes_niche"
# DB_SSL=false
```

#### Step 2 — Push schema and seed:
```bash
pnpm db:migrate
# Or: cd backend && pnpm db:migrate
```
This command runs in sequence:
1. `syncProvider.ts` detects `DB_PROVIDER=postgres`, updates `schema.prisma` datasource provider, and regenerates Prisma Client.
2. `prisma db push` creates or updates tables on the target PostgreSQL database.
3. `seed.ts` inserts canonical demo accounts, administrator, and sample vacancies idempotently.

#### Step 3 — Start the application:
```bash
pnpm dev:backend
```
Verify readiness: `GET http://localhost:8000/ready` → `{ "status": "ready", "database": "connected", "provider": "postgresql" }`

> [!NOTE]
> **Admin sessions after database switch**: When switching database providers (between SQLite and PostgreSQL), re-login at `http://localhost:8000/admin` since user records and sessions reside in the respective active database.

#### Available Database Scripts (Root or `backend/`):
| Command | Purpose |
|---|---|
| `pnpm db:setup` | **1-Command Database Setup**: Creates database if missing, pushes schema, and seeds baseline + demo data inside transactions |
| `pnpm db:reset` | Clean wipe/drop all tables & recreate with fresh seed data (dev only, strictly guarded against production) |
| `pnpm db:seed` | Run idempotent baseline + sample data seed (skips existing records) |
| `pnpm db:push` | Sync `schema.prisma` provider + push schema directly to the active database |
| `pnpm db:migrate` | Alias for `pnpm db:setup` |
| `development\scripts\init-db.bat` | Windows batch 1-click database setup script |

#### CLI Options for `init-db.ts`:
You can pass flags to `pnpm db:setup -- [options]` or `ts-node development/scripts/init-db.ts [options]`:
- `--help`, `-h`: Show usage instructions and available options.
- `--reset`: Drop and recreate the database cleanly before seeding (guarded against production & remote PostgreSQL).
- `--seed-only`: Skip schema push and only insert baseline + sample seeds.
- `--no-seed`: Push schema only; do not insert seed data.
- `--db-path <path>`: Specify a custom SQLite file path (default: `Database/batanes_niche.db`).

#### Development Accounts & Credentials (Development-Only):
| Role | Username | Email | Dev Password | Access Scope |
|---|---|---|---|---|
| **Platform Administrator** | `admin` | `admin@batanesniche.ph` | `AdminSecure123!` | Backend SSR Admin Portal (`http://localhost:8000/admin`) |
| **Employer (Canonical Demo)** | `batanes_inn` | `manager@batanesinn.ph` | `EmployerSecure123!` | Frontend 1-click Demo & Standard Login |
| **Employer** | `bacasejos` | `jesi.bacasejos@gmail.com` | `EmployerSecure123!` | Frontend Standard Login |
| **Employer** | `leklek` | `lexterlampas@gmail.com` | `EmployerSecure123!` | Frontend Standard Login |
| **Job Seeker (Canonical Demo)** | `ivatan_guide` | `juan@batanesguide.ph` | `SeekerSecure123!` | Frontend 1-click Demo & Standard Login |
| **Job Seeker** | `gabotero` | `gab.joland@gmail.com` | `SeekerSecure123!` | Frontend Standard Login |
| **Job Seeker** | `elena_florez` | `elena@batanes.ph` | `SeekerSecure123!` | Frontend Standard Login |

> [!IMPORTANT]
> **Strict RBAC & Admin Isolation**: The frontend SPA only supports **Job Seeker** and **Employer** roles. No admin role or demo button exists in the frontend. Platform administrative access is restricted to the backend SSR interface (`/admin`). All passwords are automatically hashed with bcrypt (`10` rounds).

---

## 7. Testing & Quality Verification

```bash
# 1. Run strict workspace TypeScript typechecks (noEmit)
pnpm typecheck

# 2. Run frontend Vitest suite & Zero-Jargon UI contract audit
pnpm test

# 3. Build all workspace packages for production
pnpm build
```

On Windows, run the automated test script:
```cmd
development\scripts\test.bat
```

---

## 8. Administrative Portal (`/admin`)

The administrative portal is hosted directly on the Express.js backend under `/admin`:
- **Security**: Authenticated via signed HttpOnly session cookies (`batanes_admin_session`) with a 12-hour timeout.
- **CSRF Protection**: Enforced on all state-modifying POST actions via `batanes_admin_csrf`.
- **Immediate Suspension Guard**: Suspended administrators or users are rejected immediately on every request.
- **Audit Logging**: Every administrative action (suspension, restore, listing moderation) is recorded to the append-only `audit_logs` table.
- **Initial Account Creation**:
  ```bash
  pnpm db:setup
  ```

---

## 9. Production Deployment Overview

Production deployment uses **Docker Compose** fronted by **Nginx**:
- **Nginx**: Terminates SSL, proxies `/api/` and `/admin` to the Express.js backend, serves static React SPA assets with long-term caching, and handles SPA client-side fallback routing.
- **Express.js Backend**: Multi-stage Node 20 Alpine container (`docker/backend.Dockerfile`) running under an unprivileged user `appuser` (UID 1001).
- **PostgreSQL 16**: Containerized enterprise relational database with automated volume backups.

For the full 19-step production deployment manual, refer to [`development/setup/PRODUCTION_SETUP.md`](./development/setup/PRODUCTION_SETUP.md).

---

## 10. Comprehensive Developer Documentation Catalog

The full developer documentation package is maintained in `development/Documentation/`:

| # | Document | Primary Focus & Domain |
|---|---|---|
| **01** | [**System Overview**](./development/Documentation/01-System-Overview.md) | Vision, target audience, key problems solved, Version 2 scope, and explicit non-features. |
| **02** | [**Architecture**](./development/Documentation/02-Architecture.md) | High-level system architecture, multi-tier layout, layered domain boundaries, and Mermaid system diagram. |
| **03** | [**Repository Structure**](./development/Documentation/03-Repository-Structure.md) | Complete directory tree breakdown (`backend/`, `frontend/`, `development/`, `docker/`), and code placement rules. |
| **04** | [**Database and ERD**](./development/Documentation/04-Database-and-ERD.md) | Full Mermaid ERD (12 tables), schema definitions, constraints, indexes, lifecycle, and complete Data Dictionary. |
| **05** | [**API Architecture**](./development/Documentation/05-API-Architecture.md) | REST API specifications, `/api/v1` routes, request/response contracts, rate limiting, and endpoint catalog. |
| **06** | [**Authentication and Security**](./development/Documentation/06-Authentication-and-Security.md) | JWT access/refresh token rotation, reuse detection, bcrypt hashing, 6-digit OTP password reset, and security diagrams. |
| **07** | [**User Roles and Permissions**](./development/Documentation/07-User-Roles-and-Permissions.md) | Role taxonomy (Guest, Seeker, Employer, Administrator), RBAC capability matrix, and row-level ownership checks. |
| **08** | [**Business Workflows**](./development/Documentation/08-Business-Workflows.md) | End-to-end operational workflows with detailed Mermaid flowcharts (Auth, Jobs, Applications, Moderation). |
| **09** | [**Recommendation Engine**](./development/Documentation/09-Recommendation-Engine.md) | Deterministic matching algorithm: 70-pt skill score, 30-pt geographic distance score, two-tier ranking formula. |
| **10** | [**Frontend Architecture**](./development/Documentation/10-Frontend-Architecture.md) | React 18, Vite, TypeScript, Tailwind CSS, routing tables, AuthContext, Axios silent refresh, and HSL design tokens. |
| **11** | [**Administrative UI**](./development/Documentation/11-Administrative-UI.md) | Server-rendered Nunjucks admin interface (`/admin`), signed session cookies, CSRF protection, and moderation tools. |
| **12** | [**Notifications and Applications**](./development/Documentation/12-Notifications-and-Applications.md) | Application lifecycle state machine, transactional notification coupling, and applicant contact privacy reveal. |
| **13** | [**Geography and Reference Data**](./development/Documentation/13-Geography-and-Reference-Data.md) | Canonical Batanes geographic hierarchy (3 islands, 6 municipalities, 29 barangays), normalization algorithms, and seeder. |
| **14** | [**Testing and Quality**](./development/Documentation/14-Testing-and-Quality.md) | Testing architecture, TypeScript compiler verification (`tsc --noEmit`), frontend Vitest suite, zero-jargon tests, and CI gates. |
| **15** | [**Deployment and Operations**](./development/Documentation/15-Deployment-and-Operations.md) | Production Docker compose architecture, Nginx reverse proxy routing, PostgreSQL persistence, migrations, and backups. |
| **16** | [**Data Analysis Reference**](./development/Documentation/16-Data-Analysis-Reference.md) | Analytical guide for researchers: Entity mapping, analytical dimensions, SQL join recipes, and privacy rules. |
| **17** | [**Developer Guide**](./development/Documentation/17-Developer-Guide.md) | Local environment onboarding, pnpm workspace setup, configuration, CLI tooling, dev servers, and extension recipes. |
| **18** | [**Architecture Decisions**](./development/Documentation/18-Architecture-Decisions.md) | 16 Architectural Decision Records (ADRs) detailing context, rationale, consequences, and alternatives. |
| **19** | [**Skills and Business Type Catalog**](./development/Documentation/19-Skills-and-Business-Type-Catalog.md) | Standardized taxonomy of occupational skills, business industry sectors, and categorization rules. |
| **20** | [**System Flowcharts**](./development/Documentation/20-System-Flowcharts.md) | Comprehensive standard flowchart suite (User Journeys, Role Workflows, Multi-Tier Architecture Execution). |
| **21** | [**Developer Architecture Guide**](./development/Documentation/21-Developer-Architecture-Guide.md) | Practical navigation guide with "Where Do I Modify This?" matrix, code walks, and modification maps. |
| **22** | [**Backend Architecture**](./development/Documentation/22-Backend-Architecture.md) | Architecture specification for the Express.js + TypeScript backend (`backend/`), Prisma ORM, domain services, and repositories. |
| **23** | [**Database Environment Switching**](./development/Documentation/23-Database-Environment-Switching.md) | Dynamic provider synchronization (SQLite ↔ PostgreSQL/Supabase), zero-code environment switching via `.env`, Prisma sync, connection pooling, seed/reset tooling, and health probes. |

---

## 11. License

Developed for the province of Batanes. All rights reserved.
