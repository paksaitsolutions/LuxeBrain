"""
Admin Tenant Management Routes
Copyright © 2024 Paksa IT Solutions
"""

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from api.middleware.auth import verify_admin
from api.models.database_models import User, Plan, Tenant
from config.database import get_db
from api.utils.tenant_resolver import TenantResolver
import bcrypt
import secrets

router = APIRouter(prefix="/api/admin/tenants", tags=["admin"])


class CreateTenantRequest(BaseModel):
    # Basic Information
    email: str
    name: str
    plan: str
    
    # Company Information
    company_name: str = None
    company_website: str = None
    company_phone: str = None
    industry: str = None
    
    # Address Information
    address_line1: str = None
    address_line2: str = None
    city: str = None
    state: str = None
    postal_code: str = None
    country: str = None
    
    # Point of Contact
    poc_name: str = None
    poc_email: str = None
    poc_phone: str = None
    poc_title: str = None
    
    # Tax Information
    tax_id: str = None
    vat_number: str = None
    
    # WooCommerce Integration
    woocommerce_url: str = None
    woocommerce_key: str = None
    woocommerce_secret: str = None


class UpdatePlanRequest(BaseModel):
    plan: str


@router.get("")
async def get_all_tenants(admin=Depends(verify_admin), db: Session = Depends(get_db)):
    """Get all tenants"""
    tenants = db.query(Tenant).all()
    
    return {
        "tenants": [{
            "tenant_id": t.tenant_id,
            "email": t.email,
            "name": t.name,
            "plan": t.plan,
            "status": t.status,
            "created_at": t.created_at.isoformat(),
            "company_name": t.company_name,
            "industry": t.industry
        } for t in tenants],
        "total": len(tenants)
    }


@router.post("")
async def create_tenant(
    req: CreateTenantRequest,
    admin=Depends(verify_admin),
    db: Session = Depends(get_db)
):
    """Create new tenant"""
    existing = db.query(User).filter(User.email == req.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already exists")
    
    if req.plan not in ["free", "starter", "growth", "enterprise"]:
        raise HTTPException(status_code=400, detail="Invalid plan")
    
    tenant_id = f"tenant_{secrets.token_hex(8)}"
    temp_password = secrets.token_urlsafe(12)
    password_hash = bcrypt.hashpw(temp_password.encode(), bcrypt.gensalt()).decode()
    
    # Create user
    user = User(
        email=req.email,
        password_hash=password_hash,
        role="tenant",
        tenant_id=tenant_id,
        email_verified=True
    )
    db.add(user)
    
    # Create tenant
    tenant = Tenant(
        tenant_id=tenant_id,
        name=req.name,
        email=req.email,
        plan=req.plan,
        status="active",
        api_key=f"lxb_{secrets.token_hex(16)}",
        company_name=req.company_name,
        company_website=req.company_website,
        company_phone=req.company_phone,
        industry=req.industry,
        address={
            "line1": req.address_line1,
            "line2": req.address_line2,
            "city": req.city,
            "state": req.state,
            "postal_code": req.postal_code,
            "country": req.country
        },
        poc={
            "name": req.poc_name,
            "email": req.poc_email,
            "phone": req.poc_phone,
            "title": req.poc_title
        },
        tax_info={
            "tax_id": req.tax_id,
            "vat_number": req.vat_number
        },
        woocommerce={
            "url": req.woocommerce_url,
            "key": req.woocommerce_key,
            "secret": req.woocommerce_secret
        }
    )
    db.add(tenant)
    db.commit()
    
    # Invalidate cache
    TenantResolver.invalidate_cache(tenant_id)
    
    return {
        "message": "Tenant created",
        "tenant_id": tenant_id,
        "email": req.email,
        "temp_password": temp_password
    }


@router.post("/{tenant_id}/approve")
async def approve_tenant(tenant_id: str, admin=Depends(verify_admin), db: Session = Depends(get_db)):
    """Approve pending tenant"""
    tenant = db.query(Tenant).filter(Tenant.tenant_id == tenant_id).first()
    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant not found")
    
    tenant.status = "active"
    db.commit()
    TenantResolver.invalidate_cache(tenant_id)
    return {"message": "Tenant approved"}


@router.post("/{tenant_id}/suspend")
async def suspend_tenant(tenant_id: str, admin=Depends(verify_admin), db: Session = Depends(get_db)):
    """Suspend tenant"""
    tenant = db.query(Tenant).filter(Tenant.tenant_id == tenant_id).first()
    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant not found")
    
    tenant.status = "suspended"
    db.commit()
    TenantResolver.invalidate_cache(tenant_id)
    return {"message": "Tenant suspended"}


@router.put("/{tenant_id}/plan")
async def update_tenant_plan(
    tenant_id: str,
    req: UpdatePlanRequest,
    admin=Depends(verify_admin),
    db: Session = Depends(get_db)
):
    """Update tenant plan"""
    tenant = db.query(Tenant).filter(Tenant.tenant_id == tenant_id).first()
    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant not found")
    
    if req.plan not in ["free", "starter", "growth", "enterprise"]:
        raise HTTPException(status_code=400, detail="Invalid plan")
    
    tenant.plan = req.plan
    db.commit()
    TenantResolver.invalidate_cache(tenant_id)
    return {"message": f"Plan updated to {req.plan}"}


@router.get("/plans")
async def get_plans(admin=Depends(verify_admin), db: Session = Depends(get_db)):
    """Get all available plans from database"""
    plans = db.query(Plan).filter(Plan.is_active == True).order_by(Plan.sort_order).all()
    
    return {
        "plans": [{
            "id": p.plan_id,
            "name": p.name,
            "price": p.price,
            "billing_period": p.billing_period,
            "features": p.features or [],
            "limits": p.limits or {},
            "adminOnly": p.admin_only
        } for p in plans]
    }
