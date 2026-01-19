@echo off
REM LuxeBrain AI - Start All Services
REM Copyright (c) 2024 Paksa IT Solutions

echo ========================================
echo  LuxeBrain AI - Starting All Services
echo ========================================
echo.

REM Check if Redis is running
echo [1/4] Checking Redis...
redis-cli ping >nul 2>&1
if %errorlevel% neq 0 (
    echo Redis not running. Please start Redis first.
    echo Run: redis-server
    pause
    exit /b 1
)
echo Redis: OK

REM Start Backend API
echo.
echo [2/4] Starting Backend API (Port 8000)...
start "LuxeBrain API" cmd /k "cd /d %~dp0 && python -m uvicorn api.main:app --reload --host 0.0.0.0 --port 8000"
timeout /t 3 >nul

REM Start Frontend Apps
echo.
echo [3/4] Starting Frontend Apps...
cd frontend
start "LuxeBrain Frontend" cmd /k "npm run dev"
cd ..
timeout /t 3 >nul

echo.
echo [4/4] All services started!
echo.
echo ========================================
echo  Access URLs:
echo ========================================
echo  Backend API:    http://localhost:8000
echo  API Docs:       http://localhost:8000/docs
echo  Tenant App:     http://localhost:3000
echo  Admin App:      http://localhost:3001
echo  Marketing:      http://localhost:3002
echo ========================================
echo.
echo Press any key to stop all services...
pause >nul

REM Stop all services
taskkill /FI "WindowTitle eq LuxeBrain*" /F >nul 2>&1
echo All services stopped.
