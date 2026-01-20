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


@router.get("")
async def get_plans(admin=Depends(verify_admin), db: Session = Depends(get_db)):
    """Get all plans"""
    plans = db.query(Plan).order_by(Plan.sort_order).all()
    return {
        "plans": [{
            "id": p.id,
            "name": p.name,
            "price": p.price,
            "features": p.features or [],
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
