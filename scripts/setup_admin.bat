@echo off
echo ========================================
echo LuxeBrain Admin Panel Setup
echo Copyright 2024 Paksa IT Solutions
echo ========================================
echo.

echo Step 1: Creating database tables...
python scripts/create_rbac_tables.py
echo.

echo Step 2: Initializing RBAC system...
python scripts/init_rbac.py
echo.

echo Step 3: Checking database status...
python scripts/check_db_status.py
echo.

echo ========================================
echo Setup Complete!
echo ========================================
echo.
echo Admin Panel is now ready to use at:
echo http://localhost:3001
echo.
echo Login with: admin@luxebrain.ai / Zafar@1980
echo.
pause
