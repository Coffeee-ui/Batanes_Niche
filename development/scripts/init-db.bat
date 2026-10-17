@echo off
setlocal

echo ============================================================
echo Batanes Niche Job Portal - Database Setup ^& Seeder
echo ============================================================

set ROOT_DIR=%~dp0..\..

cd /d "%ROOT_DIR%"
call pnpm db:setup %*

if errorlevel 1 (
    echo.
    echo [ERROR] Database setup encountered an error.
    exit /b 1
)

echo.
echo Database setup completed successfully.
