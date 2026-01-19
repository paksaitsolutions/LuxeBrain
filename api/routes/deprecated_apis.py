"""
Deprecated API admin routes
Copyright © 2024 Paksa IT Solutions. All Rights Reserved.
"""
from fastapi import APIRouter, Query
from api.models.database_models import DeprecatedApiLog, SessionLocal
from api.middleware.deprecation import DEPRECATED_ENDPOINTS
from datetime import datetime
from sqlalchemy import func

router = APIRouter(prefix="/api/admin/deprecated-apis", tags=["admin"])

@router.get("/list")
async def get_deprecated_endpoints():
    """Get list of deprecated endpoints"""
    return [{
        "endpoint": endpoint,
        "sunset_date": info["sunset_date"],
        "replacement": info["replacement"],
        "message": info["message"]
    } for endpoint, info in DEPRECATED_ENDPOINTS.items()]

@router.get("/usage")
async def get_deprecated_usage(
    limit: int = Query(100, le=500),
    tenant_id: str = Query(None),
    endpoint: str = Query(None)
):
    """Get deprecated API usage logs"""
    db = SessionLocal()
    try:
        query = db.query(DeprecatedApiLog)
        
        if tenant_id:
            query = query.filter(DeprecatedApiLog.tenant_id == tenant_id)
        if endpoint:
            query = query.filter(DeprecatedApiLog.endpoint == endpoint)
        
        logs = query.order_by(DeprecatedApiLog.created_at.desc()).limit(limit).all()
        
        return [{
            "id": log.id,
            "endpoint": log.endpoint,
            "method": log.method,
            "tenant_id": log.tenant_id,
            "sunset_date": log.sunset_date,
            "replacement": log.replacement,
            "ip_address": log.ip_address,
            "created_at": log.created_at.isoformat()
        } for log in logs]
    finally:
        db.close()

@router.get("/stats")
async def get_deprecation_stats():
    """Get deprecation statistics"""
    db = SessionLocal()
    try:
        total = db.query(func.count(DeprecatedApiLog.id)).scalar()
        today = db.query(func.count(DeprecatedApiLog.id)).filter(
            DeprecatedApiLog.created_at >= datetime.utcnow().date()
        ).scalar()
        
        by_endpoint = db.query(
            DeprecatedApiLog.endpoint,
            func.count(DeprecatedApiLog.id).label("count")
        ).group_by(
            DeprecatedApiLog.endpoint
        ).all()
        
        return {
            "total_usage": total,
            "usage_today": today,
            "by_endpoint": [{
                "endpoint": endpoint,
                "count": count
            } for endpoint, count in by_endpoint]
        }
    finally:
        db.close()

@router.get("/tenants-affected")
async def get_affected_tenants():
    """Get tenants still using deprecated APIs"""
    db = SessionLocal()
    try:
        results = db.query(
            DeprecatedApiLog.tenant_id,
            DeprecatedApiLog.endpoint,
            func.count(DeprecatedApiLog.id).label("usage_count")
        ).filter(
            DeprecatedApiLog.tenant_id.isnot(None)
        ).group_by(
            DeprecatedApiLog.tenant_id,
            DeprecatedApiLog.endpoint
        ).order_by(
            func.count(DeprecatedApiLog.id).desc()
        ).all()
        
        return [{
            "tenant_id": tenant_id,
            "endpoint": endpoint,
            "usage_count": count
        } for tenant_id, endpoint, count in results]
    finally:
        db.close()
