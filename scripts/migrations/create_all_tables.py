"""
Comprehensive Database Migration Script
Creates all tables for LuxeBrain AI
Copyright © 2024 Paksa IT Solutions. All Rights Reserved.
"""

import sys
import os

sys.path.append(os.path.dirname(os.path.dirname(__file__)))

from config.database import Base, engine
from api.models.database_models import (
    Customer, Product, Order, OrderItem, UserInteraction,
    Recommendation, Forecast, PricingRecommendation,
    ModelMetrics, ModelVersion, User, PasswordHistory,
    LoginAttempt, SecurityAuditLog, UndoAction, BotDetection,
    HoneypotDetection, RateLimitLog, ApiLog, SlowQueryLog,
    DeprecatedApiLog
)

def create_all_tables():
    """Create all database tables"""
    print("=" * 60)
    print("LuxeBrain AI - Database Migration")
    print("=" * 60)
    print("\nCreating all tables...")
    
    try:
        # Create all tables
        Base.metadata.create_all(bind=engine)
        
        print("\n[SUCCESS] Successfully created all tables:")
        print("   - Customer, Product, Order, OrderItem")
        print("   - UserInteraction, Recommendation, Forecast")
        print("   - PricingRecommendation, ModelMetrics, ModelVersion")
        print("   - User, PasswordHistory, LoginAttempt")
        print("   - SecurityAuditLog, UndoAction, BotDetection")
        print("   - HoneypotDetection, RateLimitLog, ApiLog")
        print("   - SlowQueryLog, DeprecatedApiLog")
        
        print("\n" + "=" * 60)
        print("[SUCCESS] Database migration completed successfully!")
        print("=" * 60)
        
    except Exception as e:
        print(f"\n[ERROR] Error creating tables: {e}")
        raise

if __name__ == "__main__":
    create_all_tables()
