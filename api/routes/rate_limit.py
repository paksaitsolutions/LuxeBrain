"""
Rate limiting admin routes
Copyright © 2024 Paksa IT Solutions. All Rights Reserved.
"""
from fastapi import APIRouter, Depends
from api.middleware.rate_limiter import rate_limiter
from api.models.database_models import RateLimitLog, SessionLocal
from datetime import datetime, timedelta
from sqlalchemy import func

router = APIRouter(prefix="/api/admin/rate-limit", tags=["admin"])

@router.get("/stats")
async def get_rate_limit_stats():
    """Get current rate limiter statistics"""
    stats = rate_limiter.get_stats()
    
    # Get database stats
    db = SessionLocal()
    try:
        total_blocks = db.query(func.count(RateLimitLog.id)).scalar()
        today_blocks = db.query(func.count(RateLimitLog.id)).filter(
            RateLimitLog.created_at >= datetime.utcnow().date()
        ).scalar()
        
        stats["total_blocks_all_time"] = total_blocks
        stats["blocks_today"] = today_blocks
    finally:
        db.close()
    
    return stats

@router.get("/recent-blocks")
async def get_recent_blocks(limit: int = 50):
    """Get recent rate limit blocks from database"""
    db = SessionLocal()
    try:
        blocks = db.query(RateLimitLog).order_by(
            RateLimitLog.created_at.desc()
        ).limit(limit).all()
        
        return [{
            "id": block.id,
            "ip_address": block.ip_address,
            "request_count": block.request_count,
            "endpoint": block.endpoint,
            "user_agent": block.user_agent,
            "created_at": block.created_at.isoformat()
        } for block in blocks]
    finally:
        db.close()

@router.post("/unblock/{ip}")
async def unblock_ip(ip: str):
    """Manually unblock an IP address"""
    if ip in rate_limiter.blocked_ips:
        del rate_limiter.blocked_ips[ip]
        return {"message": f"IP {ip} has been unblocked"}
    return {"message": f"IP {ip} was not blocked"}

@router.get("/top-ips")
async def get_top_ips(limit: int = 20):
    """Get IPs with most blocks"""
    db = SessionLocal()
    try:
        results = db.query(
            RateLimitLog.ip_address,
            func.count(RateLimitLog.id).label("block_count")
        ).group_by(
            RateLimitLog.ip_address
        ).order_by(
            func.count(RateLimitLog.id).desc()
        ).limit(limit).all()
        
        return [{
            "ip_address": ip,
            "block_count": count
        } for ip, count in results]
    finally:
        db.close()
