@echo off
REM Database Migration Runner
REM Copyright © 2024 Paksa IT Solutions

echo Running database migrations...
echo.

cd /d "%~dp0.."

REM Run Alembic migrations
python -m alembic upgrade head

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ✓ Migrations completed successfully
) else (
    echo.
    echo ✗ Migration failed
    exit /b 1
)

pause
