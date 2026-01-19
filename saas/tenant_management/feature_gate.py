"""
Feature Gating System
Copyright © 2024 Paksa IT Solutions

Control feature access per plan
"""

from functools import wraps
from fastapi import HTTPException, Request


class FeatureGate:
    """Feature access control"""
    
    FEATURES = {
        'recommendations': {
            'plans': ['starter', 'growth', 'pro', 'enterprise'],
            'description': 'AI product recommendations'
        },
        'dynamic_pricing': {
            'plans': ['growth', 'pro', 'enterprise'],
            'description': 'AI-powered dynamic pricing'
        },
        'chatbot_basic': {
            'plans': ['growth', 'pro', 'enterprise'],
            'description': 'Basic AI chatbot'
        },
        'chatbot_advanced': {
            'plans': ['pro', 'enterprise'],
            'description': 'Advanced AI chatbot with custom training'
        },
        'visual_search': {
            'plans': ['pro', 'enterprise'],
            'description': 'Image-based product search'
        },
        'whatsapp': {
            'plans': ['pro', 'enterprise'],
            'description': 'WhatsApp automation'
        },
        'ab_testing': {
            'plans': ['pro', 'enterprise'],
            'description': 'A/B testing framework'
        },
        'custom_models': {
            'plans': ['enterprise'],
            'description': 'Custom AI model training'
        },
        'white_label': {
            'plans': ['enterprise'],
            'description': 'White-label branding'
        },
        'sso': {
            'plans': ['enterprise'],
            'description': 'Single Sign-On (SAML)'
        }
    }
    
    def can_access(self, tenant_id: str, feature: str) -> bool:
        """Check if tenant can access feature"""
        from saas.tenant_management.manager import Tenant
        from config.database import SessionLocal
        
        db = SessionLocal()
        tenant = db.query(Tenant).filter(Tenant.id == tenant_id).first()
        
        if not tenant:
            return False
        
        feature_config = self.FEATURES.get(feature)
        if not feature_config:
            return False
        
        return tenant.plan_id in feature_config['plans']
    
    def get_upgrade_message(self, feature: str, current_plan: str) -> dict:
        """Get upgrade message for locked feature"""
        
        feature_config = self.FEATURES.get(feature, {})
        required_plans = feature_config.get('plans', [])
        
        # Find minimum plan that has this feature
        plan_hierarchy = ['starter', 'growth', 'pro', 'enterprise']
        
        for plan in plan_hierarchy:
            if plan in required_plans and plan_hierarchy.index(plan) > plan_hierarchy.index(current_plan):
                return {
                    'feature': feature,
                    'description': feature_config.get('description'),
                    'current_plan': current_plan,
                    'required_plan': plan,
                    'upgrade_url': f'/upgrade?to={plan}',
                    'message': f'Upgrade to {plan.title()} plan to unlock {feature_config.get("description")}'
                }
        
        return {}


def require_feature(feature: str):
    """Decorator to require feature access"""
    
    def decorator(func):
        @wraps(func)
        async def wrapper(request: Request, *args, **kwargs):
            tenant = request.state.tenant
            feature_gate = FeatureGate()
            
            if not feature_gate.can_access(tenant.id, feature):
                upgrade_info = feature_gate.get_upgrade_message(feature, tenant.plan_id)
                raise HTTPException(
                    status_code=403,
                    detail={
                        'error': 'Feature not available',
                        'upgrade': upgrade_info
                    }
                )
            
            return await func(request, *args, **kwargs)
        
        return wrapper
    return decorator


def check_usage_limit(resource: str):
    """Decorator to check usage limits"""
    
    def decorator(func):
        @wraps(func)
        async def wrapper(request: Request, *args, **kwargs):
            tenant = request.state.tenant
            
            from saas.tenant_management.manager import TenantManager
            manager = TenantManager()
            
            if not manager.check_limit(tenant.id, resource):
                # Get current usage and limit
                from config.database import SessionLocal
                from saas.tenant_management.manager import Tenant
                
                db = SessionLocal()
                tenant_record = db.query(Tenant).filter(Tenant.id == tenant.id).first()
                
                current = getattr(tenant_record, f"{resource}_count", 0)
                limit = getattr(tenant_record, f"{resource}_limit", 0)
                
                raise HTTPException(
                    status_code=429,
                    detail={
                        'error': 'Usage limit exceeded',
                        'resource': resource,
                        'current': current,
                        'limit': limit,
                        'upgrade_url': '/upgrade',
                        'message': f'You have reached your {resource} limit. Upgrade to increase.'
                    }
                )
            
            # Track usage
            track_usage(tenant.id, resource)
            
            return await func(request, *args, **kwargs)
        
        return wrapper
    return decorator


def track_usage(tenant_id: str, resource: str, quantity: int = 1):
    """Track resource usage"""
    from config.database import SessionLocal
    from saas.tenant_management.manager import Tenant
    
    db = SessionLocal()
    tenant = db.query(Tenant).filter(Tenant.id == tenant_id).first()
    
    if tenant:
        current = getattr(tenant, f"{resource}_count", 0)
        setattr(tenant, f"{resource}_count", current + quantity)
        db.commit()
