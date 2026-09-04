# Batanes Niche Job Portal - Local Setup Guide (Version 2)

Welcome to the **Batanes Niche Job Portal Version 2**. This guide outlines the steps required to set up, run, and develop both the backend and frontend locally.

---

## 1. Prerequisites

Ensure you have the following installed on your machine:
- **Python**: Version 3.11 or higher
- **Node.js**: Version 20.x or higher (LTS recommended)
- **npm**: Version 10.x or higher
- **Git**: Latest version

---

## 2. Repository Structure

```
Batanes_Niche/
├── backend/                  # FastAPI + SQLAlchemy 2.0 Backend
│   ├── alembic/              # Database schema migrations
│   ├── app/                  # Application core, domains, repositories, admin
│   ├── tests/                # Comprehensive pytest suite (43+ tests, >=85% cov)
│   └── requirements.txt      # Python dependencies
├── frontend/                 # React 18 + Vite + Tailwind SPA
│   ├── src/                  # Design tokens, contexts, components, pages
│   ├── package.json          # Node dependencies & scripts
│   └── vite.config.ts        # Vite configuration & proxy
├── docker/                   # Production Docker & Nginx configurations
├── development/              # Setup, testing, and operational runbooks
│   ├── setup/                # Local and production setup documentation
│   ├── testing/              # Testing contracts and execution guides
│   └── scripts/              # Windows batch utility scripts
└── docker-compose.yml        # Multi-container orchestration
```

---

## 3. Backend Setup

### Step 1: Create and Activate Virtual Environment
Open PowerShell or your command prompt in the project root:

```bash
cd backend
python -m venv venv

# Windows PowerShell:
.\venv\Scripts\Activate.ps1

# Windows Command Prompt:
.\venv\Scripts\activate.bat

# Linux/macOS:
source venv/bin/activate
```

### Step 2: Install Dependencies
```bash
pip install --upgrade pip
pip install -r requirements.txt
```

### Step 3: Configure Environment Variables
Copy the `.env.example` in the root or create a `.env` file:
```bash
cp ../.env.example ../.env
```
Ensure the `.env` contains:
```env
ENVIRONMENT=development
DEBUG=True
SECRET_KEY=dev_secret_key_batanes_niche_minimum_32_chars_long
DATABASE_URL=sqlite+aiosqlite:///./batanes_niche.db
ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_DAYS=7
UPLOAD_DIR=./uploads
```

### Step 4: Run Database Migrations
```bash
alembic upgrade head
```

### Step 5: (Optional) Seed Sample Data
```bash
python -m app.commands.seed_data
```

### Step 6: Start Backend Development Server
```bash
uvicorn app.main:app --reload --port 8000
```
- **API Base**: `http://localhost:8000/api/v1`
- **Interactive OpenAPI Documentation**: `http://localhost:8000/docs`
- **Jinja2 Server-Rendered Admin Portal**: `http://localhost:8000/admin`
- **Health Check**: `http://localhost:8000/health`

---

## 4. Frontend Setup

### Step 1: Install Node Packages
Open a separate terminal in the project root:
```bash
cd frontend
npm install
```

### Step 2: Start Frontend Development Server
```bash
npm run dev
```
The React SPA will be available at:
- `http://localhost:5173`

Vite is preconfigured to automatically proxy `/api` requests to `http://127.0.0.1:8000`.

---

## 5. Automated Local Scripts (Windows)

For streamlined local development on Windows, batch scripts are provided in `development/scripts/`:

- **Setup Everything**: `development\scripts\setup.bat` (creates venv, installs all deps, runs migrations)
- **Start All Services**: `development\scripts\start.bat` (launches backend and frontend concurrently)
- **Stop All Services**: `development\scripts\stop.bat` (terminates active dev processes)
- **Run All Tests**: `development\scripts\test.bat` (executes backend pytest and frontend vitest)

---

## 6. Running Local Tests

### Backend Tests (pytest + coverage)
```bash
cd backend
pytest tests/ --cov=app --cov-report=term-missing
```

### Frontend Tests (vitest)
```bash
cd frontend
npm test
```

---

## 7. Troubleshooting

- **SQLite locking issues (`sqlite3.OperationalError: database is locked`)**:
  Ensure background workers or test runners are terminated before re-running migrations.
- **Port conflicts (8000 or 5173 in use)**:
  Run `netstat -ano | findstr :8000` and kill the corresponding PID with `taskkill /PID <PID> /F`.
- **Admin authentication redirect loop**:
  Verify the user logging into `http://localhost:8000/admin/login` has `role="admin"` in the database.
