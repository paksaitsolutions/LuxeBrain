"""
Rate Limiting Middleware
Copyright © 2024 Paksa IT Solutions
"""

from fastapi import Request, HTTPException
from starlette.middleware.base import BaseHTTPMiddleware
import redis.asyncio as redis
from config.settings import settings
import time


class RateLimitMiddleware(BaseHTTPMiddleware):
    """Rate limiting middleware using Redis"""
    
    def __init__(self, app):
        super().__init__(app)
        self.redis_client = None
    
    async def dispatch(self, request: Request, call_next):
        if not self.redis_client:
            self.redis_client = redis.from_url(settings.REDIS_URL)
        
        client_ip = request.client.host
        key = f"rate_limit:{client_ip}"
        
        try:
            current = await self.redis_client.get(key)
            
            if current and int(current) >= settings.RATE_LIMIT_PER_MINUTE:
                raise HTTPException(status_code=429, detail="Rate limit exceeded")
            
            pipe = self.redis_client.pipeline()
            pipe.incr(key)
            pipe.expire(key, 60)
            await pipe.execute()
            
        except redis.RedisError:
            pass  # Fail open if Redis is down
        
        return await call_next(request)
