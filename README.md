# Batanes Niche Job Portal (Version 2)

[![Backend Tests](https://img.shields.io/badge/pytest-passing-success.svg)](./backend/tests)
[![Coverage](https://img.shields.io/badge/coverage-%3E%3D85%25-brightgreen.svg)](./backend)
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
- **Isolated Server-Rendered Administration**: A secure Jinja2 administrative portal completely decoupled from the client-side single-page application.

> [!IMPORTANT]
> **Version 2 Scope Boundaries**:
> The Version 2 implementation intentionally **omits real-time chat, instant messaging, WebSockets, and offline background synchronization**. Communication is handled reliably via persistent in-app notifications, structured application status updates, and authorized direct email/telephone contact once an application is submitted.

---

## 2. Technology Stack

```
Frontend (SPA):       React 18.3 | TypeScript 5.5 | Vite 5.3 | Tailwind CSS 3.4 | Axios
Backend (REST API):   FastAPI 0.111 | Python 3.11 | Pydantic v2 | SlowAPI Rate Limiter
Admin UI (SSR):       Jinja2 Templates | Itsdangerous Signed Cookies | Double-Submit CSRF
Persistence:          SQLAlchemy 2.0 | PostgreSQL 16 (Production) | SQLite (Dev / Test)
Database Migrations:  Alembic
Containerization:     Docker Compose | Nginx 1.27 Reverse Proxy
Testing:              Pytest 8.x + pytest-cov (Backend) | Vitest 1.6 + JSDOM (Frontend)
```

---

## 3. System Architecture Summary

The system is built as a **Modular Monolith** with four strictly decoupled tiers:

```
                      +-------------------------------------------------------+
                      |                      WEB CLIENT                       |
                      +-------------------------------------------------------+
                                  |                               |
                      Public Web Traffic                   Admin Web Traffic
                     (React 18 SPA Assets)                (Server-Rendered UI)
                                  |                               |
                                  v                               v
                      +-----------------------+       +-----------------------+
                      |   React 18 SPA        |       |   Jinja2 Admin Portal |
                      |   (Vite + Tailwind)   |       |   (FastAPI SSR)       |
                      +-----------------------+       +-----------------------+
                                  |                               |
                           REST API Calls                    Form Posts
                           (Bearer JWT)                     (Session Cookie)
                                  |                               |
                                  +---------------+---------------+
                                                  |
                                                  v
                                      +-----------------------+
                                      |   FastAPI Application |
                                      |   Backend Gateway     |
                                      +-----------------------+
                                                  |
                     +----------------------------+----------------------------+
                     |                            |                            |
                     v                            v                            v
          +--------------------+        +--------------------+        +--------------------+
          |  Domain Services   |        |  Core Middleware   |        | External Services  |
          |  (Business Logic)  |        |  (CORS, SlowAPI,   |        | (SMTP Email OTP    |
          |                    |        |   Audit, Errors)   |        |  Delivery)         |
          +--------------------+        +--------------------+        +--------------------+
                     |
                     v
          +--------------------+
          | Repository Layer   |
          | (SQLAlchemy 2.0)   |
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
- **Admin Isolation**: Jinja2 Admin Portal under `/admin` operates on signed HttpOnly session cookies (`batanes_admin_session`) and CSRF tokens.
- **Domain Services**: Business logic, two-tier recommendations, and profile completeness calculations are centralized in domain services.
- **Repository Pattern**: All database queries are encapsulated in repository classes.

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
:: 1. Setup virtualenv, install all dependencies, run migrations
development\scripts\setup.bat

:: 2a. Launch NEW TypeScript backend (port 8000) and frontend (port 5173) concurrently
development\scripts\start-ts.bat
:: (or run .\start-ts.bat from root)

:: 2b. OR Launch LEGACY FastAPI backend (port 8000) and frontend (port 5173) concurrently
development\scripts\start.bat
:: (or development\scripts\start-legacy.bat / .\start-legacy.bat from root)

:: 3. Run all backend and frontend tests
development\scripts\test.bat

:: 4. Stop all running background dev servers
development\scripts\stop.bat
:: (or .\stop.bat from root)
```

---

### Option B: Manual Setup

#### 1. Backend Setup (Terminal 1)
```bash
cd backend
python -m venv venv

# Windows:
.\venv\Scripts\activate
# Linux/macOS:
source venv/bin/activate

pip install --upgrade pip
pip install -r requirements.txt

# Run migrations & seed demo data
alembic upgrade head
python -m app.cli seed-data

# Start FastAPI server
uvicorn app.main:app --reload --port 8000
```
- **REST API**: `http://localhost:8000/api/v1`
- **Swagger Docs**: `http://localhost:8000/docs`
- **Admin Portal**: `http://localhost:8000/admin`

#### 2. Frontend Setup (Terminal 2)
```bash
cd frontend
pnpm install
pnpm dev
```
- **React Application**: `http://localhost:5173` (proxies `/api` to `http://localhost:8000`)

---

## 6. Database Configuration: SQLite ↔ Supabase/PostgreSQL

The backend is **environment-switchable** — the active database is determined by `.env` only. No code changes are needed.

### Option A: Run on SQLite (Default Development — Zero Setup)

`backend/.env` (or root `.env`):
```env
DB_PROVIDER=sqlite
DATABASE_URL="file:../../Database/batanes_niche.db"
```

Then run the TypeScript backend normally:
```cmd
:: From project root
start-ts.bat

:: Or from terminal (TypeScript backend):
cd backend
pnpm db:migrate   # sync schema + push to SQLite + seed demo data
pnpm dev
```

Verify: `GET http://localhost:8000/ready` → `{ "provider": "sqlite", "status": "ready" }`

---

### Option B: Switch to Supabase / PostgreSQL (Production Simulation)

#### Step 1 — Update `backend/.env` (no code changes):
```env
DB_PROVIDER=postgres

# Supabase Transaction Pooler (port 6543) — used by the app:
DATABASE_URL="postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres?pgbouncer=true"

# Supabase Direct Connection (port 5432) — used by Prisma schema push:
DIRECT_URL="postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:5432/postgres"

# For local Docker Postgres instead of Supabase:
# DATABASE_URL="postgresql://batanes_user:change_me_in_production@localhost:5432/batanes_niche"
# DB_SSL=false
```

#### Step 2 — Push schema and seed:
```cmd
cd backend

:: Sync schema.prisma provider, push schema, seed demo data
pnpm db:migrate
```
This command:
1. Detects `DB_PROVIDER=postgres` and updates `schema.prisma` to `provider = "postgresql"`
2. Runs `prisma db push` against your Supabase/PostgreSQL instance
3. Runs the idempotent TypeScript seed (admin + demo employer + demo seeker + sample jobs)

#### Step 3 — Start the server:
```cmd
pnpm dev
```
Verify: `GET http://localhost:8000/ready` → `{ "provider": "postgresql", "status": "ready" }`

> [!NOTE]
> **Admin sessions are not portable across backends.** When switching between the FastAPI and TypeScript backend (or between SQLite and PostgreSQL), re-login at `http://localhost:8000/admin` since the admin session cookie signer differs.

#### Available database commands (from root or `backend/`):
| Command | Purpose |
|---|---|
| `pnpm db:setup` | **1-Command Database Setup**: Creates SQLite file/folder if missing, pushes schema, and seeds baseline + sample data idempotently inside transactions |
| `pnpm db:reset` | Clean wipe/drop all tables & recreate with fresh seed data (dev only, strictly refuses in production) |
| `pnpm db:seed` | Run idempotent baseline + sample data seed (skips existing records) |
| `pnpm db:push` | Sync `schema.prisma` + push schema directly to the active database |
| `pnpm db:migrate` | Alias for `pnpm db:setup` |
| `development\scripts\init-db.bat` | Windows batch 1-click database setup script |

#### CLI Options for `init-db.ts`:
You can pass flags to `pnpm db:setup -- [options]` or `ts-node development/scripts/init-db.ts [options]`:
- `--help`, `-h`: Show usage instructions and available options.
- `--reset`: Drop and recreate the SQLite database cleanly before seeding (guarded against production & remote PostgreSQL).
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

### Backend Test Suite (Pytest + Coverage)
```bash
cd backend
pytest tests/ --cov=app --cov-report=term-missing
```

### Frontend Test Suite (Vitest + Jargon Scan)
```bash
cd frontend
pnpm test
pnpm build
```

---

## 8. Administrative Portal (`/admin`)

The administrative portal is hosted on the FastAPI backend under `/admin`:
- **Security**: Authenticated via signed HttpOnly session cookies (`batanes_admin_session`) with a 12-hour timeout.
- **CSRF Protection**: Enforced on all POST actions via `batanes_admin_csrf`.
- **Immediate Suspension Guard**: Suspended administrators or users are rejected immediately on every request.
- **Initial Account Creation**:
  ```bash
  cd backend
  python -m app.cli create-admin \
    --username admin \
    --email admin@batanesniche.ph \
    --password "AdminSecure123!" \
    --full-name "Platform Administrator"
  ```

---

## 9. Deployment Overview

Production uses **Docker Compose** fronted by **Nginx**:
- **Nginx**: Terminates SSL, routes `/api/` and `/admin` to FastAPI, serves static React SPA assets with long-term caching, and handles SPA fallback routing.
- **PostgreSQL 16**: Enterprise database with automated WAL backups.
- **Non-Root Containers**: Backend runs under unprivileged user `appuser` (UID 1001).

For the complete 19-step production deployment runbook, refer to [`development/setup/PRODUCTION_SETUP.md`](./development/setup/PRODUCTION_SETUP.md).

---

## 9. Comprehensive Developer Documentation Catalog

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
| **11** | [**Administrative UI**](./development/Documentation/11-Administrative-UI.md) | Server-rendered Jinja2 admin interface (`/admin`), signed session cookies, CSRF protection, and moderation tools. |
| **12** | [**Notifications and Applications**](./development/Documentation/12-Notifications-and-Applications.md) | Application lifecycle state machine, transactional notification coupling, and applicant contact privacy reveal. |
| **13** | [**Geography and Reference Data**](./development/Documentation/13-Geography-and-Reference-Data.md) | Canonical Batanes geographic hierarchy (3 islands, 6 municipalities, 29 barangays), normalization algorithms, and seeder. |
| **14** | [**Testing and Quality**](./development/Documentation/14-Testing-and-Quality.md) | Testing architecture, backend pytest suite (10 test modules), frontend Vitest suite, zero-jargon tests, and CI gates. |
| **15** | [**Deployment and Operations**](./development/Documentation/15-Deployment-and-Operations.md) | Production Docker compose architecture, Nginx reverse proxy routing, PostgreSQL persistence, migrations, and backups. |
| **16** | [**Data Analysis Reference**](./development/Documentation/16-Data-Analysis-Reference.md) | Analytical guide for researchers: Entity mapping, analytical dimensions, SQL join recipes, and privacy rules. |
| **17** | [**Developer Guide**](./development/Documentation/17-Developer-Guide.md) | Local environment onboarding, virtualenv setup, configuration, CLI tooling, dev servers, and extension recipes. |
| **18** | [**Architecture Decisions**](./development/Documentation/18-Architecture-Decisions.md) | 14 Architectural Decision Records (ADRs) detailing context, rationale, consequences, and alternatives. |
| **19** | [**Skills and Business Type Catalog**](./development/Documentation/19-Skills-and-Business-Type-Catalog.md) | Standardized taxonomy of occupational skills, business industry sectors, and categorization rules. |
| **20** | [**System Flowcharts**](./development/Documentation/20-System-Flowcharts.md) | Comprehensive standard flowchart suite (User Journeys, Role Workflows, Multi-Tier Architecture Execution). |
| **21** | [**Developer Architecture Guide**](./development/Documentation/21-Developer-Architecture-Guide.md) | Practical navigation guide with "Where Do I Modify This?" matrix, code walks, and modification maps. |
| **22** | [**TypeScript Backend Architecture**](./development/Documentation/22-TypeScript-Backend-Architecture.md) | Specification for the Express.js / TypeScript drop-in backend replacement (`backend/`) and Prisma ORM. |
| **23** | [**TypeScript Migration Guide**](./development/Documentation/23-TypeScript-Migration-Guide.md) | Full 30-endpoint API contract audit, technology mapping table, security parity, and migration log. |
| **24** | [**PNPM Migration Guide**](./development/Documentation/24-PNPM-Migration-Guide.md) | Monorepo workspace setup, pnpm topology, `.npmrc` configuration, Dockerfile updates, and verification log. |
| **25** | [**Database Environment Switching**](./development/Documentation/25-Database-Environment-Switching.md) | Dynamic provider synchronization (SQLite ↔ PostgreSQL/Supabase), zero-code environment switching via `.env`, Prisma sync, connection pooling, seed/reset tooling, and health probes. |

---

## 11. License

Developed for the province of Batanes. All rights reserved.
