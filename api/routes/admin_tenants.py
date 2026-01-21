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
async def get_all_tenants(
    search: str = None,
    plan: str = None,
    status: str = None,
    date_from: str = None,
    date_to: str = None,
    admin=Depends(verify_admin),
    db: Session = Depends(get_db)
):
    """Get all tenants with search and filters"""
    from datetime import datetime
    from sqlalchemy import or_, func
    from api.models.database_models import RevenueRecord
    
    query = db.query(Tenant)
    
    # Search filter
    if search:
        query = query.filter(
            or_(
                Tenant.name.ilike(f"%{search}%"),
                Tenant.email.ilike(f"%{search}%"),
                Tenant.tenant_id.ilike(f"%{search}%"),
                Tenant.company_name.ilike(f"%{search}%")
            )
        )
    
    # Plan filter
    if plan:
        query = query.filter(Tenant.plan == plan)
    
    # Status filter
    if status:
        query = query.filter(Tenant.status == status)
    
    # Date range filter
    if date_from:
        query = query.filter(Tenant.created_at >= datetime.fromisoformat(date_from))
    if date_to:
        query = query.filter(Tenant.created_at <= datetime.fromisoformat(date_to))
    
    tenants = query.all()
    
    # Add revenue for each tenant
    result = []
    for t in tenants:
        revenue = db.query(func.sum(RevenueRecord.amount)).filter(
            RevenueRecord.tenant_id == t.tenant_id,
            RevenueRecord.status == "paid"
        ).scalar() or 0
        
        result.append({
            "tenant_id": t.tenant_id,
            "email": t.email,
            "name": t.name,
            "plan": t.plan,
            "status": t.status,
            "created_at": t.created_at.isoformat(),
            "company_name": t.company_name,
            "industry": t.industry,
            "revenue": float(revenue)
        })
    
    return {"tenants": result, "total": len(result)}


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


class RejectTenantRequest(BaseModel):
    reason: str


class BulkActionRequest(BaseModel):
    tenant_ids: list[str]
    action: str  # suspend, activate, change_plan
    plan: str = None  # for change_plan action


@router.post("/bulk-action")
async def bulk_action(
    req: BulkActionRequest,
    admin=Depends(verify_admin),
    db: Session = Depends(get_db)
):
    """Perform bulk actions on tenants"""
    if not req.tenant_ids:
        raise HTTPException(status_code=400, detail="No tenants selected")
    
    tenants = db.query(Tenant).filter(Tenant.tenant_id.in_(req.tenant_ids)).all()
    
    if req.action == "suspend":
        for t in tenants:
            t.status = "suspended"
            TenantResolver.invalidate_cache(t.tenant_id)
    elif req.action == "activate":
        for t in tenants:
            t.status = "active"
            TenantResolver.invalidate_cache(t.tenant_id)
    elif req.action == "change_plan":
        if not req.plan:
            raise HTTPException(status_code=400, detail="Plan required")
        for t in tenants:
            t.plan = req.plan
            TenantResolver.invalidate_cache(t.tenant_id)
    else:
        raise HTTPException(status_code=400, detail="Invalid action")
    
    db.commit()
    return {"message": f"{req.action} applied to {len(tenants)} tenants"}


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


@router.post("/{tenant_id}/reject")
async def reject_tenant(
    tenant_id: str,
    req: RejectTenantRequest,
    admin=Depends(verify_admin),
    db: Session = Depends(get_db)
):
    """Reject pending tenant with reason"""
    from api.models.database_models import UserActivity
    
    tenant = db.query(Tenant).filter(Tenant.tenant_id == tenant_id).first()
    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant not found")
    
    # Update status
    tenant.status = "rejected"
    
    # Log rejection
    activity = UserActivity(
        user_id=admin.id,
        action="tenant_rejected",
        resource_type="tenant",
        resource_id=tenant_id,
        details={"reason": req.reason, "email": tenant.email},
        ip_address="admin",
        user_agent="admin_portal"
    )
    db.add(activity)
    db.commit()
    TenantResolver.invalidate_cache(tenant_id)
    
    # TODO: Send rejection email to tenant.email with req.reason
    
    return {"message": "Tenant rejected"}


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


