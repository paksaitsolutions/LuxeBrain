"""
CSRF Protection Middleware
Copyright © 2024 Paksa IT Solutions
"""

from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import JSONResponse
import secrets
import hashlib

CSRF_TOKENS = {}

class CSRFMiddleware(BaseHTTPMiddleware):
    EXCLUDED_PATHS = ["/api/v1/auth/", "/api/v1/webhooks/", "/webhooks/", "/api/admin/", "/api/demo/"]
    
    async def dispatch(self, request: Request, call_next):
        # Skip CSRF for OPTIONS (CORS preflight)
        if request.method == 'OPTIONS':
            return await call_next(request)
        
        # Skip CSRF for excluded paths
        if any(request.url.path.startswith(path) for path in self.EXCLUDED_PATHS):
            return await call_next(request)
        
        if request.method in ['POST', 'PUT', 'DELETE', 'PATCH']:
            csrf_token = request.headers.get('X-CSRF-Token')
            
            if not csrf_token or csrf_token not in CSRF_TOKENS:
                return JSONResponse(
                    {'error': 'CSRF token missing or invalid'},
                    status_code=403
                )
        
        response = await call_next(request)
        
        if request.method == 'GET':
            token = secrets.token_urlsafe(32)
            CSRF_TOKENS[token] = True
            response.headers['X-CSRF-Token'] = token
        
        return response
