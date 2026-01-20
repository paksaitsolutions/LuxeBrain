"""
Admin Billing Management Routes
Copyright © 2024 Paksa IT Solutions
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from api.middleware.auth import verify_admin
from config.database import get_db
from api.models.database_models import Tenant
from api.utils.usage_tracker import UsageTracker

router = APIRouter(prefix="/api/admin/billing", tags=["admin"])


@router.get("/tenants")
async def get_all_tenants_billing(db: Session = Depends(get_db), admin=Depends(verify_admin)):
    """Get billing overview for all tenants"""
    tenants_data = []
    tenants = db.query(Tenant).all()
    
    for tenant in tenants:
        usage = UsageTracker.get_usage(tenant.tenant_id)
        daily = UsageTracker.get_daily_usage(tenant.tenant_id)
        
        tenants_data.append({
            "tenant_id": tenant.tenant_id,
            "name": tenant.name,
            "email": tenant.email,
            "plan": tenant.plan,
            "status": tenant.status,
            "subscription_status": "active" if tenant.status == "active" else "inactive",
            "usage": {
                "api_calls_today": daily.get("api_calls", 0),
                "ml_inferences_today": daily.get("ml_inferences", 0),
                "storage_mb": usage.get("storage_bytes", 0) / (1024 * 1024)
            }
        })
    
    return {"tenants": tenants_data, "total": len(tenants_data)}


@router.get("/tenant/{tenant_id}")
async def get_tenant_billing(tenant_id: str, db: Session = Depends(get_db), admin=Depends(verify_admin)):
    """Get detailed billing info for specific tenant"""
    tenant = db.query(Tenant).filter(Tenant.tenant_id == tenant_id).first()
    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant not found")
    
    usage = UsageTracker.get_usage(tenant_id)
    
    return {
        "tenant": {
            "tenant_id": tenant.tenant_id,
            "name": tenant.name,
            "email": tenant.email,
            "plan": tenant.plan,
            "status": tenant.status
        },
        "usage": usage,
        "daily_breakdown": usage.get("daily_breakdown", {})
    }


@router.put("/tenant/{tenant_id}/plan")
async def update_tenant_plan(tenant_id: str, plan: str, db: Session = Depends(get_db), admin=Depends(verify_admin)):
    """Manually update tenant plan"""
    if plan not in ["basic", "premium", "enterprise"]:
        raise HTTPException(status_code=400, detail="Invalid plan")
    
    tenant = db.query(Tenant).filter(Tenant.tenant_id == tenant_id).first()
    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant not found")
    
    tenant.plan = plan
    db.commit()
    
    return {"message": f"Plan updated to {plan}", "tenant_id": tenant_id}


@router.put("/tenant/{tenant_id}/status")
async def update_tenant_status(tenant_id: str, status: str, db: Session = Depends(get_db), admin=Depends(verify_admin)):
    """Update tenant status (active/suspended/canceled)"""
    if status not in ["active", "suspended", "canceled"]:
        raise HTTPException(status_code=400, detail="Invalid status")
    
    tenant = db.query(Tenant).filter(Tenant.tenant_id == tenant_id).first()
    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant not found")
    
    tenant.status = status
    db.commit()
    
    return {"message": f"Status updated to {status}", "tenant_id": tenant_id}


@router.get("/revenue")
async def get_revenue_stats(db: Session = Depends(get_db), admin=Depends(verify_admin)):
    """Get revenue statistics"""
    plan_prices = {"basic": 0, "premium": 99, "enterprise": 299}
    
    revenue = {"mrr": 0, "by_plan": {"basic": 0, "premium": 0, "enterprise": 0}}
    
    tenants = db.query(Tenant).filter(Tenant.status == "active").all()
    for tenant in tenants:
        plan = tenant.plan or "basic"
        revenue["mrr"] += plan_prices.get(plan, 0)
        revenue["by_plan"][plan] += 1
    
    return revenue
