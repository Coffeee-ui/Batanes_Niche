# 17 - Developer Guide & Extension Manual

## 1. System Requirements & Prerequisites

Before setting up the **Batanes Niche Job Portal** locally, ensure your machine satisfies the following prerequisites:

| Tool / Runtime | Minimum Version | Verified Version | Purpose |
|---|---|---|---|
| **Node.js** | `20.0.0` (LTS) | `20.x` | Backend runtime (TypeScript/Express.js), Frontend development |
| **pnpm** | `9.0.0` | `12.x` | Package manager for monorepo workspace |
| **Git** | `2.40.0` | Latest | Version control |

---

## 2. Local Environment Setup

### 2.1 Clone the Repository
```bash
git clone https://github.com/YourOrg/Batanes_Niche.git
cd Batanes_Niche
```

---

### 2.2 Backend Setup (TypeScript Express + Prisma)

#### Step 1: Install Dependencies
```bash
# From workspace root:
pnpm install
```

#### Step 2: Configure Environment Variables
Copy and edit the example `.env`:
```bash
# From workspace root:
cp .env.example .env
```
Key configuration items:
```env
ENVIRONMENT=development
DEBUG=true
APP_NAME="Batanes Niche Job Portal"
BASE_URL="http://localhost:8000"
PORT=8000

# Local SQLite Database (via Prisma) — Default
DB_PROVIDER=sqlite
DATABASE_URL="file:../../Database/batanes_niche.db"

# JWT Authentication
JWT_SECRET_KEY="batanes-niche-local-development-secret-key-super-secure-high-entropy-64chars-minimum"
JWT_ALGORITHM="HS256"
ACCESS_TOKEN_EXPIRE_MINUTES=15
REFRESH_TOKEN_EXPIRE_DAYS=7

# Admin Session Secret (HMAC-SHA256)
ADMIN_SESSION_SECRET="batanes-niche-admin-session-local-secret-super-secure-high-entropy-64chars"

# CORS
ALLOWED_ORIGINS=["http://localhost:5173","http://127.0.0.1:5173"]

# SMTP (Leave empty for console simulation mode)
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USERNAME=
MAIL_PASSWORD=
MAIL_FROM=noreply@batanesniche.ph
```

#### Step 3: Initialize Database & Seed Demo Data
```powershell
# From project root:
pnpm db:setup
```
This applies the Prisma schema, creates the SQLite database, and seeds both baseline reference data and demo accounts. To switch between SQLite and PostgreSQL/Supabase, see [**23-Database-Environment-Switching.md**](./23-Database-Environment-Switching.md).

#### Step 4: Standalone Seed (Optional)
```powershell
# To re-seed data without pushing schema:
pnpm db:seed

# To clean reset the SQLite database:
pnpm db:reset
```

#### Step 5: Start Backend Development Server
```powershell
# From workspace root:
pnpm dev:backend

# Or from backend directory:
cd backend
pnpm dev
```
- **API Base**: `http://localhost:8000/api/v1`
- **Admin Portal (Nunjucks SSR)**: `http://localhost:8000/admin`
- **Health Check**: `http://localhost:8000/health`
- **Readiness Probe**: `http://localhost:8000/ready`

---
### 2.3 Frontend Setup (React 18 + Vite)

Open a separate terminal in the project root:

```bash
cd frontend
pnpm install
pnpm dev
```
- **React Application**: `http://localhost:5173`
- Vite automatically proxies `/api` requests to `http://localhost:8000`.

---

## 3. Automated Windows Scripts (`development/scripts/`)

For rapid local operations on Windows, pre-configured batch scripts are provided:

| Batch Script | Path | Operation Performed |
|---|---|---|
| **Setup All** | `development\scripts\setup.bat` | Creates backend node_modules, runs Prisma migrate, and installs all workspace pnpm packages. |
| **Start All** | `development\scripts\start.bat` | Launches backend (`:8000`) and frontend (`:5173`) in concurrent terminal processes. |
| **Stop All** | `development\scripts\stop.bat` | Terminates active node and vite processes. |
| **Test All** | `development\scripts\test.bat` | Executes backend test suite followed by frontend Vitest suite. |

---

## 4. Running Automated Tests

### Backend Type Check
```bash
cd backend
pnpm run typecheck
```

### Frontend Tests (vitest)
```bash
cd frontend
pnpm test
pnpm run build
```

---

## 5. Developer Extension Recipes

### Recipe 1: Adding a New REST API Endpoint (TypeScript)
1. **Define Schema**: In `backend/src/schemas/<domain>.ts`, create Zod input and output schemas.
2. **Implement Repository Method**: In `backend/src/repositories/<domain>Repository.ts`, create the required Prisma query method.
3. **Implement Domain Rule**: In `backend/src/services/<domain>Service.ts`, implement validation, authorization, and business logic.
4. **Register Router Endpoint**: In `backend/src/api/v1/<domain>.ts`, create the route handler using the Express Router.
5. **Write Unit Test**: In `backend/tests/test_<domain>.test.ts`, write positive and negative assertions with Jest/Supertest.

