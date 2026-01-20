@echo off
echo ========================================
echo LuxeBrain Complete Database Setup
echo Copyright (c) 2024 Paksa IT Solutions
echo ========================================
echo.

echo Step 1: Creating all database tables...
python scripts\create_rbac_tables.py
if %errorlevel% neq 0 (
    echo ERROR: Failed to create tables
    pause
    exit /b 1
)
echo.

echo Step 2: Initializing RBAC roles...
python scripts\init_rbac.py
if %errorlevel% neq 0 (
    echo ERROR: Failed to initialize RBAC
    pause
    exit /b 1
)
echo.

echo Step 3: Adding Tenant table...
python scripts\add_tenant_table.py
if %errorlevel% neq 0 (
    echo ERROR: Failed to add Tenant table
    pause
    exit /b 1
)
echo.

echo Step 4: Initializing plans...
python scripts\init_plans.py
if %errorlevel% neq 0 (
    echo ERROR: Failed to initialize plans
    pause
    exit /b 1
)
echo.

echo Step 5: Checking database status...
python scripts\check_db_status.py
echo.

echo ========================================
echo Setup Complete!
echo ========================================
echo.
echo Database initialized with:
echo - All tables created (36+ tables including Tenant)
echo - RBAC roles (5 roles with permissions)
echo - Plans (4 plans: Free, Starter, Growth, Enterprise)
echo - Tenant table for persistent storage
echo.
echo You can now:
echo 1. Start backend: python -m uvicorn api.main:app --reload
echo 2. Login to admin: http://localhost:3001/login
echo 3. Create tenants with plans from database
echo.
pause
