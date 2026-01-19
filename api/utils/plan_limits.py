"""
Plan Limits Enforcer
Copyright © 2024 Paksa IT Solutions
"""

from typing import Dict, Optional
from api.utils.usage_tracker import UsageTracker
from api.utils.tenant_resolver import TenantResolver

# Plan limits configuration
PLAN_LIMITS = {
    "basic": {
        "api_calls_per_day": 1000,
        "ml_inferences_per_day": 100,
        "products": 500,
        "storage_mb": 100
    },
    "premium": {
        "api_calls_per_day": 10000,
        "ml_inferences_per_day": 1000,
        "products": 5000,
        "storage_mb": 1000
    },
    "enterprise": {
        "api_calls_per_day": 100000,
        "ml_inferences_per_day": 10000,
        "products": -1,  # unlimited
        "storage_mb": 10000
    }
}


class PlanLimitsEnforcer:
    """Enforces subscription plan limits"""
    
    @staticmethod
    def check_limits(tenant_id: str) -> tuple[bool, Optional[str]]:
        """Check if tenant is within plan limits"""
        if not tenant_id:
            return True, None
        
        # Get tenant plan
        plan = TenantResolver.get_plan(tenant_id)
        if not plan:
            return False, "Invalid subscription plan"
        
        limits = PLAN_LIMITS.get(plan, PLAN_LIMITS["basic"])
        usage = UsageTracker.get_usage(tenant_id)
        
        # Check API calls
        daily_usage = UsageTracker.get_daily_usage(tenant_id)
        if daily_usage.get("api_calls", 0) >= limits["api_calls_per_day"]:
            return False, f"Daily API call limit exceeded ({limits['api_calls_per_day']})"
        
        # Check ML inferences
        if daily_usage.get("ml_inferences", 0) >= limits["ml_inferences_per_day"]:
            return False, f"Daily ML inference limit exceeded ({limits['ml_inferences_per_day']})"
        
        # Check storage
        storage_mb = usage.get("storage_bytes", 0) / (1024 * 1024)
        if storage_mb >= limits["storage_mb"]:
            return False, f"Storage limit exceeded ({limits['storage_mb']} MB)"
        
        return True, None
    
    @staticmethod
    def check_product_limit(tenant_id: str, current_count: int) -> tuple[bool, Optional[str]]:
        """Check if tenant can add more products"""
        plan = TenantResolver.get_plan(tenant_id)
        if not plan:
            return False, "Invalid subscription plan"
        
        limits = PLAN_LIMITS.get(plan, PLAN_LIMITS["basic"])
        product_limit = limits["products"]
        
        if product_limit == -1:  # unlimited
            return True, None
        
        if current_count >= product_limit:
            return False, f"Product limit exceeded ({product_limit})"
        
        return True, None
    
    @staticmethod
    def get_limits(tenant_id: str) -> Dict:
        """Get plan limits for tenant"""
        plan = TenantResolver.get_plan(tenant_id)
        return PLAN_LIMITS.get(plan, PLAN_LIMITS["basic"])
    
    @staticmethod
    def get_usage_percentage(tenant_id: str) -> Dict:
        """Get usage as percentage of limits"""
        plan = TenantResolver.get_plan(tenant_id)
        limits = PLAN_LIMITS.get(plan, PLAN_LIMITS["basic"])
        daily_usage = UsageTracker.get_daily_usage(tenant_id)
        usage = UsageTracker.get_usage(tenant_id)
        
        return {
            "api_calls": (daily_usage.get("api_calls", 0) / limits["api_calls_per_day"]) * 100,
            "ml_inferences": (daily_usage.get("ml_inferences", 0) / limits["ml_inferences_per_day"]) * 100,
            "storage": ((usage.get("storage_bytes", 0) / (1024 * 1024)) / limits["storage_mb"]) * 100
        }
