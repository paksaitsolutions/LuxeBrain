"""
Tenant Management System
Copyright © 2024 Paksa IT Solutions

Multi-tenant isolation and management
"""

from sqlalchemy import Column, String, Integer, DECIMAL, TIMESTAMP, Boolean
from sqlalchemy.dialects.postgresql import UUID
from config.database import Base
from datetime import datetime, timedelta
import uuid


class Tenant(Base):
    __tablename__ = "tenants"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    subdomain = Column(String(50), unique=True, nullable=False)
    company_name = Column(String(255), nullable=False)
    plan_id = Column(String(20), default='starter')
    status = Column(String(20), default='trial')
    
    # Trial management
    trial_ends_at = Column(TIMESTAMP, default=lambda: datetime.utcnow() + timedelta(days=14))
    
    # Usage tracking
    api_calls_month = Column(Integer, default=0)
    products_count = Column(Integer, default=0)
    orders_month = Column(Integer, default=0)
    
    # Limits
    api_limit = Column(Integer, default=50000)
    products_limit = Column(Integer, default=500)
    
    # WooCommerce connection
    woocommerce_url = Column(String(255))
    woocommerce_key = Column(String(255))
    woocommerce_secret = Column(String(255))
    
    # Database
    db_schema = Column(String(50))
    
    created_at = Column(TIMESTAMP, default=datetime.utcnow)
    updated_at = Column(TIMESTAMP, default=datetime.utcnow, onupdate=datetime.utcnow)


class TenantManager:
    """Manage tenant lifecycle"""
    
    PLAN_LIMITS = {
        'starter': {
            'price': 99,
            'products': 500,
            'api_calls': 50000,
            'orders': 1000,
            'emails': 1000,
        },
        'growth': {
            'price': 299,
            'products': 2000,
            'api_calls': 200000,
            'orders': 5000,
            'emails': 5000,
        },
        'pro': {
            'price': 799,
            'products': 10000,
            'api_calls': 1000000,
            'orders': 25000,
            'emails': 25000,
        },
        'enterprise': {
            'price': 2999,
            'products': -1,  # unlimited
            'api_calls': -1,
            'orders': -1,
            'emails': -1,
        }
    }
    
    def create_tenant(self, subdomain: str, company_name: str, email: str, plan: str = 'starter'):
        """Create new tenant with isolated database"""
        
        tenant_id = str(uuid.uuid4())
        schema_name = f"tenant_{tenant_id.replace('-', '_')}"
        
        # Create tenant record
        tenant = Tenant(
            id=tenant_id,
            subdomain=subdomain,
            company_name=company_name,
            plan_id=plan,
            db_schema=schema_name,
            **self.PLAN_LIMITS[plan]
        )
        
        # Create isolated database schema
        self._create_tenant_schema(schema_name)
        
        # Generate API key
        api_key = self._generate_api_key(tenant_id)
        
        # Send welcome email
        self._send_welcome_email(email, subdomain, api_key)
        
        return tenant
    
    def _create_tenant_schema(self, schema_name: str):
        """Create isolated database schema for tenant"""
        from sqlalchemy import create_engine, text
        from config.settings import settings
        
        engine = create_engine(settings.DATABASE_URL)
        
        with engine.connect() as conn:
            # Create schema
            conn.execute(text(f"CREATE SCHEMA IF NOT EXISTS {schema_name}"))
            
            # Create tables in schema
            conn.execute(text(f"""
                CREATE TABLE {schema_name}.customers (
                    id SERIAL PRIMARY KEY,
                    woocommerce_id INTEGER UNIQUE,
                    email VARCHAR(255),
                    segment VARCHAR(50),
                    lifetime_value DECIMAL(10,2),
                    created_at TIMESTAMP DEFAULT NOW()
                )
            """))
            
            conn.execute(text(f"""
                CREATE TABLE {schema_name}.products (
                    id SERIAL PRIMARY KEY,
                    woocommerce_id INTEGER UNIQUE,
                    name VARCHAR(255),
                    price DECIMAL(10,2),
                    category VARCHAR(100),
                    created_at TIMESTAMP DEFAULT NOW()
                )
            """))
            
            conn.execute(text(f"""
                CREATE TABLE {schema_name}.orders (
                    id SERIAL PRIMARY KEY,
                    woocommerce_id INTEGER UNIQUE,
                    customer_id INTEGER,
                    total DECIMAL(10,2),
                    created_at TIMESTAMP DEFAULT NOW()
                )
            """))
            
            conn.commit()
    
    def _generate_api_key(self, tenant_id: str) -> str:
        """Generate API key for tenant"""
        import secrets
        return f"lb_{tenant_id[:8]}_{secrets.token_urlsafe(32)}"
    
    def _send_welcome_email(self, email: str, subdomain: str, api_key: str):
        """Send welcome email with setup instructions"""
        # Email sending logic
        pass
    
    def check_limit(self, tenant_id: str, resource: str) -> bool:
        """Check if tenant is within limits"""
        from config.database import SessionLocal
        
        db = SessionLocal()
        tenant = db.query(Tenant).filter(Tenant.id == tenant_id).first()
        
        if not tenant:
            return False
        
        limits = self.PLAN_LIMITS[tenant.plan_id]
        limit = limits.get(resource, -1)
        
        if limit == -1:  # unlimited
            return True
        
        current_usage = getattr(tenant, f"{resource}_count", 0)
        return current_usage < limit
    
    def upgrade_plan(self, tenant_id: str, new_plan: str):
        """Upgrade tenant to new plan"""
        from config.database import SessionLocal
        
        db = SessionLocal()
        tenant = db.query(Tenant).filter(Tenant.id == tenant_id).first()
        
        if tenant:
            tenant.plan_id = new_plan
            
            # Update limits
            limits = self.PLAN_LIMITS[new_plan]
            tenant.api_limit = limits['api_calls']
            tenant.products_limit = limits['products']
            
            db.commit()
            
            return True
        
        return False
