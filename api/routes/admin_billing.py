"""
Admin Billing Management Routes
Copyright © 2024 Paksa IT Solutions
"""

from fastapi import APIRouter, Depends, HTTPException
from api.middleware.auth import verify_admin
from api.utils.tenant_resolver import TenantResolver, TENANTS_DB
from api.utils.usage_tracker import UsageTracker
from typing import List, Dict

router = APIRouter(prefix="/api/admin/billing", tags=["admin"])


@router.get("/tenants")
async def get_all_tenants_billing(admin=Depends(verify_admin)):
    """Get billing overview for all tenants"""
    tenants = []
    
    for tenant_id, tenant_data in TENANTS_DB.items():
        usage = UsageTracker.get_usage(tenant_id)
        daily = UsageTracker.get_daily_usage(tenant_id)
        
        tenants.append({
            "tenant_id": tenant_id,
            "name": tenant_data.get("name"),
            "email": tenant_data.get("email"),
            "plan": tenant_data.get("plan"),
            "status": tenant_data.get("status"),
            "subscription_status": tenant_data.get("subscription_status", "active"),
            "usage": {
                "api_calls_today": daily.get("api_calls", 0),
                "ml_inferences_today": daily.get("ml_inferences", 0),
                "storage_mb": usage.get("storage_bytes", 0) / (1024 * 1024)
            }
        })
    
    return {"tenants": tenants, "total": len(tenants)}


@router.get("/tenant/{tenant_id}")
async def get_tenant_billing(tenant_id: str, admin=Depends(verify_admin)):
    """Get detailed billing info for specific tenant"""
    tenant = TenantResolver.get_tenant(tenant_id)
    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant not found")
    
    usage = UsageTracker.get_usage(tenant_id)
    
    return {
        "tenant": tenant,
        "usage": usage,
        "daily_breakdown": usage.get("daily_breakdown", {})
    }


@router.put("/tenant/{tenant_id}/plan")
async def update_tenant_plan(tenant_id: str, plan: str, admin=Depends(verify_admin)):
    """Manually update tenant plan"""
    if plan not in ["basic", "premium", "enterprise"]:
        raise HTTPException(status_code=400, detail="Invalid plan")
    
    if tenant_id not in TENANTS_DB:
        raise HTTPException(status_code=404, detail="Tenant not found")
    
    TENANTS_DB[tenant_id]["plan"] = plan
    TenantResolver.invalidate_cache(tenant_id)
    
    return {"message": f"Plan updated to {plan}", "tenant_id": tenant_id}


@router.put("/tenant/{tenant_id}/status")
async def update_tenant_status(tenant_id: str, status: str, admin=Depends(verify_admin)):
    """Update tenant status (active/suspended/canceled)"""
    if status not in ["active", "suspended", "canceled"]:
        raise HTTPException(status_code=400, detail="Invalid status")
    
    if tenant_id not in TENANTS_DB:
        raise HTTPException(status_code=404, detail="Tenant not found")
    
    TENANTS_DB[tenant_id]["status"] = status
    TenantResolver.invalidate_cache(tenant_id)
    
    return {"message": f"Status updated to {status}", "tenant_id": tenant_id}


@router.get("/revenue")
async def get_revenue_stats(admin=Depends(verify_admin)):
    """Get revenue statistics"""
    plan_prices = {"basic": 0, "premium": 99, "enterprise": 299}
    
    revenue = {"mrr": 0, "by_plan": {"basic": 0, "premium": 0, "enterprise": 0}}
    
    for tenant_data in TENANTS_DB.values():
        plan = tenant_data.get("plan", "basic")
        if tenant_data.get("status") == "active":
            revenue["mrr"] += plan_prices.get(plan, 0)
            revenue["by_plan"][plan] += 1
    
    return revenue
