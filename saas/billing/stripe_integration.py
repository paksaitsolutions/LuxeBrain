"""
Billing & Subscription Management
Copyright © 2024 Paksa IT Solutions

Stripe integration for SaaS billing
"""

import stripe
from datetime import datetime, timedelta
from config.settings import settings

stripe.api_key = settings.STRIPE_SECRET_KEY


class BillingManager:
    """Manage subscriptions and billing"""
    
    PRICE_IDS = {
        'starter_monthly': 'price_starter_monthly',
        'growth_monthly': 'price_growth_monthly',
        'pro_monthly': 'price_pro_monthly',
        'starter_annual': 'price_starter_annual',
        'growth_annual': 'price_growth_annual',
        'pro_annual': 'price_pro_annual',
    }
    
    def create_subscription(self, tenant_id: str, email: str, plan: str, interval: str = 'month'):
        """Create Stripe subscription"""
        
        # Create customer
        customer = stripe.Customer.create(
            email=email,
            metadata={'tenant_id': tenant_id}
        )
        
        # Create subscription
        price_id = self.PRICE_IDS[f"{plan}_{interval}ly"]
        
        subscription = stripe.Subscription.create(
            customer=customer.id,
            items=[{'price': price_id}],
            trial_period_days=14,
            metadata={'tenant_id': tenant_id}
        )
        
        return {
            'subscription_id': subscription.id,
            'customer_id': customer.id,
            'status': subscription.status,
            'current_period_end': subscription.current_period_end
        }
    
    def calculate_usage_charges(self, tenant_id: str, month: str):
        """Calculate overage charges"""
        
        from saas.tenant_management.manager import TenantManager
        
        usage = self._get_usage(tenant_id, month)
        tenant = self._get_tenant(tenant_id)
        limits = TenantManager.PLAN_LIMITS[tenant.plan_id]
        
        overages = {}
        total_overage = 0
        
        # API calls overage
        if usage['api_calls'] > limits['api_calls']:
            overage_calls = usage['api_calls'] - limits['api_calls']
            overage_cost = overage_calls * 0.001  # $1 per 1000 calls
            overages['api_calls'] = overage_cost
            total_overage += overage_cost
        
        # Email overage
        if usage['emails'] > limits['emails']:
            overage_emails = usage['emails'] - limits['emails']
            overage_cost = overage_emails * 0.01  # $1 per 100 emails
            overages['emails'] = overage_cost
            total_overage += overage_cost
        
        return {
            'base_price': limits['price'],
            'overages': overages,
            'total_overage': total_overage,
            'total': limits['price'] + total_overage
        }
    
    def create_usage_record(self, subscription_id: str, quantity: int, timestamp: int = None):
        """Report usage to Stripe for metered billing"""
        
        stripe.SubscriptionItem.create_usage_record(
            subscription_id,
            quantity=quantity,
            timestamp=timestamp or int(datetime.utcnow().timestamp())
        )
    
    def handle_webhook(self, event_type: str, data: dict):
        """Handle Stripe webhooks"""
        
        if event_type == 'customer.subscription.created':
            self._handle_subscription_created(data)
        
        elif event_type == 'customer.subscription.updated':
            self._handle_subscription_updated(data)
        
        elif event_type == 'customer.subscription.deleted':
            self._handle_subscription_cancelled(data)
        
        elif event_type == 'invoice.payment_succeeded':
            self._handle_payment_succeeded(data)
        
        elif event_type == 'invoice.payment_failed':
            self._handle_payment_failed(data)
    
    def _handle_subscription_created(self, data: dict):
        """Handle new subscription"""
        tenant_id = data['metadata']['tenant_id']
        # Update tenant status to 'active'
        pass
    
    def _handle_subscription_cancelled(self, data: dict):
        """Handle subscription cancellation"""
        tenant_id = data['metadata']['tenant_id']
        # Update tenant status to 'cancelled'
        # Disable features
        pass
    
    def _handle_payment_failed(self, data: dict):
        """Handle failed payment"""
        tenant_id = data['metadata']['tenant_id']
        # Send dunning email
        # Suspend account after 3 failures
        pass
    
    def _get_usage(self, tenant_id: str, month: str):
        """Get usage for billing period"""
        # Query usage_events table
        return {
            'api_calls': 0,
            'emails': 0,
            'products': 0
        }
    
    def _get_tenant(self, tenant_id: str):
        """Get tenant record"""
        from config.database import SessionLocal
        from saas.tenant_management.manager import Tenant
        
        db = SessionLocal()
        return db.query(Tenant).filter(Tenant.id == tenant_id).first()


class RevenueAnalytics:
    """Calculate SaaS metrics"""
    
    def calculate_mrr(self):
        """Calculate Monthly Recurring Revenue"""
        from config.database import SessionLocal
        from saas.tenant_management.manager import Tenant, TenantManager
        
        db = SessionLocal()
        tenants = db.query(Tenant).filter(Tenant.status == 'active').all()
        
        mrr = 0
        for tenant in tenants:
            plan_price = TenantManager.PLAN_LIMITS[tenant.plan_id]['price']
            mrr += plan_price
        
        return mrr
    
    def calculate_churn_rate(self, month: str):
        """Calculate monthly churn rate"""
        # (Cancelled subscriptions / Total subscriptions) * 100
        pass
    
    def calculate_ltv(self):
        """Calculate Customer Lifetime Value"""
        # Average revenue per customer / Churn rate
        pass
    
    def calculate_gross_margin(self):
        """Calculate gross margin"""
        revenue = self.calculate_mrr()
        cogs = self._calculate_cogs()
        
        margin = ((revenue - cogs) / revenue) * 100
        return margin
    
    def _calculate_cogs(self):
        """Calculate Cost of Goods Sold"""
        # Infrastructure costs / Number of tenants
        return 47  # $47 per tenant (from architecture doc)
