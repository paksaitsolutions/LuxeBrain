"""
Tenant Resolver - Validates and caches tenant metadata
Copyright © 2024 Paksa IT Solutions
"""

from typing import Optional, Dict
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from config.database import SessionLocal
from api.models.database_models import Tenant

# In-memory cache (use Redis in production)
_tenant_cache: Dict[str, Dict] = {}
_cache_ttl = timedelta(minutes=15)


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
        db = SessionLocal()
        try:
            tenant = db.query(Tenant).filter(Tenant.tenant_id == tenant_id).first()
            
            if tenant:
                tenant_data = {
                    "id": tenant.tenant_id,
                    "name": tenant.name,
                    "email": tenant.email,
                    "status": tenant.status,
                    "plan": tenant.plan,
                    "api_key": tenant.api_key,
                    "company_name": tenant.company_name,
                    "company_website": tenant.company_website,
                    "company_phone": tenant.company_phone,
                    "industry": tenant.industry,
                    "address": tenant.address or {},
                    "poc": tenant.poc or {},
                    "tax_info": tenant.tax_info or {},
                    "woocommerce": tenant.woocommerce or {},
                    "created_at": tenant.created_at.isoformat() if tenant.created_at else None
                }
                
                # Cache tenant data
                _tenant_cache[tenant_id] = {
                    'data': tenant_data,
                    'expires_at': datetime.utcnow() + _cache_ttl
                }
                
                return tenant_data
        finally:
            db.close()
        
        return None
    
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
