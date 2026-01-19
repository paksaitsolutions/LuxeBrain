"""
Usage Metering Routes
Copyright © 2024 Paksa IT Solutions
"""

from fastapi import APIRouter, Request, Depends
from api.utils.usage_meter import UsageMeter
from api.utils.tenant_resolver import TenantResolver
from api.middleware.auth import verify_admin

router = APIRouter(prefix="/api/metering", tags=["metering"])


@router.get("/overage")
async def get_overage_charges(request: Request):
    """Get current overage charges for authenticated tenant"""
    tenant_id = getattr(request.state, 'tenant_id', None)
    
    if not tenant_id:
        return {"error": "Tenant not authenticated"}
    
    plan = TenantResolver.get_plan(tenant_id)
    overage = UsageMeter.calculate_overage(tenant_id, plan)
    
    return overage


@router.post("/invoice")
async def create_overage_invoice(request: Request):
    """Manually create overage invoice for tenant"""
    tenant_id = getattr(request.state, 'tenant_id', None)
    
    if not tenant_id:
        return {"error": "Tenant not authenticated"}
    
    tenant = TenantResolver.get_tenant(tenant_id)
    customer_id = tenant.get("stripe_customer_id")
    plan = tenant.get("plan", "basic")
    
    if not customer_id:
        return {"error": "No Stripe customer ID"}
    
    invoice = UsageMeter.create_overage_invoice(tenant_id, customer_id, plan)
    
    if invoice:
        return {"invoice_id": invoice.id, "amount": invoice.amount_due / 100}
    
    return {"message": "No overage charges"}


@router.get("/admin/overage-summary")
async def get_all_overages(admin=Depends(verify_admin)):
    """Get overage summary for all tenants"""
    from api.utils.tenant_resolver import TENANTS_DB
    
    summary = []
    total_overage = 0
    
    for tenant_id, tenant_data in TENANTS_DB.items():
        plan = tenant_data.get("plan", "basic")
        overage = UsageMeter.calculate_overage(tenant_id, plan)
        
        if overage["total_overage_charge"] > 0:
            summary.append({
                "tenant_id": tenant_id,
                "name": tenant_data.get("name"),
                "plan": plan,
                "overage": overage
            })
            total_overage += overage["total_overage_charge"]
    
    return {
        "tenants": summary,
        "total_overage_revenue": round(total_overage, 2)
    }