@router.get("/{tenant_id}")
async def get_tenant_detail(tenant_id: str, admin=Depends(verify_admin), db: Session = Depends(get_db)):
    """Get full tenant details with usage, billing, and activity"""
    from api.models.database_models import RevenueRecord, ApiLog, UserActivity, SupportTicket
    from sqlalchemy import func, desc
    
    tenant = db.query(Tenant).filter(Tenant.tenant_id == tenant_id).first()
    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant not found")
    
    # Get tenant user
    user = db.query(User).filter(User.tenant_id == tenant_id, User.role == "tenant").first()
    
    # Usage stats (last 30 days)
    from datetime import datetime, timedelta
    thirty_days_ago = datetime.utcnow() - timedelta(days=30)
    
    api_calls = db.query(func.count(ApiLog.id)).filter(
        ApiLog.tenant_id == tenant_id,
        ApiLog.created_at >= thirty_days_ago
    ).scalar() or 0
    
    # Billing history
    billing_history = db.query(RevenueRecord).filter(
        RevenueRecord.tenant_id == tenant_id
    ).order_by(desc(RevenueRecord.created_at)).limit(10).all()
    
    total_revenue = db.query(func.sum(RevenueRecord.amount)).filter(
        RevenueRecord.tenant_id == tenant_id,
        RevenueRecord.status == "paid"
    ).scalar() or 0
    
    # Activity timeline (last 20 activities)
    activities = db.query(UserActivity).filter(
        UserActivity.user_id == user.id if user else None
    ).order_by(desc(UserActivity.created_at)).limit(20).all()
    
    # Support tickets
    tickets = db.query(SupportTicket).filter(
        SupportTicket.tenant_id == tenant_id
    ).order_by(desc(SupportTicket.created_at)).limit(5).all()
    
    open_tickets = db.query(func.count(SupportTicket.id)).filter(
        SupportTicket.tenant_id == tenant_id,
        SupportTicket.status.in_(["open", "in_progress"])
    ).scalar() or 0
    
    return {
        "tenant": {
            "tenant_id": tenant.tenant_id,
            "name": tenant.name,
            "email": tenant.email,
            "plan": tenant.plan,
            "status": tenant.status,
            "api_key": tenant.api_key,
            "company_name": tenant.company_name,
            "company_website": tenant.company_website,
            "company_phone": tenant.company_phone,
            "industry": tenant.industry,
            "address": tenant.address,
            "poc": tenant.poc,
            "tax_info": tenant.tax_info,
            "woocommerce": tenant.woocommerce,
            "created_at": tenant.created_at.isoformat(),
            "updated_at": tenant.updated_at.isoformat()
        },
        "user": {
            "id": user.id if user else None,
            "email": user.email if user else None,
            "last_login_at": user.last_login_at.isoformat() if user and user.last_login_at else None,
            "last_login_ip": user.last_login_ip if user else None,
            "created_at": user.created_at.isoformat() if user else None
        } if user else None,
        "usage": {
            "api_calls_30d": api_calls,
            "total_revenue": float(total_revenue),
            "open_tickets": open_tickets
        },
        "billing_history": [{
            "id": b.id,
            "amount": b.amount,
            "plan": b.plan,
            "billing_period": b.billing_period,
            "status": b.status,
            "stripe_invoice_id": b.stripe_invoice_id,
            "created_at": b.created_at.isoformat()
        } for b in billing_history],
        "activities": [{
            "id": a.id,
            "action": a.action,
            "resource_type": a.resource_type,
            "resource_id": a.resource_id,
            "details": a.details,
            "ip_address": a.ip_address,
            "created_at": a.created_at.isoformat()
        } for a in activities],
        "tickets": [{
            "id": t.id,
            "ticket_number": t.ticket_number,
            "subject": t.subject,
            "status": t.status,
            "priority": t.priority,
            "created_at": t.created_at.isoformat()
        } for t in tickets]
    }


