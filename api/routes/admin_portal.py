"""
Admin Portal Routes - Revenue, Usage, Billing, Feature Flags, System Logs, Support, Notifications, Admin Users, Backup, API Keys
Copyright © 2024 Paksa IT Solutions
"""

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from sqlalchemy import func, desc
from api.middleware.auth import verify_admin
from api.models.database_models import *
from config.database import get_db
from datetime import datetime, timedelta
import secrets
import hashlib

router = APIRouter(prefix="/api/admin", tags=["admin-portal"])


# ============ REVENUE ANALYTICS ============
@router.get("/revenue/stats")
async def get_revenue_stats(admin=Depends(verify_admin), db: Session = Depends(get_db)):
    """Get revenue statistics"""
    now = datetime.utcnow()
    month_ago = now - timedelta(days=30)
    
    # MRR calculation
    plan_prices = {"free": 0, "starter": 49, "growth": 149, "enterprise": 499}
    # TODO: Migrate to database - mrr = sum(plan_prices.get(t.get("plan", "starter"), 0) for t in TENANTS_DB.values() if t.get("status") == "active")
    
    # Revenue records
    total_revenue = db.query(func.sum(RevenueRecord.amount)).filter(RevenueRecord.status == "paid").scalar() or 0
    monthly_revenue = db.query(func.sum(RevenueRecord.amount)).filter(
        RevenueRecord.status == "paid",
        RevenueRecord.created_at >= month_ago
    ).scalar() or 0
    
    # Churn rate
    # TODO: Migrate to database - total_tenants = len([t for t in TENANTS_DB.values() if t.get("status") in ["active", "suspended"]])
    # TODO: Migrate to database - churned = len([t for t in TENANTS_DB.values() if t.get("status") == "canceled"])
    churn_rate = (churned / total_tenants * 100) if total_tenants > 0 else 0
    
    return {
        "mrr": mrr,
        "total_revenue": total_revenue,
        "monthly_revenue": monthly_revenue,
        "churn_rate": round(churn_rate, 2),
        "active_subscriptions": total_tenants
    }


@router.get("/revenue/by-plan")
async def get_revenue_by_plan(admin=Depends(verify_admin)):
    """Get revenue breakdown by plan"""
    plan_prices = {"free": 0, "starter": 49, "growth": 149, "enterprise": 499}
    by_plan = {}
    
    # TODO: Migrate to database
    # for tenant_id, tenant in TENANTS_DB.items():
    #     if tenant.get("status") == "active":
    #         plan = tenant.get("plan", "starter")
    #         by_plan[plan] = by_plan.get(plan, 0) + plan_prices.get(plan, 0)
    
    return {"by_plan": by_plan}


@router.get("/revenue/trends")
async def get_revenue_trends(days: int = 30, admin=Depends(verify_admin), db: Session = Depends(get_db)):
    """Get revenue trends over time"""
    start_date = datetime.utcnow() - timedelta(days=days)
    
    records = db.query(
        func.date(RevenueRecord.created_at).label("date"),
        func.sum(RevenueRecord.amount).label("revenue")
    ).filter(
        RevenueRecord.created_at >= start_date,
        RevenueRecord.status == "paid"
    ).group_by(func.date(RevenueRecord.created_at)).all()
    
    return {"trends": [{"date": str(r.date), "revenue": r.revenue} for r in records]}


# ============ USAGE ANALYTICS ============
@router.get("/usage/by-tenant")
async def get_usage_by_tenant(admin=Depends(verify_admin), db: Session = Depends(get_db)):
    """Get usage statistics by tenant"""
    from api.utils.usage_tracker import UsageTracker
    
    usage_data = []
    # TODO: Migrate to database
    # for tenant_id in TENANTS_DB.keys():
    #     usage = UsageTracker.get_usage(tenant_id)
    #     daily = UsageTracker.get_daily_usage(tenant_id)
    #     
    #     usage_data.append({
    #         "tenant_id": tenant_id,
    #         "api_calls_today": daily.get("api_calls", 0),
    #         "ml_inferences_today": daily.get("ml_inferences", 0),
    #         "storage_mb": usage.get("storage_bytes", 0) / (1024 * 1024),
    #         "total_api_calls": usage.get("api_calls", 0)
    #     })
    
    return {"usage": sorted(usage_data, key=lambda x: x["api_calls_today"], reverse=True)}


