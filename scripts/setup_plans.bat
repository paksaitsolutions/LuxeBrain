@echo off
echo ========================================
echo Plans Database Setup
echo Copyright (c) 2024 Paksa IT Solutions
echo ========================================
echo.

echo Step 1: Creating Plan table...
python scripts\create_rbac_tables.py
echo.

echo Step 2: Initializing plans...
python scripts\init_plans.py
echo.

echo ========================================
echo Setup Complete!
echo ========================================
echo.
echo Plans have been initialized in the database.
echo You can now create tenants with plans from the database.
echo.
pause
