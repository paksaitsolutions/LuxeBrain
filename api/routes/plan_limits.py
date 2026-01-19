"""
Plan Limits Routes
Copyright © 2024 Paksa IT Solutions
"""

from fastapi import APIRouter, Request
from api.utils.plan_limits import PlanLimitsEnforcer
from api.utils.usage_tracker import UsageTracker

router = APIRouter(prefix="/api/limits", tags=["limits"])


@router.get("/status")
async def get_limits_status(request: Request):
    """Get current usage and limits for authenticated tenant"""
    tenant_id = getattr(request.state, 'tenant_id', None)
    
    if not tenant_id:
        return {"error": "Tenant not authenticated"}
    
    limits = PlanLimitsEnforcer.get_limits(tenant_id)
    usage = UsageTracker.get_daily_usage(tenant_id)
    percentages = PlanLimitsEnforcer.get_usage_percentage(tenant_id)
    
    return {
        "limits": limits,
        "usage": usage,
        "usage_percentage": percentages,
        "within_limits": PlanLimitsEnforcer.check_limits(tenant_id)[0]
    }
