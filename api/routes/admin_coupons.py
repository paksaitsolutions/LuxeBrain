"""
Admin Coupons Routes
Copyright © 2024 Paksa IT Solutions
"""

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from api.middleware.auth import verify_admin
from api.models.database_models import Coupon
from config.database import get_db

router = APIRouter(prefix="/api/admin/coupons", tags=["admin"])


class CouponCreate(BaseModel):
    code: str
    discount: float
    type: str
    limit: int = None
    expires: str = None
    restrictions: dict = None
    is_stackable: bool = False
    auto_apply: bool = False


@router.get("")
async def get_coupons(admin=Depends(verify_admin), db: Session = Depends(get_db)):
    """Get all coupons"""
    coupons = db.query(Coupon).all()
    return {"coupons": coupons}


@router.post("")
async def create_coupon(req: CouponCreate, admin=Depends(verify_admin), db: Session = Depends(get_db)):
    """Create coupon"""
    existing = db.query(Coupon).filter(Coupon.code == req.code).first()
    if existing:
        raise HTTPException(status_code=400, detail="Coupon code already exists")
    
    coupon = Coupon(**req.dict())
    db.add(coupon)
    db.commit()
    return {"message": "Coupon created"}


@router.delete("/{coupon_id}")
async def delete_coupon(coupon_id: int, admin=Depends(verify_admin), db: Session = Depends(get_db)):
    """Delete coupon"""
    coupon = db.query(Coupon).filter(Coupon.id == coupon_id).first()
    if not coupon:
        raise HTTPException(status_code=404, detail="Coupon not found")
    
    db.delete(coupon)
    db.commit()
    return {"message": "Coupon deleted"}


@router.get("/{coupon_id}/usage")
async def get_coupon_usage(
    coupon_id: int,
    admin=Depends(verify_admin),
    db: Session = Depends(get_db)
):
    """Get coupon usage statistics"""
    from api.models.database_models import CouponUsage, Tenant
    from sqlalchemy import func
    from datetime import datetime, timedelta
    
    coupon = db.query(Coupon).filter(Coupon.id == coupon_id).first()
    if not coupon:
        raise HTTPException(status_code=404, detail="Coupon not found")
    
    # Get all usage records
    usage_records = db.query(CouponUsage).filter(
        CouponUsage.coupon_id == coupon_id
    ).all()
    
    # Calculate metrics
    redemption_count = len(usage_records)
    total_discount = sum(u.discount_amount for u in usage_records)
    
    # Get unique tenants
    unique_tenants = db.query(CouponUsage.tenant_id).filter(
        CouponUsage.coupon_id == coupon_id
    ).distinct().all()
    
    tenant_list = []
    for (tenant_id,) in unique_tenants:
        tenant = db.query(Tenant).filter(Tenant.tenant_id == tenant_id).first()
        if tenant:
            usage_count = db.query(func.count(CouponUsage.id)).filter(
                CouponUsage.coupon_id == coupon_id,
                CouponUsage.tenant_id == tenant_id
            ).scalar()
            
            tenant_list.append({
                "tenant_id": tenant.tenant_id,
                "name": tenant.name,
                "email": tenant.email,
                "usage_count": usage_count
            })
    
    # Timeline data (last 30 days)
    thirty_days_ago = datetime.utcnow() - timedelta(days=30)
    timeline = db.query(
        func.date(CouponUsage.used_at).label('date'),
        func.count(CouponUsage.id).label('count')
    ).filter(
        CouponUsage.coupon_id == coupon_id,
        CouponUsage.used_at >= thirty_days_ago
    ).group_by(func.date(CouponUsage.used_at)).all()
    
    timeline_data = [{
        "date": str(date),
        "count": count
    } for date, count in timeline]
    
    return {
        "coupon": {
            "id": coupon.id,
            "code": coupon.code,
            "discount": coupon.discount,
            "type": coupon.type,
            "uses": coupon.uses,
            "limit": coupon.limit,
            "active": coupon.active
        },
        "stats": {
            "redemption_count": redemption_count,
            "total_discount": total_discount,
            "unique_tenants": len(unique_tenants),
            "remaining_uses": (coupon.limit - coupon.uses) if coupon.limit else None
        },
        "tenants": tenant_list,
        "timeline": timeline_data
    }
