@echo off
setlocal enabledelayedexpansion

echo ============================================================
echo Batanes Niche Job Portal - Automated Local Setup
echo ============================================================

set "SCRIPT_DIR=%~dp0"
for %%I in ("%SCRIPT_DIR%..\..") do set "ROOT_DIR=%%~fI"

cd /d "%ROOT_DIR%"

REM ------------------------------------------------------------
REM Stage 1/4: Verify System Prerequisites
REM ------------------------------------------------------------
echo.
echo [Stage 1/4] Checking system prerequisites (Node.js 20+, pnpm)...

call node --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] [Stage 1/4] Node.js is not installed or not in PATH. Please install Node.js 20+.
    exit /b 1
)

for /f "tokens=1 delims=v." %%A in ('node --version 2^>nul') do set "NODE_MAJOR=%%A"
if defined NODE_MAJOR (
    if !NODE_MAJOR! LSS 20 (
        echo [ERROR] [Stage 1/4] Node.js version !NODE_MAJOR! detected. Node.js 20 or higher is required.
        exit /b 1
    )
)
echo  [OK] Node.js detected: 
call node --version

call pnpm --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] [Stage 1/4] pnpm is not installed or not in PATH. Run: npm install -g pnpm or corepack enable
    exit /b 1
)
echo  [OK] pnpm detected:
call pnpm --version

REM ------------------------------------------------------------
REM Stage 2/4: Configure Environment Files
REM ------------------------------------------------------------
echo.
echo [Stage 2/4] Configuring environment files...

if not exist ".env" (
    if exist ".env.example" (
        echo  Creating .env from .env.example...
        copy ".env.example" ".env" >nul
        if errorlevel 1 (
            echo [ERROR] [Stage 2/4] Failed to create .env from .env.example.
            exit /b 1
        )
        echo  [OK] .env file created successfully.
    ) else (
        echo [ERROR] [Stage 2/4] .env.example not found in %ROOT_DIR%. Cannot create .env.
        exit /b 1
    )
) else (
    echo  [OK] .env file already exists. Preserving existing configuration.
)

REM ------------------------------------------------------------
REM Stage 3/4: Install Workspace Dependencies via pnpm
REM ------------------------------------------------------------
echo.
echo [Stage 3/4] Installing workspace dependencies via pnpm...

call pnpm install --frozen-lockfile
if errorlevel 1 (
    echo [WARNING] [Stage 3/4] Frozen lockfile install failed. Retrying standard install...
    call pnpm install
    if errorlevel 1 (
        echo.
        echo [ERROR] [Stage 3/4] Workspace dependency installation failed!
        exit /b 1
    )
)
echo  [OK] Workspace dependencies installed successfully.

REM ------------------------------------------------------------
REM Stage 4/4: Database Initialization & Seeding (via init-db.bat)
REM ------------------------------------------------------------
echo.
echo [Stage 4/4] Executing database initialization via init-db.bat...

if not exist "%SCRIPT_DIR%init-db.bat" (
    echo [ERROR] [Stage 4/4] %SCRIPT_DIR%init-db.bat was not found!
    exit /b 1
)

set "DB_ARGS="
for %%A in (%*) do (
    if /i not "%%~A"=="--no-pause" (
        if defined DB_ARGS (
            set "DB_ARGS=!DB_ARGS! %%A"
        ) else (
            set "DB_ARGS=%%A"
        )
    )
)

call "%SCRIPT_DIR%init-db.bat" !DB_ARGS!
if errorlevel 1 (
    echo.
    echo [ERROR] [Stage 4/4] Database initialization failed during setup!
    exit /b 1
)

echo.
echo ============================================================
echo Setup completed successfully!
echo Run 'development\scripts\start.bat' to launch the application.
echo ============================================================

if /i not "%~1"=="--no-pause" if not defined CI pause
exit /b 0
