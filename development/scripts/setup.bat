@echo off
setlocal enabledelayedexpansion

echo ============================================================
echo Batanes Niche Job Portal - Automated Local Setup
echo ============================================================

REM 1. Check Node & pnpm
node --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Node.js is not installed or not in PATH. Please install Node.js 20+.
    exit /b 1
)
echo [OK] Node.js detected.

pnpm --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] pnpm is not installed. Run: npm install -g pnpm or corepack enable
    exit /b 1
)
echo [OK] pnpm detected.

REM 2. Environment file
cd /d "%~dp0..\.."
if not exist ".env" (
    echo.
    echo [1/4] Creating .env from .env.example...
    copy .env.example .env
) else (
    echo.
    echo [1/4] .env already exists.
)

REM 3. Set up Workspace Dependencies (Root, Backend, Frontend)
echo.
echo [2/4] Installing Workspace Dependencies via pnpm...
cd /d "%~dp0..\.."
call pnpm install

REM 4. Generate Prisma Client
echo.
echo [3/4] Generating Prisma Client...
cd /d "%~dp0..\..\backend"
call pnpm run prisma:generate

REM 5. Initialize SQLite Database & Seed Data
echo.
echo [4/4] Initializing SQLite Database and Seed Data...
cd /d "%~dp0..\.."
call pnpm db:setup

echo.
echo ============================================================
echo Setup completed successfully!
echo Run 'development\scripts\start.bat' to launch the application.
echo ============================================================
pause