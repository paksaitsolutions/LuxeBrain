"""
Per-Tenant Connection Pool Manager
Copyright © 2024 Paksa IT Solutions
"""

from typing import Dict, Optional
from sqlalchemy import create_engine, event
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.pool import QueuePool
from config.settings import settings
import threading

# Per-tenant connection pools
_tenant_pools: Dict[str, sessionmaker] = {}
_pool_lock = threading.Lock()

# Pool usage stats
_pool_stats: Dict[str, Dict] = {}

# Pool limits per tenant
POOL_LIMITS = {
    "basic": {"pool_size": 5, "max_overflow": 10},
    "premium": {"pool_size": 10, "max_overflow": 20},
    "enterprise": {"pool_size": 20, "max_overflow": 40}
}


class TenantConnectionPool:
    """Manages separate connection pools per tenant"""
    
    @staticmethod
    def get_pool(tenant_id: str, plan: str = "basic") -> sessionmaker:
        """Get or create connection pool for tenant"""
        if tenant_id in _tenant_pools:
            return _tenant_pools[tenant_id]
        
        with _pool_lock:
            # Double-check after acquiring lock
            if tenant_id in _tenant_pools:
                return _tenant_pools[tenant_id]
            
            # Get pool limits based on plan
            limits = POOL_LIMITS.get(plan, POOL_LIMITS["basic"])
            
            # Create tenant-specific engine
            if settings.DATABASE_URL.startswith('sqlite'):
                engine = create_engine(
                    settings.DATABASE_URL,
                    connect_args={"check_same_thread": False},
                    pool_pre_ping=True
                )
            else:
                engine = create_engine(
                    settings.DATABASE_URL,
                    poolclass=QueuePool,
                    pool_size=limits["pool_size"],
                    max_overflow=limits["max_overflow"],
                    pool_pre_ping=True,
                    pool_recycle=3600
                )
            
            # Track pool usage
            _pool_stats[tenant_id] = {
                "connections": 0,
                "checkouts": 0,
                "plan": plan,
                "pool_size": limits["pool_size"],
                "max_overflow": limits["max_overflow"]
            }
            
            # Add event listeners for monitoring
            @event.listens_for(engine, "connect")
            def receive_connect(dbapi_conn, connection_record):
                _pool_stats[tenant_id]["connections"] += 1
            
            @event.listens_for(engine, "checkout")
            def receive_checkout(dbapi_conn, connection_record, connection_proxy):
                _pool_stats[tenant_id]["checkouts"] += 1
            
            # Create session factory
            session_factory = sessionmaker(autocommit=False, autoflush=False, bind=engine)
            _tenant_pools[tenant_id] = session_factory
            
            return session_factory
    
    @staticmethod
    def get_session(tenant_id: str, plan: str = "basic") -> Session:
        """Get database session for tenant"""
        pool = TenantConnectionPool.get_pool(tenant_id, plan)
        return pool()
    
    @staticmethod
    def get_stats(tenant_id: Optional[str] = None) -> Dict:
        """Get pool usage statistics"""
        if tenant_id:
            return _pool_stats.get(tenant_id, {})
        return _pool_stats
    
    @staticmethod
    def close_pool(tenant_id: str):
        """Close and remove tenant pool"""
        with _pool_lock:
            if tenant_id in _tenant_pools:
                pool = _tenant_pools[tenant_id]
                pool.close_all()
                del _tenant_pools[tenant_id]
                if tenant_id in _pool_stats:
                    del _pool_stats[tenant_id]


def get_tenant_db(tenant_id: str, plan: str = "basic"):
    """Dependency for FastAPI routes"""
    db = TenantConnectionPool.get_session(tenant_id, plan)
    try:
        yield db
    finally:
        db.close()
