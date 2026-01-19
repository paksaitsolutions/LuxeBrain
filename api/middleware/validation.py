"""
Input Validation Middleware
Copyright © 2024 Paksa IT Solutions
"""

from fastapi import Request, HTTPException
from starlette.middleware.base import BaseHTTPMiddleware
from pydantic import ValidationError
from api.utils.input_validator import InputValidator
import re
import json


class InputValidationMiddleware(BaseHTTPMiddleware):
    """Middleware to validate and sanitize all incoming requests"""
    
    async def dispatch(self, request: Request, call_next):
        # Validate user-agent header
        user_agent = request.headers.get("user-agent", "")
        if not user_agent or len(user_agent) < 5:
            raise HTTPException(
                status_code=400,
                detail="Missing or invalid User-Agent header"
            )
        
        # Block suspicious user agents
        suspicious_agents = ["curl", "wget", "python-requests", "scrapy", "bot"]
        if any(agent in user_agent.lower() for agent in suspicious_agents):
            # Allow if it's from known good bots (Google, Bing, etc.)
            good_bots = ["googlebot", "bingbot", "slackbot"]
            if not any(bot in user_agent.lower() for bot in good_bots):
                raise HTTPException(
                    status_code=403,
                    detail="Suspicious user agent blocked"
                )
        
        # Validate content type for POST/PUT requests
        if request.method in ["POST", "PUT", "PATCH"]:
            content_type = request.headers.get("content-type", "")
            if not content_type.startswith(("application/json", "multipart/form-data")):
                raise HTTPException(
                    status_code=415,
                    detail="Unsupported Media Type. Use application/json"
                )
        
        # Validate query parameters
        for key, value in request.query_params.items():
            if not self._is_safe_input(key) or not self._is_safe_input(value):
                raise HTTPException(
                    status_code=400,
                    detail=f"Invalid query parameter: {key}"
                )
        
        # Validate path parameters
        for key, value in request.path_params.items():
            if not self._is_safe_input(str(value)):
                raise HTTPException(
                    status_code=400,
                    detail=f"Invalid path parameter: {key}"
                )
        
        # Validate request body size
        content_length = request.headers.get("content-length")
        if content_length and int(content_length) > 10_000_000:  # 10MB limit
            raise HTTPException(status_code=413, detail="Request body too large")
        
        response = await call_next(request)
        return response
    
    def _is_safe_input(self, value: str) -> bool:
        """Check if input contains potentially dangerous characters"""
        if not value:
            return True
        
        # Block common injection patterns
        dangerous_patterns = [
            r"<script",
            r"javascript:",
            r"onerror=",
            r"onload=",
            r"\.\./",  # Path traversal
            r"union\s+select",  # SQL injection
            r"drop\s+table",  # SQL injection
            r"exec\s*\(",  # Command injection
            r"eval\s*\(",  # Code injection
        ]
        
        value_lower = value.lower()
        for pattern in dangerous_patterns:
            if re.search(pattern, value_lower):
                return False
        
        return True


def validate_email(email: str) -> bool:
    """Validate email format"""
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return bool(re.match(pattern, email))


def validate_tenant_id(tenant_id: str) -> bool:
    """Validate tenant ID format"""
    pattern = r'^tenant-[0-9]{3,}$'
    return bool(re.match(pattern, tenant_id))


def sanitize_string(value: str, max_length: int = 255) -> str:
    """Sanitize string input"""
    if not value:
        return ""
    
    # Remove null bytes
    value = value.replace('\x00', '')
    
    # Trim whitespace
    value = value.strip()
    
    # Limit length
    if len(value) > max_length:
        value = value[:max_length]
    
    return value
