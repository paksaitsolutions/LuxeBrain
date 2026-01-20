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
    
    EXCLUDED_PATHS = [
        "/", "/health", "/docs", "/redoc", "/openapi.json",
        "/ready", "/alive", "/startup", "/health/db"
    ]
    
    async def dispatch(self, request: Request, call_next):
        # Skip auth for excluded paths
        if request.url.path in self.EXCLUDED_PATHS:
            return await call_next(request)
        
        # Skip auth for all auth endpoints
        if request.url.path.startswith("/api/v1/auth/"):
            return await call_next(request)
        
        # Skip auth for webhooks and API endpoints with API key
        if "/webhooks" in request.url.path or request.url.path.startswith("/api/v1/"):
            return await call_next(request)
        
        # Admin endpoints require JWT token
        try:
            auth_header = request.headers.get("Authorization")
            if not auth_header or not auth_header.startswith("Bearer "):
                # Try to get token from cookie
                token = request.cookies.get("token")
                if not token:
                    from fastapi.responses import JSONResponse
                    return JSONResponse(
                        status_code=401,
                        content={"detail": "Missing or invalid token"}
                    )
            else:
                token = auth_header.split(" ")[1]
            
            payload = jwt.decode(
                token,
                settings.JWT_SECRET_KEY,
                algorithms=[settings.JWT_ALGORITHM]
            )
            request.state.user = payload
        except JWTError:
            from fastapi.responses import JSONResponse
            return JSONResponse(
                status_code=401,
                content={"detail": "Invalid token"}
            )
        except Exception as e:
            from fastapi.responses import JSONResponse
            return JSONResponse(
                status_code=500,
                content={"detail": f"Authentication error: {str(e)}"}
            )
        
        return await call_next(request)


async def verify_admin(request: Request):
    """Verify user is admin or super_admin"""
    user = getattr(request.state, 'user', None)
    if not user:
        raise HTTPException(status_code=401, detail="Authentication required")
    
    role = user.get('role', '')
    if role not in ['admin', 'super_admin']:
        raise HTTPException(status_code=403, detail="Admin access required")
    
    return user
