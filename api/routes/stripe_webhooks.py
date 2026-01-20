"""
Stripe Webhook Handler
Copyright © 2024 Paksa IT Solutions
"""

import stripe
import os
from fastapi import APIRouter, Request, HTTPException
from api.utils.tenant_resolver import TenantResolver

router = APIRouter(prefix="/api/webhooks/stripe", tags=["webhooks"])

stripe.api_key = os.getenv("STRIPE_SECRET_KEY", "sk_test_...")
STRIPE_WEBHOOK_SECRET = os.getenv("STRIPE_WEBHOOK_SECRET", "whsec_...")


@router.post("/")
async def stripe_webhook(request: Request):
    """Handle Stripe webhook events"""
    payload = await request.body()
    sig_header = request.headers.get('stripe-signature')
    
    try:
        # Verify webhook signature
        event = stripe.Webhook.construct_event(
            payload, sig_header, STRIPE_WEBHOOK_SECRET
        )
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid payload")
    except stripe.error.SignatureVerificationError:
        raise HTTPException(status_code=400, detail="Invalid signature")
    
    # Handle events
    event_type = event['type']
    data = event['data']['object']
    
    if event_type == 'customer.subscription.updated':
        await handle_subscription_updated(data)
    elif event_type == 'customer.subscription.deleted':
        await handle_subscription_deleted(data)
    elif event_type == 'payment_intent.succeeded':
        await handle_payment_succeeded(data)
    elif event_type == 'payment_intent.payment_failed':
        await handle_payment_failed(data)
    
    return {"status": "success"}


async def handle_subscription_updated(subscription):
    """Handle subscription update event"""
    tenant_id = subscription.get('metadata', {}).get('tenant_id')
    if not tenant_id:
        return
    
    # Update tenant plan
    new_plan = subscription['items']['data'][0]['price']['metadata'].get('plan', 'basic')
    status = subscription['status']
    
    # Update in database (mock implementation)
    # TODO: Migrate to database - if tenant_id in TENANTS_DB:
    # TODO: Migrate to database - TENANTS_DB[tenant_id]['plan'] = new_plan
    # TODO: Migrate to database - TENANTS_DB[tenant_id]['subscription_status'] = status
    # TenantResolver.invalidate_cache(tenant_id)
    
    print(f"✅ Subscription updated for {tenant_id}: {new_plan} ({status})")


async def handle_subscription_deleted(subscription):
    """Handle subscription cancellation"""
    tenant_id = subscription.get('metadata', {}).get('tenant_id')
    if not tenant_id:
        return
    
    # Downgrade to basic plan
    # TODO: Migrate to database - if tenant_id in TENANTS_DB:
    # TODO: Migrate to database - TENANTS_DB[tenant_id]['plan'] = 'basic'
    # TODO: Migrate to database - TENANTS_DB[tenant_id]['subscription_status'] = 'canceled'
    # TenantResolver.invalidate_cache(tenant_id)
    
    print(f"⚠️ Subscription canceled for {tenant_id}")


async def handle_payment_succeeded(payment_intent):
    """Handle successful payment"""
    tenant_id = payment_intent.get('metadata', {}).get('tenant_id')
    amount = payment_intent['amount'] / 100  # Convert from cents
    
    # Log payment (mock implementation)
    print(f"💰 Payment succeeded: ${amount} for tenant {tenant_id}")


async def handle_payment_failed(payment_intent):
    """Handle failed payment"""
    tenant_id = payment_intent.get('metadata', {}).get('tenant_id')
    
    # Send notification to tenant
    print(f"❌ Payment failed for tenant {tenant_id}")
