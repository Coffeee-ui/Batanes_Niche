@echo off
setlocal enabledelayedexpansion

echo ============================================================
echo Batanes Niche Job Portal - Automated Local Setup
echo ============================================================

REM 1. Check Python
python --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Python is not installed or not in PATH. Please install Python 3.11+.
    exit /b 1
)
echo [OK] Python detected.

REM 2. Check Node
node --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Node.js is not installed or not in PATH. Please install Node.js 20+.
    exit /b 1
)
echo [OK] Node.js detected.

REM 3. Set up Backend
echo.
echo [1/4] Setting up Backend Virtual Environment...
cd /d "%~dp0..\..\backend"
if not exist "venv" (
    echo Creating virtual environment in backend\venv...
    python -m venv venv
)
call venv\Scripts\activate.bat
echo Upgrading pip and installing requirements...
python -m pip install --upgrade pip
pip install -r requirements.txt

REM 4. Environment file
cd /d "%~dp0..\.."
if not exist ".env" (
    echo.
    echo [2/4] Creating .env from .env.example...
    copy .env.example .env
) else (
    echo.
    echo [2/4] .env already exists.
)

REM 5. Run Database Migrations
echo.
echo [3/4] Running Database Migrations...
cd /d "%~dp0..\..\backend"
call venv\Scripts\activate.bat
alembic upgrade head

REM 6. Set up Frontend
echo.
echo [4/4] Installing Frontend Dependencies...
cd /d "%~dp0..\..\frontend"
call npm install

echo.
echo ============================================================
echo Setup completed successfully!
echo Run 'development\scripts\start.bat' to launch the application.
echo ============================================================
pause
