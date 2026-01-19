"""
Stripe Billing Routes
Copyright © 2024 Paksa IT Solutions
"""

import stripe
import os
from fastapi import APIRouter, Request, HTTPException

router = APIRouter(prefix="/api/billing", tags=["billing"])

stripe.api_key = os.getenv("STRIPE_SECRET_KEY", "sk_test_...")

PRICE_IDS = {
    "basic": "price_basic_monthly",
    "premium": "price_premium_monthly",
    "enterprise": "price_enterprise_monthly"
}


@router.post("/create-checkout-session")
async def create_checkout_session(request: Request, plan: str):
    """Create Stripe checkout session for plan upgrade"""
    tenant_id = getattr(request.state, 'tenant_id', None)
    
    if not tenant_id:
        raise HTTPException(status_code=401, detail="Authentication required")
    
    if plan not in PRICE_IDS:
        raise HTTPException(status_code=400, detail="Invalid plan")
    
    try:
        checkout_session = stripe.checkout.Session.create(
            payment_method_types=['card'],
            line_items=[{
                'price': PRICE_IDS[plan],
                'quantity': 1,
            }],
            mode='subscription',
            success_url=f"{os.getenv('FRONTEND_URL', 'http://localhost:3000')}/billing/success?session_id={{CHECKOUT_SESSION_ID}}",
            cancel_url=f"{os.getenv('FRONTEND_URL', 'http://localhost:3000')}/billing/cancel",
            metadata={
                'tenant_id': tenant_id,
                'plan': plan
            }
        )
        
        return {"checkout_url": checkout_session.url}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/portal")
async def create_portal_session(request: Request):
    """Create Stripe customer portal session"""
    tenant_id = getattr(request.state, 'tenant_id', None)
    
    if not tenant_id:
        raise HTTPException(status_code=401, detail="Authentication required")
    
    # Get customer ID from tenant (mock)
    customer_id = f"cus_{tenant_id}"
    
    try:
        portal_session = stripe.billing_portal.Session.create(
            customer=customer_id,
            return_url=f"{os.getenv('FRONTEND_URL', 'http://localhost:3000')}/billing"
        )
        
        return {"portal_url": portal_session.url}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