@router.get("/usage/trends")
async def get_usage_trends(tenant_id: str = None, days: int = 7, admin=Depends(verify_admin), db: Session = Depends(get_db)):
    """Get usage trends"""
    start_date = datetime.utcnow() - timedelta(days=days)
    
    query = db.query(
        func.date(ApiLog.created_at).label("date"),
        func.count(ApiLog.id).label("requests")
    ).filter(ApiLog.created_at >= start_date)
    
    if tenant_id:
        query = query.filter(ApiLog.tenant_id == tenant_id)
    
    records = query.group_by(func.date(ApiLog.created_at)).all()
    
    return {"trends": [{"date": str(r.date), "requests": r.requests} for r in records]}


# ============ BILLING MANAGEMENT ============
@router.get("/billing/invoices")
async def get_invoices(tenant_id: str = None, admin=Depends(verify_admin), db: Session = Depends(get_db)):
    """Get invoice history"""
    query = db.query(RevenueRecord).order_by(desc(RevenueRecord.created_at))
    
    if tenant_id:
        query = query.filter(RevenueRecord.tenant_id == tenant_id)
    
    invoices = query.limit(100).all()
    
    return {"invoices": [{
        "id": inv.id,
        "tenant_id": inv.tenant_id,
        "amount": inv.amount,
        "plan": inv.plan,
        "status": inv.status,
        "stripe_invoice_id": inv.stripe_invoice_id,
        "created_at": inv.created_at.isoformat()
    } for inv in invoices]}


class ManualInvoiceRequest(BaseModel):
    tenant_id: str
    amount: float
    description: str


@router.post("/billing/manual-invoice")
async def create_manual_invoice(req: ManualInvoiceRequest, admin=Depends(verify_admin), db: Session = Depends(get_db)):
    """Create manual invoice"""
    # TODO: Migrate to database
    # tenant = TENANTS_DB.get(req.tenant_id)
    tenant = db.query(Tenant).filter(Tenant.id == req.tenant_id).first()
    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant not found")
    
    invoice = RevenueRecord(
        tenant_id=req.tenant_id,
        amount=req.amount,
        plan=tenant.get("plan", "starter"),
        billing_period="manual",
        status="pending",
        created_at=datetime.utcnow()
    )
    db.add(invoice)
    db.commit()
    
    return {"message": "Manual invoice created", "invoice_id": invoice.id}


# ============ FEATURE FLAGS ============
@router.get("/feature-flags")
async def get_feature_flags(admin=Depends(verify_admin), db: Session = Depends(get_db)):
    """Get all feature flags"""
    flags = db.query(FeatureFlag).all()
    
    return {"flags": [{
        "id": f.id,
        "name": f.name,
        "description": f.description,
        "enabled": f.enabled,
        "rollout_percentage": f.rollout_percentage,
        "tenant_whitelist": f.tenant_whitelist or []
    } for f in flags]}


class FeatureFlagRequest(BaseModel):
    name: str
    description: str
    enabled: bool = False
    rollout_percentage: float = 0.0
    tenant_whitelist: list = []


@router.post("/feature-flags")
async def create_feature_flag(req: FeatureFlagRequest, admin=Depends(verify_admin), db: Session = Depends(get_db)):
    """Create feature flag"""
    flag = FeatureFlag(
        name=req.name,
        description=req.description,
        enabled=req.enabled,
        rollout_percentage=req.rollout_percentage,
        tenant_whitelist=req.tenant_whitelist
    )
    db.add(flag)
    db.commit()
    
    return {"message": "Feature flag created", "flag_id": flag.id}


@router.put("/feature-flags/{flag_id}")
async def update_feature_flag(flag_id: int, req: FeatureFlagRequest, admin=Depends(verify_admin), db: Session = Depends(get_db)):
    """Update feature flag"""
    flag = db.query(FeatureFlag).filter(FeatureFlag.id == flag_id).first()
    if not flag:
        raise HTTPException(status_code=404, detail="Feature flag not found")
    
    flag.name = req.name
    flag.description = req.description
    flag.enabled = req.enabled
    flag.rollout_percentage = req.rollout_percentage
    flag.tenant_whitelist = req.tenant_whitelist
    flag.updated_at = datetime.utcnow()
    
    db.commit()
    
    return {"message": "Feature flag updated"}


# ============ SYSTEM LOGS ============
@router.get("/system-logs")
async def get_system_logs(level: str = None, module: str = None, limit: int = 100, admin=Depends(verify_admin), db: Session = Depends(get_db)):
    """Get system logs"""
    query = db.query(SystemLog).order_by(desc(SystemLog.created_at))
    
    if level:
        query = query.filter(SystemLog.level == level.upper())
    if module:
        query = query.filter(SystemLog.module == module)
    
    logs = query.limit(limit).all()
    
    return {"logs": [{
        "id": log.id,
        "level": log.level,
        "message": log.message,
        "module": log.module,
        "function": log.function,
        "exception": log.exception,
        "created_at": log.created_at.isoformat()
    } for log in logs]}


