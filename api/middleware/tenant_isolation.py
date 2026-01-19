"""
Tenant Isolation Middleware
Copyright © 2024 Paksa IT Solutions
"""

from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import JSONResponse


class TenantIsolationMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        # Skip for auth endpoints
        if '/auth/' in request.url.path:
            return await call_next(request)
        
        # Get tenant_id from request state (set by TenantContextMiddleware)
        tenant_id = getattr(request.state, 'tenant_id', None)
        
        # Validate tenant_id exists for protected endpoints
        if request.method in ['POST', 'PUT', 'DELETE', 'PATCH']:
            if not tenant_id:
                return JSONResponse(
                    {'error': 'Tenant ID required'},
                    status_code=403
                )
        
        response = await call_next(request)
        return response


def validate_tenant_access(request_tenant_id: str, resource_tenant_id: str) -> bool:
    """Validate tenant has access to resource"""
    if not request_tenant_id or not resource_tenant_id:
        return False
    return request_tenant_id == resource_tenant_id
