"""
Usage Metering for Stripe
Copyright © 2024 Paksa IT Solutions
"""

import stripe
import os
from datetime import datetime
from typing import Dict
from api.utils.usage_tracker import UsageTracker

stripe.api_key = os.getenv("STRIPE_SECRET_KEY", "sk_test_...")

# Metered billing price IDs
METERED_PRICES = {
    "api_calls": "price_api_calls_metered",
    "ml_inferences": "price_ml_inferences_metered",
    "storage_gb": "price_storage_metered"
}

# Overage thresholds and pricing
OVERAGE_CONFIG = {
    "basic": {
        "api_calls_included": 1000,
        "ml_inferences_included": 100,
        "price_per_1000_api_calls": 5,
        "price_per_100_ml_inferences": 10
    },
    "premium": {
        "api_calls_included": 10000,
        "ml_inferences_included": 1000,
        "price_per_1000_api_calls": 3,
        "price_per_100_ml_inferences": 7
    },
    "enterprise": {
        "api_calls_included": 100000,
        "ml_inferences_included": 10000,
        "price_per_1000_api_calls": 1,
        "price_per_100_ml_inferences": 3
    }
}


class UsageMeter:
    """Reports usage to Stripe for metered billing"""
    
    @staticmethod
    def report_usage(tenant_id: str, subscription_item_id: str, quantity: int, metric: str):
        """Report usage to Stripe"""
        try:
            stripe.SubscriptionItem.create_usage_record(
                subscription_item_id,
                quantity=quantity,
                timestamp=int(datetime.utcnow().timestamp()),
                action='set'
            )
            print(f"✅ Reported {quantity} {metric} for tenant {tenant_id}")
        except Exception as e:
            print(f"❌ Failed to report usage: {e}")
    
    @staticmethod
    def calculate_overage(tenant_id: str, plan: str) -> Dict:
        """Calculate overage charges"""
        usage = UsageTracker.get_daily_usage(tenant_id)
        config = OVERAGE_CONFIG.get(plan, OVERAGE_CONFIG["basic"])
        
        api_calls = usage.get("api_calls", 0)
        ml_inferences = usage.get("ml_inferences", 0)
        
        # Calculate overages
        api_overage = max(0, api_calls - config["api_calls_included"])
        ml_overage = max(0, ml_inferences - config["ml_inferences_included"])
        
        # Calculate charges
        api_charge = (api_overage / 1000) * config["price_per_1000_api_calls"]
        ml_charge = (ml_overage / 100) * config["price_per_100_ml_inferences"]
        
        return {
            "api_calls": {
                "used": api_calls,
                "included": config["api_calls_included"],
                "overage": api_overage,
                "charge": round(api_charge, 2)
            },
            "ml_inferences": {
                "used": ml_inferences,
                "included": config["ml_inferences_included"],
                "overage": ml_overage,
                "charge": round(ml_charge, 2)
            },
            "total_overage_charge": round(api_charge + ml_charge, 2)
        }
    
    @staticmethod
    def create_overage_invoice(tenant_id: str, customer_id: str, plan: str):
        """Create invoice for overage charges"""
        overage = UsageMeter.calculate_overage(tenant_id, plan)
        
        if overage["total_overage_charge"] <= 0:
            return None
        
        try:
            # Create invoice items
            if overage["api_calls"]["charge"] > 0:
                stripe.InvoiceItem.create(
                    customer=customer_id,
                    amount=int(overage["api_calls"]["charge"] * 100),
                    currency="usd",
                    description=f"API Calls Overage: {overage['api_calls']['overage']} calls"
                )
            
            if overage["ml_inferences"]["charge"] > 0:
                stripe.InvoiceItem.create(
                    customer=customer_id,
                    amount=int(overage["ml_inferences"]["charge"] * 100),
                    currency="usd",
                    description=f"ML Inferences Overage: {overage['ml_inferences']['overage']} inferences"
                )
            
            # Create and finalize invoice
            invoice = stripe.Invoice.create(
                customer=customer_id,
                auto_advance=True,
                description=f"Usage Overage - {datetime.utcnow().strftime('%B %Y')}"
            )
            
            stripe.Invoice.finalize_invoice(invoice.id)
            
            print(f"💰 Created overage invoice for {tenant_id}: ${overage['total_overage_charge']}")
            return invoice
            
        except Exception as e:
            print(f"❌ Failed to create invoice: {e}")
            return None
