"""
Admin Session Management Routes
Copyright © 2024 Paksa IT Solutions
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session as DBSession
from api.middleware.auth import verify_admin
from api.models.database_models import Session, User, UserActivity
from config.database import get_db
from datetime import datetime, timedelta
from typing import Optional
import hashlib

router = APIRouter(prefix="/api/admin/sessions", tags=["admin"])


@router.get("")
async def get_active_sessions(
    user_id: Optional[int] = None,
    admin=Depends(verify_admin),
    db: DBSession = Depends(get_db)
):
    """Get all active sessions"""
    query = db.query(
        Session.id,
        Session.user_id,
        Session.ip_address,
        Session.user_agent,
        Session.device_info,
        Session.location,
        Session.last_activity,
        Session.expires_at,
        Session.created_at,
        User.email,
        User.role,
        User.full_name
    ).join(User, Session.user_id == User.id)
    
    # Filter by user_id if provided
    if user_id:
        query = query.filter(Session.user_id == user_id)
    
    # Only active sessions (not expired)
    query = query.filter(Session.expires_at > datetime.utcnow())
    
    # Order by last activity
    query = query.order_by(Session.last_activity.desc())
    
    sessions = query.all()
    
    return {
        "sessions": [
            {
                "id": s.id,
                "user_id": s.user_id,
                "email": s.email,
                "full_name": s.full_name,
                "role": s.role,
                "ip_address": s.ip_address,
                "user_agent": s.user_agent,
                "device_info": s.device_info,
                "location": s.location,
                "last_activity": s.last_activity.isoformat() if s.last_activity else None,
                "expires_at": s.expires_at.isoformat() if s.expires_at else None,
                "created_at": s.created_at.isoformat() if s.created_at else None
            }
            for s in sessions
        ],
        "total": len(sessions)
    }


@router.delete("/{session_id}")
async def force_logout(
    session_id: int,
    admin=Depends(verify_admin),
    db: DBSession = Depends(get_db)
):
    """Force logout a session"""
    session = db.query(Session).filter(Session.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    user = db.query(User).filter(User.id == session.user_id).first()
    
    # Delete session
    db.delete(session)
    
    # Log force logout action
    activity = UserActivity(
        user_id=admin.get('user_id'),
        action="force_logout",
        resource_type="session",
        resource_id=str(session_id),
        details=f"Forced logout session for user {user.email if user else 'unknown'}",
        ip_address="admin",
        user_agent="admin_portal"
    )
    db.add(activity)
    db.commit()
    
    return {
        "message": f"Session {session_id} terminated",
        "session_id": session_id
    }


@router.get("/config")
async def get_session_config(admin=Depends(verify_admin)):
    """Get session configuration"""
    return {
        "session_timeout": 3600,
        "max_sessions_per_user": 5,
        "idle_timeout": 1800,
        "remember_me_duration": 2592000
    }


@router.put("/config")
async def update_session_config(
    config: dict,
    admin=Depends(verify_admin),
    db: DBSession = Depends(get_db)
):
    """Update session configuration"""
    # Log config change
    activity = UserActivity(
        user_id=admin.get('user_id'),
        action="update_session_config",
        resource_type="system",
        resource_id="session_config",
        details=f"Updated session configuration",
        ip_address="admin",
        user_agent="admin_portal"
    )
    db.add(activity)
    db.commit()
    
    return {"message": "Session configuration updated", "config": config}


@router.get("/stats")
async def get_session_stats(admin=Depends(verify_admin), db: DBSession = Depends(get_db)):
    """Get session statistics"""
    now = datetime.utcnow()
    
    # Total active sessions
    total_active = db.query(Session).filter(Session.expires_at > now).count()
    
    # Sessions by role
    sessions_by_role = db.query(
        User.role,
        db.func.count(Session.id)
    ).join(User, Session.user_id == User.id).filter(
        Session.expires_at > now
    ).group_by(User.role).all()
    
    # Active in last hour
    last_hour = now - timedelta(hours=1)
    active_last_hour = db.query(Session).filter(
        Session.last_activity >= last_hour,
        Session.expires_at > now
    ).count()
    
    return {
        "total_active": total_active,
        "active_last_hour": active_last_hour,
        "by_role": {role: count for role, count in sessions_by_role}
    }