@router.put("/{tenant_id}")
async def update_tenant(
    tenant_id: str,
    req: CreateTenantRequest,
    admin=Depends(verify_admin),
    db: Session = Depends(get_db)
):
    """Update tenant details"""
    tenant = db.query(Tenant).filter(Tenant.tenant_id == tenant_id).first()
    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant not found")
    
    # Update fields
    tenant.name = req.name
    tenant.email = req.email
    tenant.plan = req.plan
    tenant.company_name = req.company_name
    tenant.company_website = req.company_website
    tenant.company_phone = req.company_phone
    tenant.industry = req.industry
    tenant.address = {
        "line1": req.address_line1,
        "line2": req.address_line2,
        "city": req.city,
        "state": req.state,
        "postal_code": req.postal_code,
        "country": req.country
    }
    tenant.poc = {
        "name": req.poc_name,
        "email": req.poc_email,
        "phone": req.poc_phone,
        "title": req.poc_title
    }
    tenant.tax_info = {
        "tax_id": req.tax_id,
        "vat_number": req.vat_number
    }
    tenant.woocommerce = {
        "url": req.woocommerce_url,
        "key": req.woocommerce_key,
        "secret": req.woocommerce_secret
    }
    
    db.commit()
    TenantResolver.invalidate_cache(tenant_id)
    
    return {"message": "Tenant updated successfully"}


@router.post("/{tenant_id}/impersonate")
async def impersonate_tenant(
    tenant_id: str,
    admin=Depends(verify_admin),
    db: Session = Depends(get_db)
):
    """Impersonate tenant (admin support feature)"""
    from datetime import datetime, timedelta
    from jose import jwt
    from config.settings import settings
    from api.models.database_models import SecurityAuditLog
    
    tenant = db.query(Tenant).filter(Tenant.tenant_id == tenant_id).first()
    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant not found")
    
    user = db.query(User).filter(User.tenant_id == tenant_id, User.role == "tenant").first()
    if not user:
        raise HTTPException(status_code=404, detail="Tenant user not found")
    
    # Create temp token (1 hour expiry)
    expires = datetime.utcnow() + timedelta(hours=1)
    token_data = {
        "sub": user.email,
        "user_id": user.id,
        "tenant_id": tenant_id,
        "role": "tenant",
        "impersonated_by": admin.get("user_id"),
        "impersonation": True,
        "exp": expires
    }
    
    token = jwt.encode(token_data, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)
    
    # Audit log
    audit = SecurityAuditLog(
        event_type="impersonation_start",
        user_id=admin.get("user_id"),
        tenant_id=tenant_id,
        ip_address="admin",
        details={
            "admin_email": admin.get("sub"),
            "tenant_email": user.email,
            "expires_at": expires.isoformat()
        }
    )
    db.add(audit)
    db.commit()
    
    return {
        "token": token,
        "tenant": {
            "tenant_id": tenant_id,
            "name": tenant.name,
            "email": user.email
        },
        "expires_at": expires.isoformat()
    }


@router.post("/impersonate/exit")
async def exit_impersonation(admin=Depends(verify_admin), db: Session = Depends(get_db)):
    """Exit impersonation mode"""
    from api.models.database_models import SecurityAuditLog
    
    # Log exit
    audit = SecurityAuditLog(
        event_type="impersonation_end",
        user_id=admin.get("user_id"),
        tenant_id=admin.get("tenant_id"),
        ip_address="admin",
        details={"admin_email": admin.get("sub")}
    )
    db.add(audit)
    db.commit()
    
    return {"message": "Impersonation ended"}


@router.delete("/{tenant_id}")
async def delete_tenant(tenant_id: str, admin=Depends(verify_admin), db: Session = Depends(get_db)):
    """Delete tenant and associated user"""
    tenant = db.query(Tenant).filter(Tenant.tenant_id == tenant_id).first()
    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant not found")
    
    # Delete associated user
    db.query(User).filter(User.tenant_id == tenant_id).delete()
    
    # Delete tenant
    db.delete(tenant)
    db.commit()
    TenantResolver.invalidate_cache(tenant_id)
    
    return {"message": "Tenant deleted successfully"}
