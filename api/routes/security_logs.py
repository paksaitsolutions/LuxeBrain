"""
Security Audit Log admin routes
Copyright © 2024 Paksa IT Solutions. All Rights Reserved.
"""
from fastapi import APIRouter, Query
from api.models.database_models import SecurityAuditLog
from config.database import SessionLocal
from datetime import datetime, timedelta
from sqlalchemy import func

router = APIRouter(prefix="/api/admin/security-logs", tags=["admin"])

@router.get("/recent")
async def get_recent_logs(
    limit: int = Query(100, le=500),
    event_type: str = Query(None),
    user_id: int = Query(None),
    tenant_id: str = Query(None),
    days: int = Query(7, le=90)
):
    """Get recent security audit logs"""
    db = SessionLocal()
    try:
        query = db.query(SecurityAuditLog)
        
        cutoff = datetime.utcnow() - timedelta(days=days)
        query = query.filter(SecurityAuditLog.timestamp >= cutoff)
        
        if event_type:
            query = query.filter(SecurityAuditLog.event_type == event_type)
        if user_id:
            query = query.filter(SecurityAuditLog.user_id == user_id)
        if tenant_id:
            query = query.filter(SecurityAuditLog.tenant_id == tenant_id)
        
        logs = query.order_by(SecurityAuditLog.timestamp.desc()).limit(limit).all()
        
        return [{
            "id": log.id,
            "event_type": log.event_type,
            "user_id": log.user_id,
            "tenant_id": log.tenant_id,
            "ip_address": log.ip_address,
            "details": log.details,
            "timestamp": log.timestamp.isoformat()
        } for log in logs]
    finally:
        db.close()

@router.get("/stats")
async def get_security_stats():
    """Get security audit statistics"""
    db = SessionLocal()
    try:
        total = db.query(func.count(SecurityAuditLog.id)).scalar()
        today = db.query(func.count(SecurityAuditLog.id)).filter(
            SecurityAuditLog.timestamp >= datetime.utcnow().date()
        ).scalar()
        
        by_type = db.query(
            SecurityAuditLog.event_type,
            func.count(SecurityAuditLog.id).label("count")
        ).group_by(SecurityAuditLog.event_type).all()
        
        return {
            "total_events": total,
            "events_today": today,
            "by_type": [{
                "event_type": event_type,
                "count": count
            } for event_type, count in by_type]
        }
    finally:
        db.close()

@router.get("/event-types")
async def get_event_types():
    """Get list of event types"""
    return [
        "login",
        "logout",
        "password_change",
        "password_reset",
        "email_verification",
        "permission_change",
        "failed_login",
        "account_locked",
        "account_unlocked",
        "user_created",
        "user_deleted"
    ]