@router.get("/system-logs/stats")
async def get_system_logs_stats(admin=Depends(verify_admin), db: Session = Depends(get_db)):
    """Get system logs statistics"""
    total = db.query(func.count(SystemLog.id)).scalar()
    errors = db.query(func.count(SystemLog.id)).filter(SystemLog.level == "ERROR").scalar()
    warnings = db.query(func.count(SystemLog.id)).filter(SystemLog.level == "WARNING").scalar()
    
    return {"total": total, "errors": errors, "warnings": warnings}


# ============ SUPPORT TICKETS ============
@router.get("/support/tickets")
async def get_support_tickets(status: str = None, admin=Depends(verify_admin), db: Session = Depends(get_db)):
    """Get support tickets"""
    query = db.query(SupportTicket).order_by(desc(SupportTicket.created_at))
    
    if status:
        query = query.filter(SupportTicket.status == status)
    
    tickets = query.limit(100).all()
    
    return {"tickets": [{
        "id": t.id,
        "ticket_number": t.ticket_number,
        "tenant_id": t.tenant_id,
        "subject": t.subject,
        "status": t.status,
        "priority": t.priority,
        "created_at": t.created_at.isoformat()
    } for t in tickets]}


class TicketRequest(BaseModel):
    tenant_id: str
    subject: str
    description: str
    priority: str = "medium"


@router.post("/support/tickets")
async def create_ticket(req: TicketRequest, admin=Depends(verify_admin), db: Session = Depends(get_db)):
    """Create support ticket"""
    ticket_number = f"TKT-{secrets.token_hex(4).upper()}"
    
    ticket = SupportTicket(
        ticket_number=ticket_number,
        tenant_id=req.tenant_id,
        subject=req.subject,
        description=req.description,
        priority=req.priority,
        created_by=1  # Admin user
    )
    db.add(ticket)
    db.commit()
    
    return {"message": "Ticket created", "ticket_number": ticket_number}


