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
