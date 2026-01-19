"""
Pool Monitoring Routes
Copyright © 2024 Paksa IT Solutions
"""

from fastapi import APIRouter, Depends
from config.tenant_pool import TenantConnectionPool
from api.middleware.auth import verify_admin

router = APIRouter(prefix="/api/admin/pools", tags=["monitoring"])


@router.get("/stats")
async def get_pool_stats(admin=Depends(verify_admin)):
    """Get connection pool statistics for all tenants"""
    return {
        "pools": TenantConnectionPool.get_stats(),
        "total_tenants": len(TenantConnectionPool.get_stats())
    }


@router.get("/stats/{tenant_id}")
async def get_tenant_pool_stats(tenant_id: str, admin=Depends(verify_admin)):
    """Get connection pool statistics for specific tenant"""
    stats = TenantConnectionPool.get_stats(tenant_id)
    if not stats:
        return {"error": "Tenant pool not found"}
    return stats
