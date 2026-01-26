"""
Admin API Keys Routes
Copyright © 2024 Paksa IT Solutions
"""

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from api.middleware.auth import verify_admin
from api.models.database_models import ApiKey
from config.database import get_db
import secrets

router = APIRouter(prefix="/api/admin/api-keys", tags=["admin"])


class ApiKeyCreate(BaseModel):
    name: str
    tenant_id: str
    permissions: list = []
    expires_at: str = None


@router.get("")
async def get_api_keys(admin=Depends(verify_admin), db: Session = Depends(get_db)):
    """Get all API keys"""
    keys = db.query(ApiKey).all()
    return {"keys": [{
        "id": k.id,
        "name": k.name,
        "key": k.key[:8] + "..." + k.key[-4:],
        "tenant_id": k.tenant_id,
        "permissions": k.permissions or [],
        "expires_at": k.expires_at,
        "last_used_at": k.last_used_at,
        "revoked": k.revoked,
        "created_at": k.created_at
    } for k in keys]}


@router.post("")
async def create_api_key(req: ApiKeyCreate, admin=Depends(verify_admin), db: Session = Depends(get_db)):
    """Create API key with permissions"""
    key = "lxb_" + secrets.token_urlsafe(32)
    
    api_key = ApiKey(
        key=key,
        name=req.name,
        tenant_id=req.tenant_id,
        permissions=req.permissions,
        expires_at=req.expires_at
    )
    db.add(api_key)
    db.commit()
    
    return {"message": "API key created", "key": key}


@router.put("/{key_id}")
async def update_api_key_permissions(
    key_id: int,
    permissions: list,
    admin=Depends(verify_admin),
    db: Session = Depends(get_db)
):
    """Update API key permissions"""
    api_key = db.query(ApiKey).filter(ApiKey.id == key_id).first()
    if not api_key:
        raise HTTPException(status_code=404, detail="API key not found")
    
    api_key.permissions = permissions
    db.commit()
    
    return {"message": "Permissions updated"}


@router.delete("/{key_id}")
async def revoke_api_key(key_id: int, admin=Depends(verify_admin), db: Session = Depends(get_db)):
    """Revoke API key"""
    api_key = db.query(ApiKey).filter(ApiKey.id == key_id).first()
    if not api_key:
        raise HTTPException(status_code=404, detail="API key not found")
    
    api_key.revoked = True
    db.commit()
    
    return {"message": "API key revoked"}


@router.get("/permissions/available")
async def get_available_permissions(admin=Depends(verify_admin)):
    """Get list of available permissions"""
    return {"permissions": [
        {"value": "products:read", "label": "Products - Read"},
        {"value": "products:write", "label": "Products - Write"},
        {"value": "orders:read", "label": "Orders - Read"},
        {"value": "orders:write", "label": "Orders - Write"},
        {"value": "customers:read", "label": "Customers - Read"},
        {"value": "customers:write", "label": "Customers - Write"},
        {"value": "recommendations:read", "label": "Recommendations - Read"},
        {"value": "analytics:read", "label": "Analytics - Read"},
        {"value": "forecasting:read", "label": "Forecasting - Read"},
        {"value": "pricing:read", "label": "Pricing - Read"},
        {"value": "pricing:write", "label": "Pricing - Write"}
    ]}


@router.get("/{key_id}/analytics")
async def get_key_analytics(key_id: int, admin=Depends(verify_admin), db: Session = Depends(get_db)):
    """Get usage analytics for API key"""
    from api.models.database_models import ApiLog
    from sqlalchemy import func
    from datetime import datetime, timedelta
    
    api_key = db.query(ApiKey).filter(ApiKey.id == key_id).first()
    if not api_key:
        raise HTTPException(status_code=404, detail="API key not found")
    
    # Total requests
    total_requests = db.query(func.count(ApiLog.id)).filter(
        ApiLog.tenant_id == api_key.tenant_id
    ).scalar() or 0
    
    # Last 30 days timeline
    thirty_days_ago = datetime.utcnow() - timedelta(days=30)
    timeline = db.query(
        func.date(ApiLog.created_at).label('date'),
        func.count(ApiLog.id).label('count')
    ).filter(
        ApiLog.tenant_id == api_key.tenant_id,
        ApiLog.created_at >= thirty_days_ago
    ).group_by(func.date(ApiLog.created_at)).all()
    
    # Status code distribution
    status_codes = db.query(
        ApiLog.status_code,
        func.count(ApiLog.id).label('count')
    ).filter(
        ApiLog.tenant_id == api_key.tenant_id
    ).group_by(ApiLog.status_code).all()
    
    # Top endpoints
    top_endpoints = db.query(
        ApiLog.endpoint,
        func.count(ApiLog.id).label('count')
    ).filter(
        ApiLog.tenant_id == api_key.tenant_id
    ).group_by(ApiLog.endpoint).order_by(func.count(ApiLog.id).desc()).limit(10).all()
    
    return {
        "key": {
            "id": api_key.id,
            "name": api_key.name,
            "tenant_id": api_key.tenant_id,
            "created_at": api_key.created_at,
            "last_used_at": api_key.last_used_at
        },
        "stats": {
            "total_requests": total_requests,
            "avg_response_time": db.query(func.avg(ApiLog.response_time)).filter(
                ApiLog.tenant_id == api_key.tenant_id
            ).scalar() or 0
        },
        "timeline": [{"date": str(date), "count": count} for date, count in timeline],
        "status_codes": [{"code": code, "count": count} for code, count in status_codes],
        "top_endpoints": [{"endpoint": ep, "count": count} for ep, count in top_endpoints]
    }
