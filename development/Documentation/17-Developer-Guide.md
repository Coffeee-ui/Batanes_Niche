# 17 - Developer Guide & Extension Manual

> [!IMPORTANT]
> The backend has been migrated to **TypeScript/Express.js** (`backend-ts/`). The Python backend (`backend/`) is preserved as a reference. The sections below cover **both** backends; start with §2.2a (TypeScript) for new development.

## 1. System Requirements & Prerequisites

Before setting up the **Batanes Niche Job Portal** locally, ensure your machine satisfies the following prerequisites:

| Tool / Runtime | Minimum Version | Verified Version | Purpose |
|---|---|---|---|
| **Node.js** | `20.0.0` (LTS) | `20.x` | Backend-ts runtime (TypeScript/Express.js), Frontend development |
| **pnpm** | `9.0.0` | `12.x` | Package manager for workspace, backend-ts, and frontend |
| **Python** | `3.11.0` | `3.11.x` | Legacy Python backend (`backend/`) reference only |
| **Git** | `2.40.0` | Latest | Version control |

---

## 2. Local Environment Setup

### 2.1 Clone the Repository
```bash
git clone https://github.com/YourOrg/Batanes_Niche.git
cd Batanes_Niche
```

---

### 2.2a Backend Setup (TypeScript — Active)

#### Step 1: Install Dependencies
```bash
# From workspace root:
pnpm install

# Or specifically for backend-ts:
cd backend-ts
pnpm install
```

#### Step 2: Configure Environment Variables
Copy and edit the example `.env`:
```bash
# The backend-ts/.env is already scaffolded; edit as needed:
```
```env
ENVIRONMENT=development
DEBUG=True
APP_NAME="Batanes Niche Job Portal"
BASE_URL="http://localhost:8000"
PORT=8000

# Local SQLite Database (via Prisma)
DATABASE_URL="file:../batanes_niche.db"

# JWT Authentication
JWT_SECRET_KEY="batanes-niche-local-development-secret-key-super-secure-high-entropy-64chars-minimum"
JWT_ALGORITHM="HS256"
ACCESS_TOKEN_EXPIRE_MINUTES=15
REFRESH_TOKEN_EXPIRE_DAYS=7

# Admin Session Secret (HMAC-SHA256)
ADMIN_SESSION_SECRET="batanes-niche-admin-session-local-secret-super-secure-high-entropy-64chars"

# CORS
ALLOWED_ORIGINS=http://localhost:5173,http://127.0.0.1:5173

# SMTP (Leave empty for simulation mode)
MAIL_HOST=
MAIL_PORT=587
MAIL_USERNAME=
MAIL_PASSWORD=
MAIL_FROM=noreply@batanesjobs.ph
```

#### Step 3: Generate Prisma Client & Run Migrations
```powershell
npx prisma generate
npx prisma migrate dev --name init
```

#### Step 4: Seed Demonstration Data
```powershell
# (Seed scripts are in backend-ts/prisma/ or via the Python backend seed tool)
# Alternatively, run the Python seed once to populate the shared SQLite file:
Set-Location ..
Set-Location backend
.\venv\Scripts\Activate.ps1
python -m app.cli seed-data
Set-Location ..\backend-ts
```

#### Step 5: Start TypeScript Backend Server
```powershell
# Development (ts-node with watch)
pnpm dev

# Or build and run compiled output
pnpm run build
pnpm start
```
- **API Base**: `http://localhost:8000/api/v1`
- **Admin Portal (Nunjucks SSR)**: `http://localhost:8000/admin`
- **Health Check**: `http://localhost:8000/health`
- **Readiness Probe**: `http://localhost:8000/ready`

Quick start (PowerShell one-liner from project root):
```powershell
pnpm --filter batanes-niche-backend-ts dev
```

---

### 2.2b Backend Setup (Python — Legacy Reference)

#### Step 1: Create and Activate Virtual Environment
```bash
cd backend
python -m venv venv

# Windows PowerShell:
.\venv\Scripts\Activate.ps1

# Windows Command Prompt:
.\venv\Scripts\activate.bat

# Linux / macOS:
source venv/bin/activate
```

#### Step 2: Install Python Dependencies
```bash
pip install --upgrade pip
pip install -r requirements.txt
```

