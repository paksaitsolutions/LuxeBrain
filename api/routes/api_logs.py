"""
API Logs admin routes
Copyright © 2024 Paksa IT Solutions. All Rights Reserved.
"""
from fastapi import APIRouter, Query
from api.models.database_models import ApiLog
from config.database import SessionLocal
from datetime import datetime, timedelta
from sqlalchemy import func, and_

router = APIRouter(prefix="/api/admin/api-logs", tags=["admin"])

@router.get("/recent")
async def get_recent_logs(
    limit: int = Query(100, le=500),
    tenant_id: str = Query(None),
    endpoint: str = Query(None),
    status_code: int = Query(None),
    method: str = Query(None)
):
    """Get recent API logs with optional filters"""
    db = SessionLocal()
    try:
        query = db.query(ApiLog)
        
        if tenant_id:
            query = query.filter(ApiLog.tenant_id == tenant_id)
        if endpoint:
            query = query.filter(ApiLog.endpoint.like(f"%{endpoint}%"))
        if status_code:
            query = query.filter(ApiLog.status_code == status_code)
        if method:
            query = query.filter(ApiLog.method == method)
        
        logs = query.order_by(ApiLog.created_at.desc()).limit(limit).all()
        
        return [{
            "id": log.id,
            "method": log.method,
            "endpoint": log.endpoint,
            "status_code": log.status_code,
            "response_time": log.response_time,
            "tenant_id": log.tenant_id,
            "user_id": log.user_id,
            "ip_address": log.ip_address,
            "user_agent": log.user_agent,
            "created_at": log.created_at.isoformat()
        } for log in logs]
    finally:
        db.close()

@router.get("/stats")
async def get_api_stats():
    """Get API statistics"""
    db = SessionLocal()
    try:
        total = db.query(func.count(ApiLog.id)).scalar()
        today = db.query(func.count(ApiLog.id)).filter(
            ApiLog.created_at >= datetime.utcnow().date()
        ).scalar()
        
        avg_response_time = db.query(func.avg(ApiLog.response_time)).scalar()
        
        errors = db.query(func.count(ApiLog.id)).filter(
            ApiLog.status_code >= 400
        ).scalar()
        
        errors_today = db.query(func.count(ApiLog.id)).filter(
            and_(
                ApiLog.status_code >= 400,
                ApiLog.created_at >= datetime.utcnow().date()
            )
        ).scalar()
        
        return {
            "total_requests": total,
            "requests_today": today,
            "avg_response_time": round(avg_response_time, 3) if avg_response_time else 0,
            "total_errors": errors,
            "errors_today": errors_today
        }
    finally:
        db.close()

@router.get("/endpoints")
async def get_top_endpoints(limit: int = 10):
    """Get most called endpoints"""
    db = SessionLocal()
    try:
        results = db.query(
            ApiLog.endpoint,
            func.count(ApiLog.id).label("count"),
            func.avg(ApiLog.response_time).label("avg_time")
        ).group_by(
            ApiLog.endpoint
        ).order_by(
            func.count(ApiLog.id).desc()
        ).limit(limit).all()
        
        return [{
            "endpoint": endpoint,
            "count": count,
            "avg_response_time": round(avg_time, 3) if avg_time else 0
        } for endpoint, count, avg_time in results]
    finally:
        db.close()

@router.get("/tenants")
async def get_tenant_usage(limit: int = 10):
    """Get API usage by tenant"""
    db = SessionLocal()
    try:
        results = db.query(
            ApiLog.tenant_id,
            func.count(ApiLog.id).label("count")
        ).filter(
            ApiLog.tenant_id.isnot(None)
        ).group_by(
            ApiLog.tenant_id
        ).order_by(
            func.count(ApiLog.id).desc()
        ).limit(limit).all()
        
        return [{
            "tenant_id": tenant_id,
            "request_count": count
        } for tenant_id, count in results]
    finally:
        db.close()
