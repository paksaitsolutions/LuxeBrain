"""
Authentication Middleware
Copyright © 2024 Paksa IT Solutions
"""

from fastapi import Request, HTTPException, Depends
from starlette.middleware.base import BaseHTTPMiddleware
from jose import jwt, JWTError
from config.settings import settings


class AuthMiddleware(BaseHTTPMiddleware):
    """JWT Authentication Middleware"""
    
    EXCLUDED_PATHS = ["/", "/health", "/docs", "/redoc", "/openapi.json"]
    
    async def dispatch(self, request: Request, call_next):
        if request.url.path in self.EXCLUDED_PATHS:
            return await call_next(request)
        
        # For webhooks, use different auth
        if "/webhooks" in request.url.path:
            return await call_next(request)
        
        auth_header = request.headers.get("Authorization")
        if not auth_header or not auth_header.startswith("Bearer "):
            raise HTTPException(status_code=401, detail="Missing or invalid token")
        
        token = auth_header.split(" ")[1]
        
        try:
            payload = jwt.decode(
                token,
                settings.JWT_SECRET_KEY,
                algorithms=[settings.JWT_ALGORITHM]
            )
            request.state.user = payload
        except JWTError:
            raise HTTPException(status_code=401, detail="Invalid token")
        
        return await call_next(request)


async def verify_admin(request: Request):
    """Verify user is admin"""
    user = getattr(request.state, 'user', None)
    if not user or user.get('role') != 'admin':
        raise HTTPException(status_code=403, detail="Admin access required")
    return user
