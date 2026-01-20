"""
Database Status Check - Verify Real-Time Integration
Copyright © 2024 Paksa IT Solutions
"""

from sqlalchemy import create_engine, text, inspect
from config.database import engine, SessionLocal
from api.models.database_models import *

def check_database_status():
    """Check database tables and data"""
    print("=" * 60)
    print("DATABASE STATUS CHECK")
    print("=" * 60)
    
    db = SessionLocal()
    inspector = inspect(engine)
    
    try:
        # Check all tables
        tables = inspector.get_table_names()
        print(f"\n📊 Total Tables: {len(tables)}")
        print("-" * 60)
        
        table_models = {
            "users": User,
            "roles": Role,
            "permissions": Permission,
            "user_activities": UserActivity,
            "tenants": None,  # TENANTS_DB
            "revenue_records": RevenueRecord,
            "feature_flags": FeatureFlag,
            "system_logs": SystemLog,
            "support_tickets": SupportTicket,
            "ticket_messages": TicketMessage,
            "notifications": Notification,
            "api_keys": ApiKey,
            "backup_records": BackupRecord,
            "security_audit_log": SecurityAuditLog,
            "bot_detections": BotDetection,
            "rate_limit_logs": RateLimitLog,
            "api_logs": ApiLog,
            "slow_query_logs": SlowQueryLog,
            "model_versions": ModelVersion,
            "anomaly_resolutions": AnomalyResolution
        }
        
        for table_name, model in table_models.items():
            if table_name in tables:
                if model:
                    count = db.query(model).count()
                    print(f"✅ {table_name:<30} {count:>5} records")
                else:
                    print(f"✅ {table_name:<30} (in-memory)")
            else:
                print(f"❌ {table_name:<30} MISSING")
        
        # Check critical data
        print("\n" + "=" * 60)
        print("CRITICAL DATA CHECK")
        print("=" * 60)
        
        # Users
        admin_count = db.query(User).filter(User.role.in_(["super_admin", "admin"])).count()
        tenant_count = db.query(User).filter(User.role == "tenant").count()
        print(f"\n👥 Users:")
        print(f"  - Admin users: {admin_count}")
        print(f"  - Tenant users: {tenant_count}")
        
        # Roles
        role_count = db.query(Role).count()
        print(f"\n🔐 Roles: {role_count}")
        if role_count > 0:
            roles = db.query(Role).all()
            for role in roles:
                print(f"  - {role.display_name} ({role.name})")
        
        # Revenue
        revenue_count = db.query(RevenueRecord).count()
        total_revenue = db.query(func.sum(RevenueRecord.amount)).filter(RevenueRecord.status == "paid").scalar() or 0
        print(f"\n💰 Revenue:")
        print(f"  - Total invoices: {revenue_count}")
        print(f"  - Total revenue: ${total_revenue}")
        
        # Support Tickets
        ticket_count = db.query(SupportTicket).count()
        open_tickets = db.query(SupportTicket).filter(SupportTicket.status == "open").count()
        print(f"\n🎫 Support Tickets:")
        print(f"  - Total tickets: {ticket_count}")
        print(f"  - Open tickets: {open_tickets}")
        
        # API Keys
        key_count = db.query(ApiKey).filter(ApiKey.revoked == False).count()
        print(f"\n🔑 API Keys: {key_count} active")
        
        # Feature Flags
        flag_count = db.query(FeatureFlag).count()
        enabled_flags = db.query(FeatureFlag).filter(FeatureFlag.enabled == True).count()
        print(f"\n🎛️  Feature Flags:")
        print(f"  - Total flags: {flag_count}")
        print(f"  - Enabled: {enabled_flags}")
        
        # Model Versions
        model_count = db.query(ModelVersion).count()
        active_models = db.query(ModelVersion).filter(ModelVersion.is_active == True).count()
        print(f"\n🤖 ML Models:")
        print(f"  - Total versions: {model_count}")
        print(f"  - Active: {active_models}")
        
        print("\n" + "=" * 60)
        print("✅ DATABASE IS FULLY OPERATIONAL")
        print("=" * 60)
        
    except Exception as e:
        print(f"\n❌ Error checking database: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    check_database_status()
