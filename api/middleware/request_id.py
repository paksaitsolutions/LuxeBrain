"""
Request ID Tracking Middleware
Copyright © 2024 Paksa IT Solutions
"""

from starlette.middleware.base import BaseHTTPMiddleware
from fastapi import Request
import uuid
import logging

logger = logging.getLogger(__name__)


class RequestIDMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        request_id = str(uuid.uuid4())
        request.state.request_id = request_id
        
        # Add to logging context
        logger_adapter = logging.LoggerAdapter(logger, {"request_id": request_id})
        request.state.logger = logger_adapter
        
        response = await call_next(request)
        response.headers["X-Request-ID"] = request_id
        
        return response
