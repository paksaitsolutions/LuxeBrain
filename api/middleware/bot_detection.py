"""
Bot Detection Middleware
Copyright © 2024 Paksa IT Solutions
"""

from fastapi import Request, HTTPException
from starlette.middleware.base import BaseHTTPMiddleware
from datetime import datetime, timedelta
from typing import Dict
import re

# In-memory tracking (use Redis in production)
REQUEST_TRACKER: Dict[str, list] = {}
BLOCKED_IPS: Dict[str, datetime] = {}

# Known bot patterns
BOT_PATTERNS = [
    r'bot', r'crawler', r'spider', r'scraper', r'curl', r'wget',
    r'python-requests', r'scrapy', r'headless', r'phantom', r'selenium'
]

# Suspicious user agents
SUSPICIOUS_AGENTS = [
    '', 'Mozilla/5.0', 'python', 'java', 'go-http-client'
]


class BotDetectionMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        # Skip health checks
        if request.url.path in ['/health', '/alive', '/ready', '/startup']:
            return await call_next(request)
        
        ip = request.client.host if request.client else 'unknown'
        user_agent = request.headers.get('user-agent', '').lower()
        
        # Check if IP is blocked
        if ip in BLOCKED_IPS:
            if BLOCKED_IPS[ip] > datetime.utcnow():
                raise HTTPException(status_code=403, detail="Access denied: Suspicious activity detected")
            else:
                del BLOCKED_IPS[ip]
        
        # Check user agent patterns
        is_bot = any(re.search(pattern, user_agent) for pattern in BOT_PATTERNS)
        
        # Check suspicious user agents
        is_suspicious = user_agent in SUSPICIOUS_AGENTS or len(user_agent) < 10
        
        # Track request frequency
        now = datetime.utcnow()
        if ip not in REQUEST_TRACKER:
            REQUEST_TRACKER[ip] = []
        
        # Clean old requests (older than 1 minute)
        REQUEST_TRACKER[ip] = [
            ts for ts in REQUEST_TRACKER[ip]
            if now - ts < timedelta(minutes=1)
        ]
        
        # Add current request
        REQUEST_TRACKER[ip].append(now)
        
        # Check request frequency (more than 60 requests per minute)
        request_count = len(REQUEST_TRACKER[ip])
        is_flooding = request_count > 60
        
        # Block if bot detected or flooding
        if is_bot or is_flooding:
            BLOCKED_IPS[ip] = now + timedelta(minutes=15)
            
            # Log to database
            from api.models.database_models import BotDetection
            from config.database import SessionLocal
            
            db = SessionLocal()
            try:
                detection = BotDetection(
                    ip_address=ip,
                    user_agent=request.headers.get('user-agent', ''),
                    endpoint=str(request.url.path),
                    reason='bot_pattern' if is_bot else 'flooding',
                    request_count=request_count,
                    blocked_until=BLOCKED_IPS[ip]
                )
                db.add(detection)
                db.commit()
            finally:
                db.close()
            
            raise HTTPException(
                status_code=403,
                detail="Access denied: Bot or suspicious activity detected"
            )
        
        # Warn if suspicious but not blocking
        if is_suspicious and request_count > 30:
            request.state.bot_warning = True
        
        response = await call_next(request)
        
        # Add header if suspicious
        if hasattr(request.state, 'bot_warning'):
            response.headers['X-Bot-Warning'] = 'Suspicious activity detected'
        
        return response


def get_bot_stats():
    """Get bot detection statistics"""
    now = datetime.utcnow()
    active_blocks = sum(1 for exp in BLOCKED_IPS.values() if exp > now)
    
    return {
        "tracked_ips": len(REQUEST_TRACKER),
        "blocked_ips": active_blocks,
        "total_blocks": len(BLOCKED_IPS)
    }
