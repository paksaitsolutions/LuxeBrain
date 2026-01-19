"""
Tenant Resolver - Validates and caches tenant metadata
Copyright © 2024 Paksa IT Solutions
"""

from typing import Optional, Dict
from datetime import datetime, timedelta

# In-memory cache (use Redis in production)
_tenant_cache: Dict[str, Dict] = {}
_cache_ttl = timedelta(minutes=15)

# Mock tenant database (replace with actual DB queries)
TENANTS_DB = {
    "tenant_1": {
        "id": "tenant_1",
        "name": "Demo Store",
        "email": "demo@store.com",
        "status": "active",
        "plan": "premium",
        "created_at": "2024-01-01T00:00:00Z"
    },
    "tenant_2": {
        "id": "tenant_2",
        "name": "Fashion Boutique",
        "email": "contact@boutique.com",
        "status": "active",
        "plan": "basic",
        "created_at": "2024-01-15T00:00:00Z"
    }
}


class TenantResolver:
    """Resolves and validates tenant context"""
    
    @staticmethod
    def get_tenant(tenant_id: str) -> Optional[Dict]:
        """Get tenant metadata with caching"""
        if not tenant_id:
            return None
        
        # Check cache
        cached = _tenant_cache.get(tenant_id)
        if cached and cached.get('expires_at', datetime.min) > datetime.utcnow():
            return cached['data']
        
        # Fetch from database
        tenant = TENANTS_DB.get(tenant_id)
        
        if tenant:
            # Cache tenant data
            _tenant_cache[tenant_id] = {
                'data': tenant,
                'expires_at': datetime.utcnow() + _cache_ttl
            }
        
        return tenant
    
    @staticmethod
    def is_active(tenant_id: str) -> bool:
        """Check if tenant is active"""
        tenant = TenantResolver.get_tenant(tenant_id)
        return tenant is not None and tenant.get('status') == 'active'
    
    @staticmethod
    def validate_tenant(tenant_id: str) -> tuple[bool, Optional[str]]:
        """Validate tenant exists and is active"""
        if not tenant_id:
            return False, "Tenant ID is required"
        
        tenant = TenantResolver.get_tenant(tenant_id)
        
        if not tenant:
            return False, "Tenant not found"
        
        if tenant.get('status') != 'active':
            return False, f"Tenant is {tenant.get('status')}"
        
        return True, None
    
    @staticmethod
    def invalidate_cache(tenant_id: str):
        """Invalidate cached tenant data"""
        if tenant_id in _tenant_cache:
            del _tenant_cache[tenant_id]
    
    @staticmethod
    def get_plan(tenant_id: str) -> Optional[str]:
        """Get tenant's subscription plan"""
        tenant = TenantResolver.get_tenant(tenant_id)
        return tenant.get('plan') if tenant else None
