"""
Usage Metering Scheduler
Copyright © 2024 Paksa IT Solutions
"""

from apscheduler.schedulers.background import BackgroundScheduler
from api.utils.usage_meter import UsageMeter
from api.utils.usage_tracker import UsageTracker

scheduler = BackgroundScheduler()


def report_daily_usage():
    """Report daily usage to Stripe for all tenants"""
    print("📊 Running daily usage report...")
    
    # TODO: Migrate to database
    # for tenant_id, tenant_data in TENANTS_DB.items():
    #     if tenant_data.get("status") != "active":
    #         continue
    #     
    #     usage = UsageTracker.get_daily_usage(tenant_id)
    #     customer_id = tenant_data.get("stripe_customer_id")
    #     subscription_item_id = tenant_data.get("stripe_subscription_item_id")
    #     
    #     if not customer_id or not subscription_item_id:
    #         continue
    #     
    #     # Report API calls
    #     api_calls = usage.get("api_calls", 0)
    #     if api_calls > 0:
    #         UsageMeter.report_usage(tenant_id, subscription_item_id, api_calls, "api_calls")
    #     
    #     # Report ML inferences
    #     ml_inferences = usage.get("ml_inferences", 0)
    #     if ml_inferences > 0:
    #         UsageMeter.report_usage(tenant_id, subscription_item_id, ml_inferences, "ml_inferences")


def generate_monthly_invoices():
    """Generate overage invoices at end of month"""
    print("💰 Generating monthly overage invoices...")
    
    # TODO: Migrate to database
    # for tenant_id, tenant_data in TENANTS_DB.items():
    #     if tenant_data.get("status") != "active":
    #         continue
    #     
    #     customer_id = tenant_data.get("stripe_customer_id")
    #     plan = tenant_data.get("plan", "basic")
    #     
    #     if not customer_id:
    #         continue
    #     
    #     UsageMeter.create_overage_invoice(tenant_id, customer_id, plan)


def start_scheduler():
    """Start the usage metering scheduler"""
    # Report usage daily at midnight
    scheduler.add_job(report_daily_usage, 'cron', hour=0, minute=0)
    
    # Generate invoices on 1st of each month
    scheduler.add_job(generate_monthly_invoices, 'cron', day=1, hour=0, minute=0)
    
    scheduler.start()
    print("⏰ Usage metering scheduler started")


def stop_scheduler():
    """Stop the scheduler"""
    scheduler.shutdown()
