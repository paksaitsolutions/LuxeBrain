"""
Slow Query admin routes
Copyright © 2024 Paksa IT Solutions. All Rights Reserved.
"""
from fastapi import APIRouter, Query
from api.models.database_models import SlowQueryLog
from config.database import SessionLocal
from datetime import datetime, timedelta
from sqlalchemy import func

router = APIRouter(prefix="/api/admin/slow-queries", tags=["admin"])

@router.get("/recent")
async def get_recent_slow_queries(
    limit: int = Query(50, le=200),
    tenant_id: str = Query(None),
    endpoint: str = Query(None)
):
    """Get recent slow queries"""
    db = SessionLocal()
    try:
        query = db.query(SlowQueryLog)
        
        if tenant_id:
            query = query.filter(SlowQueryLog.tenant_id == tenant_id)
        if endpoint:
            query = query.filter(SlowQueryLog.endpoint.like(f"%{endpoint}%"))
        
        logs = query.order_by(SlowQueryLog.duration.desc()).limit(limit).all()
        
        return [{
            "id": log.id,
            "method": log.method,
            "endpoint": log.endpoint,
            "duration": log.duration,
            "tenant_id": log.tenant_id,
            "query_params": log.query_params,
            "created_at": log.created_at.isoformat()
        } for log in logs]
    finally:
        db.close()

@router.get("/stats")
async def get_slow_query_stats():
    """Get slow query statistics"""
    db = SessionLocal()
    try:
        total = db.query(func.count(SlowQueryLog.id)).scalar()
        today = db.query(func.count(SlowQueryLog.id)).filter(
            SlowQueryLog.created_at >= datetime.utcnow().date()
        ).scalar()
        
        avg_duration = db.query(func.avg(SlowQueryLog.duration)).scalar()
        max_duration = db.query(func.max(SlowQueryLog.duration)).scalar()
        
        return {
            "total_slow_queries": total,
            "slow_queries_today": today,
            "avg_duration": round(avg_duration, 3) if avg_duration else 0,
            "max_duration": round(max_duration, 3) if max_duration else 0
        }
    finally:
        db.close()

@router.get("/slowest-endpoints")
async def get_slowest_endpoints(limit: int = 10):
    """Get slowest endpoints"""
    db = SessionLocal()
    try:
        results = db.query(
            SlowQueryLog.endpoint,
            func.count(SlowQueryLog.id).label("count"),
            func.avg(SlowQueryLog.duration).label("avg_duration"),
            func.max(SlowQueryLog.duration).label("max_duration")
        ).group_by(
            SlowQueryLog.endpoint
        ).order_by(
            func.avg(SlowQueryLog.duration).desc()
        ).limit(limit).all()
        
        return [{
            "endpoint": endpoint,
            "count": count,
            "avg_duration": round(avg_duration, 3),
            "max_duration": round(max_duration, 3)
        } for endpoint, count, avg_duration, max_duration in results]
    finally:
        db.close()
