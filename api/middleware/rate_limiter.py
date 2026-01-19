"""
IP-based rate limiting middleware for DDoS protection
Copyright © 2024 Paksa IT Solutions. All Rights Reserved.
"""
from fastapi import Request, HTTPException
from starlette.middleware.base import BaseHTTPMiddleware
from datetime import datetime, timedelta
from collections import defaultdict
import asyncio

class RateLimiter:
    def __init__(self):
        # IP -> [timestamps]
        self.requests = defaultdict(list)
        # IP -> block_until timestamp
        self.blocked_ips = {}
        # Limits
        self.max_requests = 100  # requests per window
        self.window_seconds = 60  # 1 minute window
        self.block_duration = 900  # 15 minutes
        
    def is_blocked(self, ip: str) -> bool:
        if ip in self.blocked_ips:
            if datetime.utcnow() < self.blocked_ips[ip]:
                return True
            else:
                del self.blocked_ips[ip]
        return False
    
    def check_rate_limit(self, ip: str) -> tuple[bool, int]:
        """Returns (allowed, remaining_requests)"""
        now = datetime.utcnow()
        cutoff = now - timedelta(seconds=self.window_seconds)
        
        # Clean old requests
        self.requests[ip] = [ts for ts in self.requests[ip] if ts > cutoff]
        
        current_count = len(self.requests[ip])
        
        if current_count >= self.max_requests:
            # Block IP and log to database
            self.blocked_ips[ip] = now + timedelta(seconds=self.block_duration)
            self._log_rate_limit_block(ip, current_count)
            return False, 0
        
        # Add current request
        self.requests[ip].append(now)
        remaining = self.max_requests - current_count - 1
        
        return True, remaining
    
    def _log_rate_limit_block(self, ip: str, request_count: int):
        """Log rate limit block to database"""
        try:
            from api.models.database_models import RateLimitLog, SessionLocal
            db = SessionLocal()
            try:
                log = RateLimitLog(
                    ip_address=ip,
                    user_agent="",
                    endpoint="",
                    request_count=request_count
                )
                db.add(log)
                db.commit()
            finally:
                db.close()
        except Exception:
            pass  # Don't fail request if logging fails
    
    def get_stats(self):
        """Get rate limiter statistics"""
        now = datetime.utcnow()
        active_blocks = sum(1 for block_until in self.blocked_ips.values() if block_until > now)
        
        return {
            "total_ips_tracked": len(self.requests),
            "blocked_ips": active_blocks,
            "blocked_ip_list": [
                {"ip": ip, "blocked_until": block_until.isoformat()}
                for ip, block_until in self.blocked_ips.items()
                if block_until > now
            ]
        }

# Global rate limiter instance
rate_limiter = RateLimiter()

class RateLimitMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        # Skip rate limiting for health checks
        if request.url.path in ["/health", "/api/health"]:
            return await call_next(request)
        
        # Get client IP
        client_ip = request.client.host
        if "x-forwarded-for" in request.headers:
            client_ip = request.headers["x-forwarded-for"].split(",")[0].strip()
        
        # Check if IP is blocked
        if rate_limiter.is_blocked(client_ip):
            raise HTTPException(
                status_code=429,
                detail="Too many requests. Your IP has been temporarily blocked. Please try again later."
            )
        
        # Check rate limit
        allowed, remaining = rate_limiter.check_rate_limit(client_ip)
        
        if not allowed:
            raise HTTPException(
                status_code=429,
                detail=f"Rate limit exceeded. Maximum {rate_limiter.max_requests} requests per {rate_limiter.window_seconds} seconds. Try again in 15 minutes."
            )
        
        # Process request
        response = await call_next(request)
        
        # Add rate limit headers
        response.headers["X-RateLimit-Limit"] = str(rate_limiter.max_requests)
        response.headers["X-RateLimit-Remaining"] = str(remaining)
        response.headers["X-RateLimit-Reset"] = str(rate_limiter.window_seconds)
        
        return response
