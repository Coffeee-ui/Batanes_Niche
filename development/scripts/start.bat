@echo off
setlocal

echo ============================================================
echo Starting Batanes Niche Job Portal Development Environment
echo ============================================================

set ROOT_DIR=%~dp0..\..

echo Starting Backend Server on http://localhost:8000 ...
start "Batanes Backend (TypeScript Express)" cmd /k "cd /d "%ROOT_DIR%\backend" && pnpm dev"

echo Starting Frontend Dev Server on http://localhost:5173 ...
start "Batanes Frontend (Vite)" cmd /k "cd /d "%ROOT_DIR%\frontend" && pnpm dev"

echo.
echo ============================================================
echo Services are launching in separate windows:
echo - Frontend SPA:         http://localhost:5173
echo - Backend API:          http://localhost:8000/api/v1
echo - Admin Portal (SSR):   http://localhost:8000/admin
echo - Health Check:         http://localhost:8000/health
echo - Readiness Check:      http://localhost:8000/ready
echo.
echo To stop services, run 'development\scripts\stop.bat'
echo ============================================================