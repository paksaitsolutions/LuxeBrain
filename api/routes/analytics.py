"""
API Analytics admin routes
Copyright © 2024 Paksa IT Solutions. All Rights Reserved.
"""
from fastapi import APIRouter, Query
from api.utils.analytics import ApiAnalytics

router = APIRouter(prefix="/api/admin/analytics", tags=["admin"])

@router.get("/hourly")
async def get_hourly_analytics(hours: int = Query(24, le=168)):
    """Get hourly request analytics"""
    return ApiAnalytics.get_hourly_stats(hours)

@router.get("/status-distribution")
async def get_status_distribution():
    """Get status code distribution"""
    return ApiAnalytics.get_status_distribution()

@router.get("/endpoint-performance")
async def get_endpoint_performance(limit: int = Query(20, le=100)):
    """Get endpoint performance metrics"""
    return ApiAnalytics.get_endpoint_performance(limit)

@router.get("/tenant-analytics")
async def get_tenant_analytics(tenant_id: str = Query(None)):
    """Get tenant-specific analytics"""
    return ApiAnalytics.get_tenant_analytics(tenant_id)
