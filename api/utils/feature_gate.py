"""
Feature Gates System
Copyright © 2024 Paksa IT Solutions
"""

from typing import Dict, List
from api.utils.tenant_resolver import TenantResolver

# Feature definitions per plan
PLAN_FEATURES = {
    "basic": [
        "recommendations",
        "basic_analytics",
        "email_campaigns"
    ],
    "premium": [
        "recommendations",
        "basic_analytics",
        "email_campaigns",
        "advanced_analytics",
        "demand_forecasting",
        "customer_segmentation",
        "sms_campaigns",
        "whatsapp_campaigns"
    ],
    "enterprise": [
        "recommendations",
        "basic_analytics",
        "email_campaigns",
        "advanced_analytics",
        "demand_forecasting",
        "customer_segmentation",
        "sms_campaigns",
        "whatsapp_campaigns",
        "visual_search",
        "dynamic_pricing",
        "ab_testing",
        "custom_models",
        "api_access",
        "priority_support"
    ]
}


class FeatureGate:
    """Controls feature access based on subscription plan"""
    
    @staticmethod
    def has_feature(tenant_id: str, feature: str) -> bool:
        """Check if tenant has access to feature"""
        plan = TenantResolver.get_plan(tenant_id)
        if not plan:
            return False
        
        features = PLAN_FEATURES.get(plan, [])
        return feature in features
    
    @staticmethod
    def get_features(tenant_id: str) -> List[str]:
        """Get all features available to tenant"""
        plan = TenantResolver.get_plan(tenant_id)
        return PLAN_FEATURES.get(plan, [])
    
    @staticmethod
    def require_feature(tenant_id: str, feature: str) -> tuple[bool, str]:
        """Check feature access and return error if not available"""
        if not FeatureGate.has_feature(tenant_id, feature):
            plan = TenantResolver.get_plan(tenant_id)
            return False, f"Feature '{feature}' not available on {plan} plan. Upgrade to access this feature."
        return True, ""
    
    @staticmethod
    def get_missing_features(tenant_id: str, required_features: List[str]) -> List[str]:
        """Get list of features tenant doesn't have access to"""
        available = FeatureGate.get_features(tenant_id)
        return [f for f in required_features if f not in available]
