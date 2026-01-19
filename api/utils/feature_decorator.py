"""
Feature Gate Decorator
Copyright © 2024 Paksa IT Solutions
"""

from functools import wraps
from fastapi import Request, HTTPException
from api.utils.feature_gate import FeatureGate


def require_feature(feature: str):
    """Decorator to enforce feature access on API endpoints"""
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            # Extract request from args/kwargs
            request = None
            for arg in args:
                if isinstance(arg, Request):
                    request = arg
                    break
            if not request and 'request' in kwargs:
                request = kwargs['request']
            
            if not request:
                raise HTTPException(status_code=500, detail="Request object not found")
            
            tenant_id = getattr(request.state, 'tenant_id', None)
            
            if not tenant_id:
                raise HTTPException(status_code=401, detail="Authentication required")
            
            has_access, error = FeatureGate.require_feature(tenant_id, feature)
            
            if not has_access:
                raise HTTPException(
                    status_code=403,
                    detail={
                        "error": "Feature not available",
                        "message": error,
                        "upgrade_url": "/billing/upgrade"
                    }
                )
            
            return await func(*args, **kwargs)
        return wrapper
    return decorator
