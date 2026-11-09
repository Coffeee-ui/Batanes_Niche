@echo off
setlocal enabledelayedexpansion

echo ============================================================
echo Batanes Niche Job Portal - Database Setup ^& Seeder
echo ============================================================

set "SCRIPT_DIR=%~dp0"
for %%I in ("%SCRIPT_DIR%..\..") do set "ROOT_DIR=%%~fI"

cd /d "%ROOT_DIR%"

REM ------------------------------------------------------------
REM 1. Handle Help Flag
REM ------------------------------------------------------------
set "IS_HELP=0"
for %%A in (%*) do (
    if "%%~A"=="--help" set "IS_HELP=1"
    if "%%~A"=="-h" set "IS_HELP=1"
)

if "%IS_HELP%"=="1" (
    call pnpm db:setup %*
    exit /b %ERRORLEVEL%
)

REM ------------------------------------------------------------
REM 2. Verify Prerequisites & Environment
REM ------------------------------------------------------------
echo.
echo [Pre-check] Verifying prerequisites...

call node --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] [Pre-check] Node.js is not installed or not in PATH. Please install Node.js 20+.
    exit /b 1
)

call pnpm --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] [Pre-check] pnpm is not installed or not in PATH. Run: npm install -g pnpm or corepack enable
    exit /b 1
)

if not exist ".env" (
    if exist ".env.example" (
        echo  Creating .env from .env.example...
        copy ".env.example" ".env" >nul
        if errorlevel 1 (
            echo [ERROR] [Pre-check] Failed to create .env from .env.example.
            exit /b 1
        )
        echo  [OK] .env file created successfully.
    ) else (
        echo [ERROR] [Pre-check] .env file is missing and .env.example not found in %ROOT_DIR%.
        exit /b 1
    )
)

REM ------------------------------------------------------------
REM 3. Stage 1: Generate Prisma Client
REM ------------------------------------------------------------
echo.
echo [Stage 1/2] Generating Prisma Client...
call pnpm --filter batanes-niche-backend run prisma:generate
if errorlevel 1 (
    echo.
    echo [ERROR] [Stage 1/2] Prisma Client generation failed!
    exit /b 1
)
echo  [OK] Prisma Client generated successfully.

REM ------------------------------------------------------------
REM 4. Stage 2: Initialize SQLite Schema & Seed Data
REM ------------------------------------------------------------
echo.
echo [Stage 2/2] Synchronizing schema and running database seeder...
call pnpm db:setup %*
if errorlevel 1 (
    echo.
    echo [ERROR] [Stage 2/2] Database setup encountered an error!
    exit /b 1
)

echo.
echo ============================================================
echo [OK] Database setup completed successfully.
echo ============================================================
exit /b 0
