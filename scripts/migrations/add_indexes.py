"""
Add Database Indexes for Performance Optimization
Copyright © 2024 Paksa IT Solutions. All Rights Reserved.
"""

import sys
import os

sys.path.append(os.path.dirname(os.path.dirname(__file__)))

from sqlalchemy import Index, text
from config.database import engine

def add_indexes():
    """Add performance indexes to database tables"""
    print("=" * 60)
    print("Adding Database Indexes")
    print("=" * 60)
    
    indexes = [
        # ModelVersion indexes
        "CREATE INDEX IF NOT EXISTS idx_model_versions_name_version ON model_versions(model_name, version)",
        
        # ModelMetrics indexes
        "CREATE INDEX IF NOT EXISTS idx_model_metrics_name_timestamp ON model_metrics(model_name, timestamp)",
        
        # Orders indexes
        "CREATE INDEX IF NOT EXISTS idx_orders_tenant_created ON orders(tenant_id, created_at)" if hasattr(engine.dialect, 'name') and engine.dialect.name != 'sqlite' else None,
        
        # Customers indexes
        "CREATE INDEX IF NOT EXISTS idx_customers_tenant_email ON customers(tenant_id, email)" if hasattr(engine.dialect, 'name') and engine.dialect.name != 'sqlite' else None,
        
        # ApiLog indexes
        "CREATE INDEX IF NOT EXISTS idx_api_logs_tenant_created ON api_logs(tenant_id, created_at)",
        
        # SecurityAuditLog indexes
        "CREATE INDEX IF NOT EXISTS idx_security_audit_tenant_timestamp ON security_audit_log(tenant_id, timestamp)",
    ]
    
    with engine.connect() as conn:
        for idx_sql in indexes:
            if idx_sql:
                try:
                    conn.execute(text(idx_sql))
                    conn.commit()
                    print(f"[SUCCESS] Created index: {idx_sql.split('ON')[1].strip()}")
                except Exception as e:
                    print(f"[WARNING] Index may already exist or error: {e}")
    
    print("\n" + "=" * 60)
    print("[SUCCESS] Database indexes added successfully!")
    print("=" * 60)

if __name__ == "__main__":
    add_indexes()
