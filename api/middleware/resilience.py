"""
Enterprise Hardening - Fail-Safe System
Copyright © 2024 Paksa IT Solutions

Graceful degradation, cost control, security
"""

from functools import wraps
from typing import Any, Callable
import time
import redis
from config.settings import settings


class CircuitBreaker:
    """Circuit breaker pattern for API resilience"""
    
    def __init__(self, failure_threshold: int = 5, timeout: int = 60):
        self.failure_threshold = failure_threshold
        self.timeout = timeout
        self.redis_client = redis.from_url(settings.REDIS_URL)
    
    def __call__(self, func: Callable) -> Callable:
        @wraps(func)
        def wrapper(*args, **kwargs):
            circuit_key = f"circuit:{func.__name__}"
            
            # Check circuit state
            state = self.redis_client.get(circuit_key)
            if state == b'open':
                # Circuit is open - return fallback
                return self._fallback(func.__name__)
            
            try:
                result = func(*args, **kwargs)
                # Success - reset failure count
                self.redis_client.delete(f"{circuit_key}:failures")
                return result
            
            except Exception as e:
                # Increment failure count
                failures = self.redis_client.incr(f"{circuit_key}:failures")
                
                if failures >= self.failure_threshold:
                    # Open circuit
                    self.redis_client.setex(circuit_key, self.timeout, 'open')
                
                return self._fallback(func.__name__)
        
        return wrapper
    
    def _fallback(self, func_name: str) -> Any:
        """Fallback responses when AI fails"""
        
        fallbacks = {
            'get_recommendations': {
                'products': [],
                'scores': [],
                'recommendation_type': 'fallback'
            },
            'predict_pricing': {
                'product_id': 0,
                'current_price': 0,
                'recommended_price': 0,
                'discount_percentage': 0
            },
            'predict_segment': {
                'customer_id': 0,
                'segment': 'general',
                'segment_description': 'General Customer'
            }
        }
        
        return fallbacks.get(func_name, {})


class RateLimiter:
    """Advanced rate limiting with cost control"""
    
    def __init__(self):
        self.redis_client = redis.from_url(settings.REDIS_URL)
    
    def check_limit(
        self,
        key: str,
        limit: int,
        window: int = 60,
        cost: float = 1.0
    ) -> bool:
        """Check if request is within limits"""
        
        current = self.redis_client.get(key)
        
        if current and float(current) >= limit:
            return False
        
        pipe = self.redis_client.pipeline()
        pipe.incrbyfloat(key, cost)
        pipe.expire(key, window)
        pipe.execute()
        
        return True
    
    def check_cost_limit(self, customer_id: int, cost: float) -> bool:
        """Check daily cost limit per customer"""
        
        daily_limit = 100  # $100 daily API cost per customer
        key = f"cost:{customer_id}:{time.strftime('%Y%m%d')}"
        
        current_cost = self.redis_client.get(key)
        if current_cost and float(current_cost) >= daily_limit:
            return False
        
        pipe = self.redis_client.pipeline()
        pipe.incrbyfloat(key, cost)
        pipe.expire(key, 86400)  # 24 hours
        pipe.execute()
        
        return True


class GracefulDegradation:
    """Graceful degradation strategies"""
    
    @staticmethod
    def fallback_recommendations(product_id: int = None) -> dict:
        """Fallback to simple recommendations"""
        
        # Return popular products or related category items
        return {
            'products': [],
            'scores': [],
            'recommendation_type': 'popular',
            'fallback': True
        }
    
    @staticmethod
    def fallback_pricing(product_id: int) -> dict:
        """Fallback to standard pricing"""
        
        # Return original price without AI optimization
        return {
            'product_id': product_id,
            'current_price': 0,
            'recommended_price': 0,
            'discount_percentage': 0,
            'fallback': True
        }
    
    @staticmethod
    def fallback_personalization() -> dict:
        """Fallback to generic content"""
        
        return {
            'personalized_message': 'Welcome! Check out our latest collection.',
            'recommended_products': [],
            'fallback': True
        }


class SecurityValidator:
    """Security validation layer"""
    
    @staticmethod
    def validate_input(data: dict) -> bool:
        """Validate input data"""
        
        # Check for SQL injection patterns
        dangerous_patterns = ["'", '"', '--', ';', 'DROP', 'DELETE', 'UPDATE']
        
        for value in data.values():
            if isinstance(value, str):
                if any(pattern in value.upper() for pattern in dangerous_patterns):
                    return False
        
        return True
    
    @staticmethod
    def sanitize_output(data: dict) -> dict:
        """Sanitize output data"""
        
        # Remove sensitive fields
        sensitive_fields = ['password', 'token', 'secret', 'key']
        
        return {
            k: v for k, v in data.items()
            if k.lower() not in sensitive_fields
        }


class CostOptimizer:
    """Optimize API costs"""
    
    def __init__(self):
        self.redis_client = redis.from_url(settings.REDIS_URL)
    
    def should_use_ai(self, customer_id: int = None, feature: str = 'recommendation') -> bool:
        """Decide if AI should be used based on cost/benefit"""
        
        # High-value customers always get AI
        if customer_id:
            # Check customer segment
            segment_key = f"segment:{customer_id}"
            segment = self.redis_client.get(segment_key)
            
            if segment in [b'segment_0', b'segment_1']:  # VIP, Loyal
                return True
        
        # For anonymous users, use AI during peak hours only
        current_hour = time.localtime().tm_hour
        if 18 <= current_hour <= 22:  # Peak shopping hours
            return True
        
        # Random sampling for others (30%)
        import random
        return random.random() < 0.3
    
    def log_cost(self, feature: str, cost: float):
        """Log feature cost"""
        
        date_key = time.strftime('%Y%m%d')
        cost_key = f"daily_cost:{feature}:{date_key}"
        
        self.redis_client.incrbyfloat(cost_key, cost)
        self.redis_client.expire(cost_key, 86400 * 7)  # Keep 7 days


# Decorator for resilient AI calls
circuit_breaker = CircuitBreaker()
rate_limiter = RateLimiter()
cost_optimizer = CostOptimizer()


def resilient_ai_call(cost: float = 0.01):
    """Decorator for resilient AI calls with cost tracking"""
    
    def decorator(func: Callable) -> Callable:
        @wraps(func)
        @circuit_breaker
        def wrapper(*args, **kwargs):
            # Check rate limit
            if not rate_limiter.check_limit(f"api:{func.__name__}", 1000, 60):
                return GracefulDegradation.fallback_recommendations()
            
            # Check cost optimization
            customer_id = kwargs.get('customer_id')
            if not cost_optimizer.should_use_ai(customer_id, func.__name__):
                return GracefulDegradation.fallback_recommendations()
            
            # Log cost
            cost_optimizer.log_cost(func.__name__, cost)
            
            # Execute function
            try:
                return func(*args, **kwargs)
            except Exception:
                # Fallback on error
                if 'recommendation' in func.__name__:
                    return GracefulDegradation.fallback_recommendations()
                elif 'pricing' in func.__name__:
                    return GracefulDegradation.fallback_pricing(kwargs.get('product_id', 0))
                else:
                    return GracefulDegradation.fallback_personalization()
        
        return wrapper
    return decorator
