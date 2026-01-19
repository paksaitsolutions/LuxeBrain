"""
Tenant Context Middleware
Copyright © 2024 Paksa IT Solutions
"""

from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import JSONResponse
import jwt
import os
from api.utils.tenant_resolver import TenantResolver


class TenantContextMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        auth_header = request.headers.get('Authorization')
        
        if auth_header and auth_header.startswith('Bearer '):
            token = auth_header.split(' ')[1]
            
            try:
                secret = os.getenv('JWT_SECRET_KEY', 'your-secret-key-change-in-production')
                payload = jwt.decode(token, secret, algorithms=['HS256'])
                
                tenant_id = payload.get('tenant_id')
                
                # Validate tenant if present
                if tenant_id:
                    is_valid, error = TenantResolver.validate_tenant(tenant_id)
                    if not is_valid:
                        return JSONResponse(
                            status_code=403,
                            content={"detail": error}
                        )
                    
                    # Get tenant metadata
                    tenant = TenantResolver.get_tenant(tenant_id)
                    request.state.tenant = tenant
                
                request.state.tenant_id = tenant_id
                request.state.user_id = payload.get('user_id')
                request.state.role = payload.get('role')
                
            except jwt.InvalidTokenError:
                pass
        
        response = await call_next(request)
        return response
