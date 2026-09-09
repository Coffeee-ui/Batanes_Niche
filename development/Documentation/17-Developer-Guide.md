# 17 - Developer Guide & Extension Manual

## 1. System Requirements & Prerequisites

Before setting up the **Batanes Niche Job Portal** locally, ensure your machine satisfies the following prerequisites:

| Tool / Runtime | Minimum Version | Verified Version | Purpose |
|---|---|---|---|
| **Python** | `3.11.0` | `3.11.x` | Backend runtime, SQLAlchemy, Alembic, FastAPI |
| **Node.js** | `20.0.0` (LTS) | `20.15.x` | Frontend development runtime |
| **npm** | `10.0.0` | `10.7.x` | Frontend package manager |
| **Git** | `2.40.0` | Latest | Version control |

---

## 2. Local Environment Setup

### 2.1 Clone the Repository
```bash
git clone https://github.com/YourOrg/Batanes_Niche.git
cd Batanes_Niche
```

---

### 2.2 Backend Setup (FastAPI)

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
npm install
npm run dev
```
- **React Application**: `http://localhost:5173`
- Vite automatically proxies `/api` requests to `http://localhost:8000`.

---

## 3. Automated Windows Scripts (`development/scripts/`)

For rapid local operations on Windows, pre-configured batch scripts are provided:

| Batch Script | Path | Operation Performed |
|---|---|---|
| **Setup All** | `development\scripts\setup.bat` | Creates backend venv, installs all pip dependencies, runs Alembic migrations, and installs all frontend npm packages. |
| **Start All** | `development\scripts\start.bat` | Launches backend (`:8000`) and frontend (`:5173`) in concurrent terminal processes. |
| **Stop All** | `development\scripts\stop.bat` | Terminates active uvicorn and vite processes. |
| **Test All** | `development\scripts\test.bat` | Executes backend pytest suite followed by frontend Vitest suite. |

---

## 4. Running Automated Tests

### Backend Tests (pytest)
```bash
cd backend
pytest tests/ --cov=app --cov-report=term-missing
```

### Frontend Tests (vitest)
```bash
cd frontend
npm test
npm run build
```

---

## 5. Developer Extension Recipes

### Recipe 1: Adding a New REST API Endpoint
1. **Define Schema**: In `backend/app/schemas/<domain>.py`, create Pydantic input and output models.
2. **Implement Repository Method**: In `backend/app/repositories/<domain>_repository.py`, create the required SQLAlchemy query method.
3. **Implement Domain Rule**: In `backend/app/services/<domain>_service.py`, implement validation, authorization, and business logic.
4. **Register Router Endpoint**: In `backend/app/api/v1/<domain>.py`, create the route handler using dependency injection (`db: Session = Depends(get_db)`).
5. **Write Unit Test**: In `backend/tests/test_<domain>.py`, write positive and negative assertions.

### Recipe 2: Adding a New Database Entity
1. **Create Model**: In `backend/app/models/<new_entity>.py`, declare the SQLAlchemy model subclassing `Base`.
2. **Export Model**: In `backend/app/models/__init__.py` and `backend/app/database/base.py`, import the model.
3. **Generate Migration Script**:
   ```bash
   cd backend
   alembic revision --autogenerate -m "add_<new_entity>_table"
   ```
4. **Review & Apply Migration**:
   - Inspect the generated migration in `backend/alembic/versions/`.
   - Run `alembic upgrade head`.

### Recipe 3: Adding a New Frontend Page
1. **Create Page Component**: Create `frontend/src/pages/<NewPage>.tsx`.
2. **Implement API Integration**: Call methods in `frontend/src/api/client.ts`.
3. **Register Route**: In `frontend/src/App.tsx`, wrap the page with `Layout` and appropriate route guards (`ProtectedRoute`, `SeekerOnly`, or `EmployerOnly`).
4. **Add Navigation Link**: Update `frontend/src/components/layout/Navbar.tsx`.

---

## 6. Common Pitfalls & Developer Gotchas

1. **Do NOT Invent New Endpoints for Chat**: Version 2 does **not** support real-time chat or WebSockets. Communication relies on the application state machine, persistent in-app notifications, and authorized phone/email.
2. **Do NOT Hardcode Geography**: Never hardcode Batanes municipalities or barangays in strings. Always reference `backend/app/core/geography.py` or fetch from `/api/v1/meta/options`.
3. **Zero Technical Jargon in Public UI**: Do not display system terms like *FastAPI*, *PostgreSQL*, *JWT*, or *SQLAlchemy* in user-facing components.
4. **Admin UI Isolation**: Never import React components into Jinja2 templates or vice versa. Admin screens belong strictly in `backend/app/admin/templates/`.

---

## 7. Next Steps

- To review the 14 Architecture Decision Records (ADRs), see [**18-Architecture-Decisions.md**](./18-Architecture-Decisions.md).
- To examine API contracts, see [**05-API-Architecture.md**](./05-API-Architecture.md).
- For the full production runbook, see [**15-Deployment-and-Operations.md**](./15-Deployment-and-Operations.md).
