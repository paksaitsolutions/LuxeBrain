"""
Add Tenant Table Migration
Copyright © 2024 Paksa IT Solutions
"""

import sys
from pathlib import Path

# Add parent directory to Python path
sys.path.insert(0, str(Path(__file__).parent.parent))

from config.database import SessionLocal, engine
from api.models.database_models import Base, Tenant

def add_tenant_table():
    """Add Tenant table to database"""
    print("Adding Tenant table...")
    
    try:
        # Create only the Tenant table
        Tenant.__table__.create(engine, checkfirst=True)
        print("✅ Tenant table created successfully!")
        
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    add_tenant_table()
