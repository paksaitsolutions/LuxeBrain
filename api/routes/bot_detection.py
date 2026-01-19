"""
Bot Detection Admin Routes
Copyright © 2024 Paksa IT Solutions
"""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func, desc
from config.database import get_db
from api.models.database_models import BotDetection
from api.middleware.bot_detection import get_bot_stats, BLOCKED_IPS
from datetime import datetime

router = APIRouter(prefix="/api/admin/bot-detection", tags=["Bot Detection"])


@router.get("/stats")
async def get_detection_stats(db: Session = Depends(get_db)):
    """Get bot detection statistics"""
    total_detections = db.query(func.count(BotDetection.id)).scalar()
    
    recent_detections = db.query(BotDetection).filter(
        BotDetection.created_at >= datetime.utcnow().replace(hour=0, minute=0, second=0)
    ).count()
    
    by_reason = db.query(
        BotDetection.reason,
        func.count(BotDetection.id).label('count')
    ).group_by(BotDetection.reason).all()
    
    memory_stats = get_bot_stats()
    
    return {
        "total_detections": total_detections,
        "today_detections": recent_detections,
        "by_reason": {reason: count for reason, count in by_reason},
        "memory_stats": memory_stats
    }


@router.get("/recent")
async def get_recent_detections(limit: int = 50, db: Session = Depends(get_db)):
    """Get recent bot detections"""
    detections = db.query(BotDetection).order_by(
        desc(BotDetection.created_at)
    ).limit(limit).all()
    
    return [{
        "id": d.id,
        "ip_address": d.ip_address,
        "user_agent": d.user_agent[:100],
        "endpoint": d.endpoint,
        "reason": d.reason,
        "request_count": d.request_count,
        "blocked_until": d.blocked_until.isoformat() if d.blocked_until else None,
        "created_at": d.created_at.isoformat()
    } for d in detections]


@router.get("/blocked-ips")
async def get_blocked_ips():
    """Get currently blocked IPs"""
    now = datetime.utcnow()
    active_blocks = {
        ip: exp.isoformat()
        for ip, exp in BLOCKED_IPS.items()
        if exp > now
    }
    
    return {
        "blocked_ips": active_blocks,
        "count": len(active_blocks)
    }


@router.delete("/unblock/{ip}")
async def unblock_ip(ip: str):
    """Unblock an IP address"""
    if ip in BLOCKED_IPS:
        del BLOCKED_IPS[ip]
        return {"message": f"IP {ip} unblocked"}
    
    return {"message": "IP not found in block list"}


@router.get("/honeypot-stats")
async def get_honeypot_stats(db: Session = Depends(get_db)):
    """Get honeypot detection statistics"""
    from api.models.database_models import HoneypotDetection
    
    total = db.query(func.count(HoneypotDetection.id)).scalar()
    today = db.query(HoneypotDetection).filter(
        HoneypotDetection.created_at >= datetime.utcnow().replace(hour=0, minute=0, second=0)
    ).count()
    
    recent = db.query(HoneypotDetection).order_by(
        desc(HoneypotDetection.created_at)
    ).limit(20).all()
    
    return {
        "total": total,
        "today": today,
        "recent": [{
            "id": h.id,
            "ip_address": h.ip_address,
            "user_agent": h.user_agent[:100] if h.user_agent else '',
            "email": h.email,
            "honeypot_value": h.honeypot_value,
            "created_at": h.created_at.isoformat()
        } for h in recent]
    }
