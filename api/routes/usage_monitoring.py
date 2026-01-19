"""
Usage Monitoring Routes
Copyright © 2024 Paksa IT Solutions
"""

from fastapi import APIRouter, Depends
from api.utils.usage_tracker import UsageTracker
from api.middleware.auth import verify_admin

router = APIRouter(prefix="/api/admin/usage", tags=["monitoring"])


@router.get("/all")
async def get_all_usage(admin=Depends(verify_admin)):
    """Get usage statistics for all tenants"""
    return UsageTracker.get_all_usage()


@router.get("/{tenant_id}")
async def get_tenant_usage(tenant_id: str, admin=Depends(verify_admin)):
    """Get usage statistics for specific tenant"""
    return UsageTracker.get_usage(tenant_id)


@router.get("/{tenant_id}/daily")
async def get_daily_usage(tenant_id: str, date: str = None, admin=Depends(verify_admin)):
    """Get daily usage for specific tenant"""
    return UsageTracker.get_daily_usage(tenant_id, date)


@router.post("/{tenant_id}/reset")
async def reset_tenant_usage(tenant_id: str, admin=Depends(verify_admin)):
    """Reset usage counters for tenant"""
    UsageTracker.reset_usage(tenant_id)
    return {"message": f"Usage reset for tenant {tenant_id}"}
