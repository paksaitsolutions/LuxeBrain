"""
Plan Limits Middleware
Copyright © 2024 Paksa IT Solutions
"""

from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import JSONResponse
from api.utils.plan_limits import PlanLimitsEnforcer


class PlanLimitsMiddleware(BaseHTTPMiddleware):
    """Enforces plan limits before processing requests"""
    
    # Endpoints that don't require limit checks
    EXEMPT_PATHS = [
        "/api/auth/",
        "/health",
        "/docs",
        "/redoc",
        "/openapi.json"
    ]
    
    async def dispatch(self, request: Request, call_next):
        # Skip limit checks for exempt paths
        if any(request.url.path.startswith(path) for path in self.EXEMPT_PATHS):
            return await call_next(request)
        
        # Get tenant_id from request state
        tenant_id = getattr(request.state, 'tenant_id', None)
        
        if tenant_id:
            # Check plan limits
            within_limits, error_message = PlanLimitsEnforcer.check_limits(tenant_id)
            
            if not within_limits:
                return JSONResponse(
                    status_code=402,
                    content={
                        "error": "Payment Required",
                        "detail": error_message,
                        "upgrade_url": "/billing/upgrade"
                    }
                )
        
        response = await call_next(request)
        return response
