"""
Error Tracking Middleware
Copyright © 2024 Paksa IT Solutions
"""

import logging
import traceback
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import JSONResponse

logger = logging.getLogger(__name__)

class ErrorTrackingMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        try:
            response = await call_next(request)
            return response
        except Exception as e:
            error_id = id(e)
            
            logger.error(
                f"Error ID: {error_id} | "
                f"Path: {request.url.path} | "
                f"Method: {request.method} | "
                f"Error: {str(e)} | "
                f"Traceback: {traceback.format_exc()}"
            )
            
            # Alert on critical errors
            if isinstance(e, (SystemError, MemoryError)):
                self._send_alert(error_id, e, request)
            
            return JSONResponse(
                {
                    "error": "Internal server error",
                    "error_id": error_id
                },
                status_code=500
            )
    
    def _send_alert(self, error_id, error, request):
        """Send alert for critical errors"""
        logger.critical(
            f"CRITICAL ERROR {error_id}: {str(error)} at {request.url.path}"
        )
