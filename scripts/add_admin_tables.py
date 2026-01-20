"""
Add Admin Panel Tables Migration
Copyright © 2024 Paksa IT Solutions
"""

import sys
from pathlib import Path

# Add parent directory to Python path
sys.path.insert(0, str(Path(__file__).parent.parent))

from config.database import engine
from api.models.database_models import DemoRequest, Coupon, Webhook, EmailTemplate

def add_admin_tables():
    """Add admin panel tables to database"""
    print("Adding admin panel tables...")
    
    try:
        DemoRequest.__table__.create(engine, checkfirst=True)
        print("  ✅ DemoRequest table created")
        
        Coupon.__table__.create(engine, checkfirst=True)
        print("  ✅ Coupon table created")
        
        Webhook.__table__.create(engine, checkfirst=True)
        print("  ✅ Webhook table created")
        
        EmailTemplate.__table__.create(engine, checkfirst=True)
        print("  ✅ EmailTemplate table created")
        
        print("\n✅ All admin panel tables created successfully!")
        
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    add_admin_tables()
