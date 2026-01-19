"""
API Deprecation Middleware
Copyright © 2024 Paksa IT Solutions. All Rights Reserved.
"""
from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware
import logging

logger = logging.getLogger(__name__)

# Define deprecated endpoints with sunset dates and replacement info
DEPRECATED_ENDPOINTS = {
    "/api/v1/old-recommendations": {
        "sunset_date": "2025-06-01",
        "replacement": "/api/v2/recommendations",
        "message": "This endpoint will be removed on 2025-06-01. Use /api/v2/recommendations instead."
    },
    "/api/v1/legacy-forecasting": {
        "sunset_date": "2025-07-01",
        "replacement": "/api/v2/forecasting",
        "message": "This endpoint will be removed on 2025-07-01. Use /api/v2/forecasting instead."
    }
}

class DeprecationMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        response = await call_next(request)
        
        endpoint = request.url.path
        
        if endpoint in DEPRECATED_ENDPOINTS:
            deprecation_info = DEPRECATED_ENDPOINTS[endpoint]
            
            # Add deprecation headers
            response.headers["X-API-Deprecated"] = "true"
            response.headers["X-API-Sunset-Date"] = deprecation_info["sunset_date"]
            response.headers["X-API-Replacement"] = deprecation_info["replacement"]
            
            # Log usage
            self._log_deprecated_usage(request, deprecation_info)
        
        return response
    
    def _log_deprecated_usage(self, request: Request, deprecation_info: dict):
        """Log deprecated endpoint usage"""
        tenant_id = request.headers.get('X-Tenant-ID', 'unknown')
        
        logger.warning(
            f"DEPRECATED API USAGE: {request.method} {request.url.path} | "
            f"Tenant: {tenant_id} | Sunset: {deprecation_info['sunset_date']}"
        )
        
        try:
            from api.models.database_models import DeprecatedApiLog, SessionLocal
            from datetime import datetime
            
            db = SessionLocal()
            try:
                log = DeprecatedApiLog(
                    endpoint=str(request.url.path),
                    method=request.method,
                    tenant_id=tenant_id if tenant_id != 'unknown' else None,
                    sunset_date=deprecation_info["sunset_date"],
                    replacement=deprecation_info["replacement"],
                    ip_address=request.client.host if request.client else None,
                    user_agent=request.headers.get('user-agent', ''),
                    created_at=datetime.utcnow()
                )
                db.add(log)
                db.commit()
            finally:
                db.close()
        except Exception:
            pass
