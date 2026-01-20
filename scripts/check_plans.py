"""
Check Plans in Database
Copyright © 2024 Paksa IT Solutions
"""

import sys
from pathlib import Path

# Add parent directory to Python path
sys.path.insert(0, str(Path(__file__).parent.parent))

from config.database import SessionLocal
from api.models.database_models import Plan

def check_plans():
    """Check plans in database"""
    db = SessionLocal()
    
    try:
        plans = db.query(Plan).all()
        
        if not plans:
            print("No plans found in database!")
            return
        
        print(f"Found {len(plans)} plans in database:\n")
        
        for plan in plans:
            print(f"Plan ID: {plan.plan_id}")
            print(f"  Name: {plan.name}")
            print(f"  Price: ${plan.price}/{plan.billing_period}")
            print(f"  Features: {len(plan.features or [])} features")
            print(f"  Active: {plan.is_active}")
            print(f"  Admin Only: {plan.admin_only}")
            print()
            
    except Exception as e:
        print(f"Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    check_plans()
