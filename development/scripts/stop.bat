@echo off
setlocal enabledelayedexpansion

echo ============================================================
echo Stopping Batanes Niche Job Portal Development Servers
echo ============================================================

REM Kill process on port 8000 (Backend)
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":8000" ^| findstr "LISTENING"') do (
    echo Stopping backend process on port 8000 (PID: %%a)...
    taskkill /F /PID %%a >nul 2>&1
)

REM Kill process on port 5173 (Frontend)
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":5173" ^| findstr "LISTENING"') do (
    echo Stopping frontend process on port 5173 (PID: %%a)...
    taskkill /F /PID %%a >nul 2>&1
)

echo.
echo All development services have been stopped.
echo ============================================================
pause
