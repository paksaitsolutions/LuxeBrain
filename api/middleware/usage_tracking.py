"""
Usage Tracking Middleware
Copyright © 2024 Paksa IT Solutions
"""

from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from api.utils.usage_tracker import UsageTracker
from api.utils.anomaly_detector import AnomalyDetector

detector = AnomalyDetector()


class UsageTrackingMiddleware(BaseHTTPMiddleware):
    """Tracks API usage per tenant"""
    
    async def dispatch(self, request: Request, call_next):
        # Track API call if tenant_id exists
        tenant_id = getattr(request.state, 'tenant_id', None)
        
        if tenant_id and request.method in ['GET', 'POST', 'PUT', 'DELETE', 'PATCH']:
            UsageTracker.track_api_call(tenant_id, request.url.path)
            
            # Check for anomalies
            anomaly = detector.check_api_rate_anomaly(tenant_id)
            if anomaly:
                detector.flag_anomaly(anomaly)
        
        response = await call_next(request)
        return response
