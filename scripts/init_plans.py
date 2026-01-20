"""
Initialize Plans in Database
Copyright © 2024 Paksa IT Solutions
"""

import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from config.database import SessionLocal
from api.models.database_models import Plan

def init_plans():
    db = SessionLocal()
    
    try:
        # Check if plans already exist
        existing = db.query(Plan).count()
        if existing > 0:
            print(f"✅ Plans already initialized ({existing} plans found)")
            return
        
        # Create default plans
        plans = [
            Plan(
                plan_id="free",
                name="Free",
                price=0,
                billing_period="monthly",
                features=["Basic recommendations", "100 API calls/day", "Email support"],
                limits={"api_calls": 100, "products": 50, "ml_inferences": 100},
                is_active=True,
                admin_only=True,
                sort_order=0
            ),
            Plan(
                plan_id="starter",
                name="Starter",
                price=49,
                billing_period="monthly",
                features=[
                    "AI-powered recommendations",
                    "1,000 API calls/day",
                    "Customer segmentation",
                    "Email support",
                    "Basic analytics"
                ],
                limits={"api_calls": 1000, "products": 500, "ml_inferences": 1000},
                is_active=True,
                admin_only=False,
                sort_order=1
            ),
            Plan(
                plan_id="growth",
                name="Growth",
                price=149,
                billing_period="monthly",
                features=[
                    "Everything in Starter",
                    "10,000 API calls/day",
                    "Demand forecasting",
                    "Dynamic pricing",
                    "Priority support",
                    "Advanced analytics",
                    "A/B testing"
                ],
                limits={"api_calls": 10000, "products": 5000, "ml_inferences": 10000},
                is_active=True,
                admin_only=False,
                sort_order=2
            ),
            Plan(
                plan_id="enterprise",
                name="Enterprise",
                price=499,
                billing_period="monthly",
                features=[
                    "Everything in Growth",
                    "Unlimited API calls",
                    "Isolated ML models",
                    "Visual search",
                    "Marketing automation",
                    "WhatsApp integration",
                    "Dedicated support",
                    "Custom integrations",
                    "SLA guarantee"
                ],
                limits={"api_calls": 100000, "products": 50000, "ml_inferences": 100000},
                is_active=True,
                admin_only=False,
                sort_order=3
            )
        ]
        
        for plan in plans:
            db.add(plan)
        
        db.commit()
        print(f"✅ Successfully created {len(plans)} plans:")
        for plan in plans:
            print(f"  - {plan.name}: ${plan.price}/mo ({len(plan.features)} features)")
        
    except Exception as e:
        print(f"❌ Error initializing plans: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    print("Initializing plans...")
    init_plans()
