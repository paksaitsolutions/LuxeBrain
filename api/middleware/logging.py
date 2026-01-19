"""
Request Logging Middleware
Copyright © 2024 Paksa IT Solutions
"""

import logging
import time
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
import json

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - [%(request_id)s] - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('logs/api_requests.log'),
        logging.StreamHandler()
    ]
)

logger = logging.getLogger(__name__)


class RequestLoggingMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        start_time = time.time()
        
        request_id = getattr(request.state, 'request_id', 'unknown')
        tenant_id = request.headers.get('X-Tenant-ID', 'unknown')
        user_id = request.headers.get('X-User-ID', 'unknown')
        
        logger.info(
            f"Request: {request.method} {request.url.path} | "
            f"Tenant: {tenant_id} | User: {user_id}",
            extra={'request_id': request_id}
        )
        
        response = await call_next(request)
        
        process_time = time.time() - start_time
        logger.info(
            f"Response: {response.status_code} | "
            f"Time: {process_time:.3f}s | "
            f"Path: {request.url.path}",
            extra={'request_id': request_id}
        )
        
        # Store in database for admin UI
        self._store_api_log(request, response, process_time, tenant_id, user_id)
        
        return response
    
    def _store_api_log(self, request, response, process_time, tenant_id, user_id):
        """Store API log in database"""
        try:
            from api.models.database_models import ApiLog, SessionLocal
            from datetime import datetime
            
            db = SessionLocal()
            try:
                log = ApiLog(
                    method=request.method,
                    endpoint=str(request.url.path),
                    status_code=response.status_code,
                    response_time=process_time,
                    tenant_id=tenant_id if tenant_id != 'unknown' else None,
                    user_id=user_id if user_id != 'unknown' else None,
                    ip_address=request.client.host if request.client else None,
                    user_agent=request.headers.get('user-agent', ''),
                    created_at=datetime.utcnow()
                )
                db.add(log)
                db.commit()
            finally:
                db.close()
        except Exception:
            pass  # Don't fail request if logging fails
