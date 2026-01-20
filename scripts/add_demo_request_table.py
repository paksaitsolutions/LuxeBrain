"""
Add DemoRequest Table Migration
Copyright © 2024 Paksa IT Solutions
"""

import sys
from pathlib import Path

# Add parent directory to Python path
sys.path.insert(0, str(Path(__file__).parent.parent))

from config.database import engine
from api.models.database_models import DemoRequest

def add_demo_request_table():
    """Add DemoRequest table to database"""
    print("Adding DemoRequest table...")
    
    try:
        DemoRequest.__table__.create(engine, checkfirst=True)
        print("✅ DemoRequest table created successfully!")
        
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    add_demo_request_table()