### Recipe 2: Adding a New Database Entity
1. **Update Prisma Schema**: In `backend/prisma/schema.prisma`, add the new model definition.
2. **Generate Client & Migration**:
   ```bash
   cd backend
   npx prisma migrate dev --name add_<new_entity>_table
   npx prisma generate
   ```
3. **Create Repository**: Add `backend/src/repositories/<newEntity>Repository.ts`.
4. **Review Migration**: Inspect `backend/prisma/migrations/` for correctness.

### Recipe 3: Adding a New Frontend Page
1. **Create Page Component**: Create `frontend/src/pages/<NewPage>.tsx`.
2. **Implement API Integration**: Call methods in `frontend/src/api/client.ts`.
3. **Register Route**: In `frontend/src/App.tsx`, wrap the page with `Layout` and appropriate route guards (`ProtectedRoute`, `SeekerOnly`, or `EmployerOnly`).
4. **Add Navigation Link**: Update `frontend/src/components/layout/Navbar.tsx`.

---

## 6. Development-Only Demo Mode

To accelerate local feature development, interactive demonstrations, and UI reviews, the platform includes a **Demo Mode**.

> [!CAUTION]
> **Strictly Development-Only Feature**: Demo Mode is designed exclusively for development and demo environments. It must **never** be enabled or deployed to production. The backend explicitly refuses to activate Demo Mode whenever `ENVIRONMENT` is set to `production`, even if `DEMO_MODE=True` is provided in environment variables.

### 6.1 Enabling Demo Mode in Local Development

In `backend/.env`:
```env
# Ensure environment is set to development
ENVIRONMENT=development

# Enable Demo Mode
DEMO_MODE=True
```

To disable Demo Mode (default):
```env
DEMO_MODE=False
```

### 6.2 Available Demo Roles & Canonical Accounts

When active, Demo Mode provides one-click authentication on the login page for existing system roles without manual credential entry:

| Role | Label | Canonical Demo Account | Capabilities |
|---|---|---|---|
| `job_seeker` | **Job Seeker** | `ivatan_guide` (Juan Abad) | Browse full job listings, submit applications, manage saved jobs, edit profile. |
| `employer` | **Employer** | `batanes_inn` (Batanes Seaside Inn & Tours) | Post vacancies, manage listings, review applicants, evaluate recommendations. |
| `admin` | **Administrator** | `admin` (Platform Administrator) | System administration, user moderation, and audit log inspection. |

### 6.3 Security & Production Safeguards
1. **Authoritative Backend Control**: The frontend never determines whether Demo Mode is available. It queries `GET /api/v1/auth/demo-status` on mount; if the backend reports disabled or in production, demo controls are omitted.
2. **Production Invariant**: If `ENVIRONMENT` is `production`, `is_demo_mode_active` is always `False`. Any attempt to call `POST /api/v1/auth/demo-login` returns `HTTP 404 Not Found`.
3. **Zero Frontend Credential Exposure**: No usernames, passwords, or hashes exist in frontend code or API responses. The client sends only `{ "role": "<role>" }`.
4. **Standard Session Output**: Successful demo authentication produces standard JWT access and refresh tokens via `AuthService._issue_tokens()`, ensuring normal session management remains intact.
5. **Audit Logging**: All demo logins are recorded in `audit_logs` under the `DEMO_LOGIN` action.

---

## 7. Common Pitfalls & Developer Gotchas

1. **Do NOT Invent New Endpoints for Chat**: Version 2 does **not** support real-time chat or WebSockets. Communication relies on the application state machine, persistent in-app notifications, and authorized phone/email.
2. **Do NOT Hardcode Geography**: Never hardcode Batanes municipalities or barangays in strings. Always reference `backend/src/core/geography.ts` or fetch from `/api/v1/meta/options`.
3. **Zero Technical Jargon in Public UI**: Do not display system terms like *Express.js*, *Prisma*, *PostgreSQL*, *JWT*, or *Zod* in user-facing components.
4. **Admin UI Isolation**: Never import React components into Nunjucks templates or vice versa. Admin screens belong strictly in `backend/src/templates/`.

---

## 8. Next Steps

- To review the 16 Architecture Decision Records (ADRs), see [**18-Architecture-Decisions.md**](./18-Architecture-Decisions.md).
- To examine API contracts, see [**05-API-Architecture.md**](./05-API-Architecture.md).
- For the full production runbook, see [**15-Deployment-and-Operations.md**](./15-Deployment-and-Operations.md).
