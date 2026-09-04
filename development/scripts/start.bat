@echo off
setlocal

echo ============================================================
echo Starting Batanes Niche Job Portal Development Environment
echo ============================================================

set ROOT_DIR=%~dp0..\..

echo Starting Backend Server on http://localhost:8000 ...
start "Batanes Backend (FastAPI)" cmd /k "cd /d "%ROOT_DIR%\backend" && call venv\Scripts\activate.bat && uvicorn app.main:app --reload --port 8000"

echo Starting Frontend Dev Server on http://localhost:5173 ...
start "Batanes Frontend (Vite)" cmd /k "cd /d "%ROOT_DIR%\frontend" && npm run dev"

echo.
echo ============================================================
echo Services are launching in separate windows:
echo - Frontend SPA:         http://localhost:5173
echo - Backend API Docs:     http://localhost:8000/docs
echo - Admin Portal (Jinja): http://localhost:8000/admin
echo - Health Check:         http://localhost:8000/health
echo.
echo To stop services, run 'development\scripts\stop.bat'
echo ============================================================
