@echo off
setlocal

echo ============================================================
echo Running Batanes Niche Job Portal Test Suites
echo ============================================================

set ROOT_DIR=%~dp0..\..

echo.
echo [1/2] Running Backend Tests (pytest + coverage)...
cd /d "%ROOT_DIR%\backend"
call venv\Scripts\activate.bat
pytest tests/ --cov=app --cov-report=term-missing
if errorlevel 1 (
    echo [ERROR] Backend tests failed!
    exit /b 1
)

echo.
echo [2/2] Running Frontend Tests (vitest + zero-jargon audit)...
cd /d "%ROOT_DIR%\frontend"
call npm test
if errorlevel 1 (
    echo [ERROR] Frontend tests failed!
    exit /b 1
)

echo.
echo ============================================================
echo ALL TEST SUITES PASSED SUCCESSFULLY!
echo ============================================================
pause
