# Troubleshooting Guide

**Copyright © 2024 Paksa IT Solutions**

## Authentication Issues

### Issue: 401 Unauthorized on Admin Panel

**Symptoms:**
```
GET /api/admin/anomalies/count HTTP/1.1" 401 Unauthorized
Tenant: unknown | User: unknown
```

**Causes:**
1. Browser cache not updated with new code
2. Token expired or missing
3. Not logged in

**Solutions:**

#### Solution 1: Hard Refresh Browser
```
Windows/Linux: Ctrl + Shift + R
Mac: Cmd + Shift + R
```

#### Solution 2: Clear Browser Cache
1. Open DevTools (F12)
2. Right-click refresh button
3. Select "Empty Cache and Hard Reload"

#### Solution 3: Restart Frontend Dev Server
```bash
# Stop the server (Ctrl+C)
cd frontend/apps/admin
npm run dev
```

#### Solution 4: Clear localStorage and Re-login
1. Open DevTools (F12)
2. Go to Application tab
3. Clear localStorage
4. Refresh page
5. Login again at http://localhost:3001/login

#### Solution 5: Check Token in localStorage
1. Open DevTools (F12)
2. Go to Console tab
3. Type: `localStorage.getItem('token')`
4. If null, you need to login
5. If present, check if it's valid

### Issue: Token Expired

**Symptoms:**
- Was logged in, now getting 401 errors
- Token exists but still unauthorized

**Solution:**
1. Logout: Click "Logout" button in sidebar
2. Login again: http://localhost:3001/login
3. Credentials: admin@luxebrain.ai / Zafar@1980

### Issue: CORS Errors

**Symptoms:**
```
Access to fetch at 'http://localhost:8000' from origin 'http://localhost:3001' 
has been blocked by CORS policy
```

**Solution:**
1. Check backend is running: http://localhost:8000/health
2. Verify CORS settings in `api/main.py`
3. Restart backend server

## Database Issues

### Issue: Database Not Found

**Symptoms:**
```
sqlalchemy.exc.OperationalError: no such table: users
```

**Solution:**
```bash
cd d:\LuxeBrain
python scripts\create_rbac_tables.py
python scripts\init_rbac.py
```

### Issue: Database Locked

**Symptoms:**
```
sqlite3.OperationalError: database is locked
```

**Solution:**
1. Close all database connections
2. Restart backend server
3. If persists, delete `luxebrain.db` and recreate

## Backend Issues

### Issue: Backend Not Starting

**Symptoms:**
```
ModuleNotFoundError: No module named 'fastapi'
```

**Solution:**
```bash
cd d:\LuxeBrain
pip install -r requirements.txt
```

### Issue: Port Already in Use

**Symptoms:**
```
ERROR: [Errno 10048] error while attempting to bind on address ('0.0.0.0', 8000)
```

**Solution:**
```bash
# Windows
netstat -ano | findstr :8000
taskkill /PID <PID> /F

# Then restart
python -m uvicorn api.main:app --reload
```

## Frontend Issues

### Issue: Frontend Not Starting

**Symptoms:**
```
Error: Cannot find module 'next'
```

**Solution:**
```bash
cd frontend/apps/admin
npm install
npm run dev
```

### Issue: Port Already in Use

**Symptoms:**
```
Error: listen EADDRINUSE: address already in use :::3001
```

**Solution:**
```bash
# Windows
netstat -ano | findstr :3001
taskkill /PID <PID> /F

# Then restart
npm run dev
```

## Common Fixes

### Fix 1: Complete Restart
```bash
# Stop all servers (Ctrl+C in each terminal)

# Backend
cd d:\LuxeBrain
python -m uvicorn api.main:app --reload

# Admin Frontend (new terminal)
cd d:\LuxeBrain\frontend\apps\admin
npm run dev

# Tenant Frontend (new terminal)
cd d:\LuxeBrain\frontend\apps\tenant
npm run dev
```

### Fix 2: Clear All Caches
```bash
# Backend
cd d:\LuxeBrain
del /f /q __pycache__\*.*
del /f /q api\__pycache__\*.*

# Frontend
cd frontend\apps\admin
rmdir /s /q .next
npm run dev
```

### Fix 3: Reinstall Dependencies
```bash
# Backend
cd d:\LuxeBrain
pip install -r requirements.txt --force-reinstall

# Frontend
cd frontend\apps\admin
rmdir /s /q node_modules
npm install
```

## Quick Checks

### Check 1: Backend Health
```bash
curl http://localhost:8000/health
# Expected: {"status": "healthy"}
```

### Check 2: Database Status
```bash
cd d:\LuxeBrain
python scripts\check_db_status.py
```

### Check 3: Admin Login
```bash
curl -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"admin@luxebrain.ai\",\"password\":\"Zafar@1980\"}"
# Expected: {"access_token": "...", "token_type": "bearer"}
```

### Check 4: Token Validation
```bash
curl -H "Authorization: Bearer <your_token>" \
  http://localhost:8000/api/admin/anomalies/count
# Expected: {"count": 0}
```

## Environment Issues

### Issue: Missing Environment Variables

**Symptoms:**
```
KeyError: 'JWT_SECRET_KEY'
```

**Solution:**
```bash
cd d:\LuxeBrain
copy .env.example .env
# Edit .env and set all required variables
```

### Issue: Wrong Python Version

**Symptoms:**
```
SyntaxError: invalid syntax
```

**Solution:**
```bash
python --version
# Should be Python 3.10+
# If not, install Python 3.10 or higher
```

## Browser-Specific Issues

### Chrome/Edge
1. Open DevTools (F12)
2. Go to Network tab
3. Check "Disable cache" checkbox
4. Refresh page

### Firefox
1. Open DevTools (F12)
2. Go to Network tab
3. Click gear icon
4. Check "Disable HTTP cache"
5. Refresh page

### Safari
1. Develop menu → Empty Caches
2. Hard refresh (Cmd+Shift+R)

## Still Having Issues?

### Collect Debug Information
```bash
# Backend logs
cd d:\LuxeBrain
python -m uvicorn api.main:app --reload > backend.log 2>&1

# Frontend logs
cd frontend\apps\admin
npm run dev > frontend.log 2>&1

# Database status
python scripts\check_db_status.py > db_status.txt
```

### Contact Support
- Email: support@paks.com.pk
- Include: backend.log, frontend.log, db_status.txt
- Describe: What you were trying to do
- Describe: What error you saw

## Prevention Tips

1. **Always hard refresh after code changes**
2. **Check backend logs for errors**
3. **Keep token fresh (login every 24 hours)**
4. **Don't edit .env in production**
5. **Backup database before major changes**
6. **Use version control (git)**
7. **Test in incognito mode**
8. **Clear cache regularly**

## Quick Reference

### URLs
- Backend API: http://localhost:8000
- API Docs: http://localhost:8000/docs
- Admin Panel: http://localhost:3001
- Tenant App: http://localhost:3000
- Marketing: http://localhost:3002

### Credentials
- Admin: admin@luxebrain.ai / Zafar@1980

### Commands
```bash
# Start backend
python -m uvicorn api.main:app --reload

# Start admin frontend
cd frontend/apps/admin && npm run dev

# Initialize database
python scripts\setup_admin.bat

# Check database
python scripts\check_db_status.py
```
