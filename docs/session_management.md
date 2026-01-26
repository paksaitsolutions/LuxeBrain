# Session Management System

**Copyright © 2024 Paksa IT Solutions**

## Overview

Complete session management system for tracking and managing user sessions with security features including IP tracking, device information, and force logout capabilities.

## Features

### Backend API

#### 1. List Active Sessions
```
GET /api/admin/sessions
GET /api/admin/sessions?user_id={id}
```

**Response:**
```json
{
  "sessions": [
    {
      "id": 1,
      "user_id": 5,
      "email": "user@example.com",
      "full_name": "John Doe",
      "role": "admin",
      "ip_address": "192.168.1.1",
      "user_agent": "Mozilla/5.0...",
      "device_info": "Chrome",
      "location": "New York, US",
      "last_activity": "2024-01-15T10:30:00",
      "expires_at": "2024-01-15T11:30:00",
      "created_at": "2024-01-15T10:00:00"
    }
  ],
  "total": 1
}
```

#### 2. Force Logout Session
```
DELETE /api/admin/sessions/{session_id}
```

**Response:**
```json
{
  "message": "Session 123 terminated",
  "session_id": 123
}
```

#### 3. Get Session Configuration
```
GET /api/admin/sessions/config
```

**Response:**
```json
{
  "session_timeout": 3600,
  "max_sessions_per_user": 5,
  "idle_timeout": 1800,
  "remember_me_duration": 2592000
}
```

#### 4. Get Session Statistics
```
GET /api/admin/sessions/stats
```

**Response:**
```json
{
  "total_active": 15,
  "active_last_hour": 8,
  "by_role": {
    "admin": 3,
    "super_admin": 1,
    "support": 5,
    "tenant": 6
  }
}
```

### Database Schema

#### sessions Table
```sql
CREATE TABLE sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    token_hash TEXT NOT NULL,
    ip_address TEXT,
    user_agent TEXT,
    device_info TEXT,
    location TEXT,
    last_activity TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
);

CREATE INDEX idx_sessions_user_id ON sessions(user_id);
CREATE INDEX idx_sessions_token_hash ON sessions(token_hash);
CREATE INDEX idx_sessions_expires_at ON sessions(expires_at);
```

### Frontend UI

**Location:** `/admin/sessions`

**Features:**
- Stats cards showing total active, active last hour, session timeout, idle timeout
- Sessions by role breakdown
- Detailed session table with:
  - User information (name, email, role)
  - Device information with icons
  - IP address tracking
  - Location (if available)
  - Last activity with "time ago" formatting
  - Expiration time
  - Terminate button for force logout
- Session configuration panel
- Security features info panel
- Refresh button for real-time updates

### Security Features

1. **IP Tracking:** All sessions record originating IP address
2. **Device Info:** Browser and device information captured
3. **User Agent:** Full user agent string stored
4. **Auto-Expiry:** Sessions expire after configured timeout
5. **Idle Detection:** Inactive sessions terminated
6. **Force Logout:** Admins can terminate any session
7. **Audit Trail:** All session actions logged in user_activities

### Integration

#### Login Flow
When user logs in:
1. JWT token generated
2. Token hash created (SHA-256)
3. Session record created in database
4. Session includes: user_id, token_hash, IP, user_agent, device_info
5. Activity logged in user_activities table

#### Logout Flow
When user logs out:
1. Token hash calculated from JWT
2. Session record deleted from database
3. Activity logged in user_activities table

### Maintenance

#### Cleanup Expired Sessions
```bash
python scripts/cleanup_sessions.py
```

This script:
- Finds all sessions where expires_at < current time
- Deletes expired sessions
- Reports count of cleaned sessions

**Recommended:** Run as cron job every hour

### Testing

```bash
python scripts/test_sessions.py
```

Tests:
1. Admin login
2. List active sessions
3. Get session statistics
4. Get session configuration

### Configuration

Session timeouts can be configured in the backend:

```python
# api/routes/admin_sessions.py
{
    "session_timeout": 3600,        # 1 hour
    "max_sessions_per_user": 5,     # 5 concurrent sessions
    "idle_timeout": 1800,           # 30 minutes
    "remember_me_duration": 2592000 # 30 days
}
```

### API Permissions

All session management endpoints require admin authentication:
- `verify_admin` middleware checks for admin/super_admin role
- JWT token required in Authorization header
- Actions logged in audit trail

### Future Enhancements

- [ ] Session timeout configuration UI
- [ ] Geolocation lookup for IP addresses
- [ ] Session activity timeline
- [ ] Suspicious session detection
- [ ] Email notifications for new sessions
- [ ] 2FA requirement for sensitive sessions
- [ ] Session replay protection
- [ ] Device fingerprinting

## Files Modified/Created

### Backend
- `api/models/database_models.py` - Added Session model
- `api/routes/admin_sessions.py` - Complete rewrite with all endpoints
- `api/routes/auth.py` - Added session creation/deletion
- `scripts/migrations/add_sessions_table.py` - Database migration
- `scripts/cleanup_sessions.py` - Cleanup script
- `scripts/test_sessions.py` - Test script

### Frontend
- `frontend/apps/admin/app/(admin)/sessions/page.tsx` - Complete UI rewrite

### Documentation
- `docs/session_management.md` - This file

## Summary

✅ Complete backend API with 4 endpoints
✅ Database table with proper indexes
✅ Frontend UI with stats and detailed view
✅ Security features (IP, device, user agent tracking)
✅ Auth integration (create on login, delete on logout)
✅ Cleanup script for expired sessions
✅ Test script for verification
✅ Comprehensive documentation

The session management system is production-ready and fully integrated with the existing authentication system.
