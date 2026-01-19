"""
Performance Monitoring Middleware
Copyright © 2024 Paksa IT Solutions. All Rights Reserved.
"""
from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware
import time
import logging

logger = logging.getLogger(__name__)

class PerformanceMiddleware(BaseHTTPMiddleware):
    def __init__(self, app, slow_threshold: float = 1.0):
        super().__init__(app)
        self.slow_threshold = slow_threshold
    
    async def dispatch(self, request: Request, call_next):
        start_time = time.time()
        response = await call_next(request)
        duration = time.time() - start_time
        
        if duration > self.slow_threshold:
            self._log_slow_query(request, duration)
        
        return response
    
    def _log_slow_query(self, request: Request, duration: float):
        """Log slow query to database and file"""
        tenant_id = request.headers.get('X-Tenant-ID', 'unknown')
        
        logger.warning(
            f"SLOW QUERY: {request.method} {request.url.path} | "
            f"Duration: {duration:.3f}s | Tenant: {tenant_id}"
        )
        
        try:
            from api.models.database_models import SlowQueryLog
            from config.database import SessionLocal
            from datetime import datetime
            
            db = SessionLocal()
            try:
                log = SlowQueryLog(
                    method=request.method,
                    endpoint=str(request.url.path),
                    duration=duration,
                    tenant_id=tenant_id if tenant_id != 'unknown' else None,
                    query_params=str(request.query_params),
                    created_at=datetime.utcnow()
                )
                db.add(log)
                db.commit()
            finally:
                db.close()
        except Exception:
            pass
