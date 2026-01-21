"""
Admin Plans Management Routes
Copyright © 2024 Paksa IT Solutions
"""

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from api.middleware.auth import verify_admin
from api.models.database_models import Plan
from config.database import get_db
from typing import List

router = APIRouter(prefix="/api/admin/plans", tags=["admin"])


class PlanCreate(BaseModel):
    name: str
    price: float
    features: List[str]
    active: bool = True
    adminOnly: bool = False


class PlanUpdate(BaseModel):
    name: str = None
    price: float = None
    features: List[str] = None
    active: bool = None
    adminOnly: bool = None


class PlanLimitsUpdate(BaseModel):
    api_calls: int = None
    storage_gb: int = None
    users: int = None
    ml_inferences: int = None
    overage_api_calls: float = None
    overage_storage: float = None
    overage_users: float = None
    overage_ml: float = None


@router.get("")
async def get_plans(admin=Depends(verify_admin), db: Session = Depends(get_db)):
    """Get all plans with features and limits"""
    plans = db.query(Plan).order_by(Plan.sort_order).all()
    return {
        "plans": [{
            "id": p.id,
            "plan_id": p.plan_id,
            "name": p.name,
            "price": p.price,
            "billing_period": p.billing_period,
            "features": p.features or [],
            "limits": p.limits or {},
            "active": p.is_active,
            "adminOnly": p.admin_only
        } for p in plans]
    }


@router.post("")
async def create_plan(req: PlanCreate, admin=Depends(verify_admin), db: Session = Depends(get_db)):
    """Create new plan"""
    max_order = db.query(Plan).count()
    
    plan = Plan(
        plan_id=req.name.lower().replace(" ", "_"),
        name=req.name,
        price=req.price,
        features=req.features,
        is_active=req.active,
        admin_only=req.adminOnly,
        sort_order=max_order
    )
    db.add(plan)
    db.commit()
    
    return {"message": "Plan created", "id": plan.id}


@router.put("/{plan_id}")
async def update_plan(plan_id: int, req: PlanUpdate, admin=Depends(verify_admin), db: Session = Depends(get_db)):
    """Update plan"""
    plan = db.query(Plan).filter(Plan.id == plan_id).first()
    if not plan:
        raise HTTPException(status_code=404, detail="Plan not found")
    
    if req.name: plan.name = req.name
    if req.price is not None: plan.price = req.price
    if req.features: plan.features = req.features
    if req.active is not None: plan.is_active = req.active
    if req.adminOnly is not None: plan.admin_only = req.adminOnly
    
    db.commit()
    return {"message": "Plan updated"}


@router.delete("/{plan_id}")
async def delete_plan(plan_id: int, admin=Depends(verify_admin), db: Session = Depends(get_db)):
    """Delete plan"""
    plan = db.query(Plan).filter(Plan.id == plan_id).first()
    if not plan:
        raise HTTPException(status_code=404, detail="Plan not found")
    
    db.delete(plan)
    db.commit()
    return {"message": "Plan deleted"}


@router.get("/features")
async def get_plan_features(admin=Depends(verify_admin), db: Session = Depends(get_db)):
    """Get feature comparison matrix for all plans"""
    plans = db.query(Plan).filter(Plan.is_active == True).order_by(Plan.sort_order).all()
    
    return {
        "plans": [{
            "id": p.id,
            "plan_id": p.plan_id,
            "name": p.name,
            "price": p.price,
            "billing_period": p.billing_period,
            "features": p.features or [],
            "limits": p.limits or {
                "api_calls": 0,
                "storage_gb": 0,
                "users": 0,
                "ml_inferences": 0
            }
        } for p in plans]
    }


@router.put("/{plan_id}/limits")
async def update_plan_limits(plan_id: int, req: PlanLimitsUpdate, admin=Depends(verify_admin), db: Session = Depends(get_db)):
    """Update plan limits and overage pricing"""
    plan = db.query(Plan).filter(Plan.id == plan_id).first()
    if not plan:
        raise HTTPException(status_code=404, detail="Plan not found")
    
    limits = plan.limits or {}
    if req.api_calls is not None: limits['api_calls'] = req.api_calls
    if req.storage_gb is not None: limits['storage_gb'] = req.storage_gb
    if req.users is not None: limits['users'] = req.users
    if req.ml_inferences is not None: limits['ml_inferences'] = req.ml_inferences
    if req.overage_api_calls is not None: limits['overage_api_calls'] = req.overage_api_calls
    if req.overage_storage is not None: limits['overage_storage'] = req.overage_storage
    if req.overage_users is not None: limits['overage_users'] = req.overage_users
    if req.overage_ml is not None: limits['overage_ml'] = req.overage_ml
    
    plan.limits = limits
    db.commit()
    
    return {"message": "Plan limits updated", "limits": limits}


@router.get("/analytics")
async def get_plan_analytics(admin=Depends(verify_admin), db: Session = Depends(get_db)):
    """Get plan analytics - subscribers, conversions, trends"""
    from api.models.database_models import Tenant
    from sqlalchemy import func
    from datetime import datetime, timedelta
    
    # Subscribers per plan
    subscribers = db.query(
        Tenant.plan,
        func.count(Tenant.id).label('count')
    ).filter(Tenant.status == 'active').group_by(Tenant.plan).all()
    
    subscribers_by_plan = {s.plan: s.count for s in subscribers}
    
    # Upgrade/downgrade trends (last 30 days)
    thirty_days_ago = datetime.utcnow() - timedelta(days=30)
    recent_changes = db.query(
        Tenant.plan,
        func.count(Tenant.id).label('count')
    ).filter(
        Tenant.updated_at >= thirty_days_ago
    ).group_by(Tenant.plan).all()
    
    # Most popular plan
    most_popular = max(subscribers_by_plan.items(), key=lambda x: x[1]) if subscribers_by_plan else (None, 0)
    
    # Conversion rate (trial to paid)
    total_tenants = db.query(func.count(Tenant.id)).scalar() or 1
    paid_tenants = db.query(func.count(Tenant.id)).filter(
        Tenant.plan.in_(['starter', 'growth', 'enterprise'])
    ).scalar() or 0
    conversion_rate = (paid_tenants / total_tenants) * 100
    
    return {
        "subscribers_by_plan": subscribers_by_plan,
        "most_popular_plan": most_popular[0],
        "most_popular_count": most_popular[1],
        "conversion_rate": round(conversion_rate, 2),
        "total_active": sum(subscribers_by_plan.values()),
        "recent_changes": {c.plan: c.count for c in recent_changes}
    }