@router.put("/support/tickets/{ticket_id}")
async def update_ticket(ticket_id: int, status: str, admin=Depends(verify_admin), db: Session = Depends(get_db)):
    """Update ticket status"""
    ticket = db.query(SupportTicket).filter(SupportTicket.id == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    
    ticket.status = status
    ticket.updated_at = datetime.utcnow()
    
    if status == "resolved":
        ticket.resolved_at = datetime.utcnow()
    
    db.commit()
    
    return {"message": "Ticket updated"}


# ============ NOTIFICATIONS ============
@router.get("/notifications")
async def get_notifications(user_id: int = None, unread_only: bool = False, admin=Depends(verify_admin), db: Session = Depends(get_db)):
    """Get notifications"""
    query = db.query(Notification).order_by(desc(Notification.created_at))
    
    if user_id:
        query = query.filter(Notification.user_id == user_id)
    if unread_only:
        query = query.filter(Notification.read == False)
    
    notifications = query.limit(50).all()
    
    return {"notifications": [{
        "id": n.id,
        "type": n.type,
        "title": n.title,
        "message": n.message,
        "link": n.link,
        "read": n.read,
        "created_at": n.created_at.isoformat()
    } for n in notifications]}


class NotificationRequest(BaseModel):
    user_id: int
    type: str
    title: str
    message: str
    link: str = None


@router.post("/notifications")
async def create_notification(req: NotificationRequest, admin=Depends(verify_admin), db: Session = Depends(get_db)):
    """Create notification"""
    notification = Notification(
        user_id=req.user_id,
        type=req.type,
        title=req.title,
        message=req.message,
        link=req.link
    )
    db.add(notification)
    db.commit()
    
    return {"message": "Notification created"}


@router.put("/notifications/{notification_id}/read")
async def mark_notification_read(notification_id: int, admin=Depends(verify_admin), db: Session = Depends(get_db)):
    """Mark notification as read"""
    notification = db.query(Notification).filter(Notification.id == notification_id).first()
    if not notification:
        raise HTTPException(status_code=404, detail="Notification not found")
    
    notification.read = True
    db.commit()
    
    return {"message": "Notification marked as read"}


# ============ ADMIN USERS ============
@router.get("/admin-users")
async def get_admin_users(admin=Depends(verify_admin), db: Session = Depends(get_db)):
    """Get all admin users"""
    users = db.query(User).filter(User.role.in_(["admin", "super_admin"])).all()
    
    return {"users": [{
        "id": u.id,
        "email": u.email,
        "role": u.role,
        "email_verified": u.email_verified,
        "created_at": u.created_at.isoformat()
    } for u in users]}


class AdminUserRequest(BaseModel):
    email: str
    password: str
    role: str = "admin"


@router.post("/admin-users")
async def create_admin_user(req: AdminUserRequest, admin=Depends(verify_admin), db: Session = Depends(get_db)):
    """Create admin user"""
    import bcrypt
    
    existing = db.query(User).filter(User.email == req.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already exists")
    
    password_hash = bcrypt.hashpw(req.password.encode(), bcrypt.gensalt()).decode()
    
    user = User(
        email=req.email,
        password_hash=password_hash,
        role=req.role,
        email_verified=True
    )
    db.add(user)
    db.commit()
    
    return {"message": "Admin user created", "user_id": user.id}


# ============ BACKUP & RESTORE ============
@router.get("/backups")
async def get_backups(admin=Depends(verify_admin), db: Session = Depends(get_db)):
    """Get backup history"""
    backups = db.query(BackupRecord).order_by(desc(BackupRecord.created_at)).limit(50).all()
    
    return {"backups": [{
        "id": b.id,
        "filename": b.filename,
        "size_mb": round(b.size_bytes / (1024 * 1024), 2),
        "backup_type": b.backup_type,
        "status": b.status,
        "created_at": b.created_at.isoformat()
    } for b in backups]}


@router.post("/backups/create")
async def create_backup(admin=Depends(verify_admin), db: Session = Depends(get_db)):
    """Trigger manual backup"""
    import subprocess
    import os
    
    timestamp = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
    filename = f"backup_{timestamp}.db"
    
    backup = BackupRecord(
        filename=filename,
        size_bytes=0,
        backup_type="full",
        status="in_progress",
        storage_location="backups/"
    )
    db.add(backup)
    db.commit()
    
    try:
        # Run backup script
        subprocess.run(["python", "scripts/backup_database.bat"], check=True)
        
        # Get file size
        filepath = f"backups/{filename}"
        if os.path.exists(filepath):
            backup.size_bytes = os.path.getsize(filepath)
        
        backup.status = "completed"
        backup.completed_at = datetime.utcnow()
    except Exception as e:
        backup.status = "failed"
    
    db.commit()
    
    return {"message": "Backup initiated", "backup_id": backup.id}


# ============ API KEYS ============
@router.get("/api-keys")
async def get_api_keys(tenant_id: str = None, admin=Depends(verify_admin), db: Session = Depends(get_db)):
    """Get API keys"""
    query = db.query(ApiKey).filter(ApiKey.revoked == False)
    
    if tenant_id:
        query = query.filter(ApiKey.tenant_id == tenant_id)
    
    keys = query.all()
    
    return {"keys": [{
        "id": k.id,
        "name": k.name,
        "key": k.key[:20] + "...",  # Masked
        "tenant_id": k.tenant_id,
        "scopes": k.scopes,
        "expires_at": k.expires_at.isoformat() if k.expires_at else None,
        "last_used_at": k.last_used_at.isoformat() if k.last_used_at else None,
        "created_at": k.created_at.isoformat()
    } for k in keys]}


class ApiKeyRequest(BaseModel):
    name: str
    tenant_id: str
    scopes: list = ["read"]
    expires_days: int = None


@router.post("/api-keys")
async def create_api_key(req: ApiKeyRequest, admin=Depends(verify_admin), db: Session = Depends(get_db)):
    """Generate API key"""
    key = f"lxb_{secrets.token_hex(32)}"
    
    expires_at = None
    if req.expires_days:
        expires_at = datetime.utcnow() + timedelta(days=req.expires_days)
    
    api_key = ApiKey(
        key=key,
        name=req.name,
        tenant_id=req.tenant_id,
        scopes=req.scopes,
        expires_at=expires_at
    )
    db.add(api_key)
    db.commit()
    
    return {"message": "API key created", "key": key}


@router.delete("/api-keys/{key_id}")
async def revoke_api_key(key_id: int, admin=Depends(verify_admin), db: Session = Depends(get_db)):
    """Revoke API key"""
    api_key = db.query(ApiKey).filter(ApiKey.id == key_id).first()
    if not api_key:
        raise HTTPException(status_code=404, detail="API key not found")
    
    api_key.revoked = True
    db.commit()
    
    return {"message": "API key revoked"}