#### Step 3: Configure Environment Variables
Create a `.env` file in the project root or backend directory:
```env
ENVIRONMENT=development
DEBUG=True
APP_NAME="Batanes Niche Job Portal"
BASE_URL="http://localhost:8000"

# Local SQLite Database
DATABASE_URL="sqlite:///./batanes_niche.db"

# JWT Authentication
JWT_SECRET_KEY="batanes-niche-local-development-secret-key-super-secure-high-entropy-64chars-minimum"
JWT_ALGORITHM="HS256"
ACCESS_TOKEN_EXPIRE_MINUTES=15
REFRESH_TOKEN_EXPIRE_DAYS=7

# Administrative Session Secret
ADMIN_SESSION_SECRET="batanes-niche-admin-session-local-secret-super-secure-high-entropy-64chars"

# CORS
ALLOWED_ORIGINS=["http://localhost:5173", "http://127.0.0.1:5173"]

# SMTP (Leave empty for local simulation logging)
MAIL_USERNAME=""
MAIL_PASSWORD=""
```

#### Step 4: Run Database Migrations
```bash
alembic upgrade head
```

#### Step 5: Seed Demonstration Data & Create Admin
```bash
# Seed authentic Batanes reference accounts and vacancies
python -m app.cli seed-data

# (Optional) Provision a custom administrative user
python -m app.cli create-admin \
  --username admin \
  --email admin@batanesniche.ph \
  --password "AdminSecure123!" \
  --full-name "Platform Administrator"
```

#### Step 6: Start Backend Server
```bash
uvicorn app.main:app --reload --port 8000
```
- **API Base**: `http://localhost:8000/api/v1`
- **Interactive Swagger Docs**: `http://localhost:8000/docs`
- **Jinja2 Admin Portal**: `http://localhost:8000/admin`
- **Health Check**: `http://localhost:8000/health`

Shorcut if already implemented
```
 Set-Location backend
.\venv\Scripts\Activate.ps1
python -m app.cli seed-data
uvicorn app.main:app --reload --port 8000
```
or

```
Powershell
Set-Location backend
.\venv\Scripts\python.exe -m uvicorn app.main:app --reload --port 8000

Invoke-WebRequest -Uri http://127.0.0.1:8000/health -UseBasicParsing

Invoke-WebRequest -Uri http://127.0.0.1:8000/admin/login -UseBasicParsing

http://127.0.0.1:8000/admin/login
```

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
| **Setup All** | `development\scripts\setup.bat` | Creates backend-ts node_modules, runs Prisma migrate, and installs all workspace pnpm packages. |
| **Start All** | `development\scripts\start.bat` | Launches backend-ts (`:8000`) and frontend (`:5173`) in concurrent terminal processes. |
| **Stop All** | `development\scripts\stop.bat` | Terminates active node and vite processes. |
| **Test All** | `development\scripts\test.bat` | Executes backend test suite followed by frontend Vitest suite. |

---

## 4. Running Automated Tests

### Backend Type Check
```bash
cd backend-ts
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
1. **Define Schema**: In `backend-ts/src/schemas/<domain>.ts`, create Zod input and output schemas.
2. **Implement Repository Method**: In `backend-ts/src/repositories/<domain>Repository.ts`, create the required Prisma query method.
3. **Implement Domain Rule**: In `backend-ts/src/services/<domain>Service.ts`, implement validation, authorization, and business logic.
4. **Register Router Endpoint**: In `backend-ts/src/api/v1/<domain>.ts`, create the route handler using the Express Router.
5. **Write Unit Test**: In `backend-ts/tests/test_<domain>.test.ts`, write positive and negative assertions with Jest/Supertest.

### Recipe 2: Adding a New Database Entity
1. **Update Prisma Schema**: In `backend-ts/prisma/schema.prisma`, add the new model definition.
2. **Generate Client & Migration**:
   ```bash
   cd backend-ts
   npx prisma migrate dev --name add_<new_entity>_table
   npx prisma generate
   ```
3. **Create Repository**: Add `backend-ts/src/repositories/<newEntity>Repository.ts`.
4. **Review Migration**: Inspect `backend-ts/prisma/migrations/` for correctness.

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
2. **Do NOT Hardcode Geography**: Never hardcode Batanes municipalities or barangays in strings. Always reference `backend-ts/src/core/geography.ts` or fetch from `/api/v1/meta/options`.
3. **Zero Technical Jargon in Public UI**: Do not display system terms like *Express.js*, *Prisma*, *PostgreSQL*, *JWT*, or *Zod* in user-facing components.
4. **Admin UI Isolation**: Never import React components into Nunjucks templates or vice versa. Admin screens belong strictly in `backend-ts/src/templates/`.

---

## 8. Next Steps

- To review the 14 Architecture Decision Records (ADRs), see [**18-Architecture-Decisions.md**](./18-Architecture-Decisions.md).
- To examine API contracts, see [**05-API-Architecture.md**](./05-API-Architecture.md).
- For the full production runbook, see [**15-Deployment-and-Operations.md**](./15-Deployment-and-Operations.md).
