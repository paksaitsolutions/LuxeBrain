"""
Tenant Usage Tracker
Copyright © 2024 Paksa IT Solutions
"""

from typing import Dict, Optional
from datetime import datetime, timedelta
from collections import defaultdict
import threading

# In-memory usage tracking (use Redis/DB in production)
_usage_data: Dict[str, Dict] = defaultdict(lambda: {
    "api_calls": 0,
    "storage_bytes": 0,
    "ml_inferences": 0,
    "last_reset": datetime.utcnow().isoformat(),
    "daily_breakdown": defaultdict(lambda: {
        "api_calls": 0,
        "storage_bytes": 0,
        "ml_inferences": 0
    })
})
_usage_lock = threading.Lock()


class UsageTracker:
    """Tracks tenant resource usage"""
    
    @staticmethod
    def track_api_call(tenant_id: str, endpoint: str = None):
        """Track API call for tenant"""
        if not tenant_id:
            return
        
        with _usage_lock:
            today = datetime.utcnow().date().isoformat()
            _usage_data[tenant_id]["api_calls"] += 1
            _usage_data[tenant_id]["daily_breakdown"][today]["api_calls"] += 1
    
    @staticmethod
    def track_storage(tenant_id: str, bytes_used: int):
        """Track storage usage for tenant"""
        if not tenant_id:
            return
        
        with _usage_lock:
            _usage_data[tenant_id]["storage_bytes"] = bytes_used
    
    @staticmethod
    def track_ml_inference(tenant_id: str, model_type: str = None):
        """Track ML model inference for tenant"""
        if not tenant_id:
            return
        
        with _usage_lock:
            today = datetime.utcnow().date().isoformat()
            _usage_data[tenant_id]["ml_inferences"] += 1
            _usage_data[tenant_id]["daily_breakdown"][today]["ml_inferences"] += 1
    
    @staticmethod
    def get_usage(tenant_id: str) -> Dict:
        """Get usage statistics for tenant"""
        return dict(_usage_data.get(tenant_id, {}))
    
    @staticmethod
    def get_all_usage() -> Dict:
        """Get usage statistics for all tenants"""
        return {tid: dict(data) for tid, data in _usage_data.items()}
    
    @staticmethod
    def reset_usage(tenant_id: str):
        """Reset usage counters for tenant"""
        with _usage_lock:
            if tenant_id in _usage_data:
                _usage_data[tenant_id] = {
                    "api_calls": 0,
                    "storage_bytes": 0,
                    "ml_inferences": 0,
                    "last_reset": datetime.utcnow().isoformat(),
                    "daily_breakdown": defaultdict(lambda: {
                        "api_calls": 0,
                        "storage_bytes": 0,
                        "ml_inferences": 0
                    })
                }
    
    @staticmethod
    def get_daily_usage(tenant_id: str, date: str = None) -> Dict:
        """Get usage for specific day"""
        if not date:
            date = datetime.utcnow().date().isoformat()
        
        tenant_data = _usage_data.get(tenant_id, {})
        daily = tenant_data.get("daily_breakdown", {})
        return dict(daily.get(date, {"api_calls": 0, "storage_bytes": 0, "ml_inferences": 0}))
