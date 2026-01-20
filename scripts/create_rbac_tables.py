"""
Add RBAC and Admin Portal Tables
Copyright © 2024 Paksa IT Solutions
"""

import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from sqlalchemy import create_engine, text
from config.database import Base, engine
from api.models.database_models import *

def create_all_tables():
    """Create all database tables"""
    print("Creating database tables...")
    
    try:
        Base.metadata.create_all(bind=engine)
        print("✅ All tables created successfully!")
        
        # List all tables
        with engine.connect() as conn:
            result = conn.execute(text("SELECT name FROM sqlite_master WHERE type='table'"))
            tables = [row[0] for row in result]
            print(f"\n📊 Total tables: {len(tables)}")
            for table in sorted(tables):
                print(f"  - {table}")
                
    except Exception as e:
        print(f"❌ Error creating tables: {e}")

if __name__ == "__main__":
    create_all_tables()
