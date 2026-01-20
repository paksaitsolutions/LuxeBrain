"""
Demo Request Routes
Copyright © 2024 Paksa IT Solutions
"""

from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session
from config.database import get_db
from api.models.database_models import DemoRequest
from api.middleware.auth import verify_admin

router = APIRouter(prefix="/api/demo", tags=["demo"])


class DemoRequestCreate(BaseModel):
    name: str
    email: str
    storeUrl: str
    revenue: str
    message: str = None


@router.post("/request")
async def create_demo_request(req: DemoRequestCreate, db: Session = Depends(get_db)):
    """Create demo request"""
    demo = DemoRequest(
        name=req.name,
        email=req.email,
        store_url=req.storeUrl,
        revenue=req.revenue,
        message=req.message,
        status="pending"
    )
    db.add(demo)
    db.commit()
    
    return {"message": "Demo request submitted successfully"}


@router.get("/requests")
async def get_demo_requests(user=Depends(verify_admin), db: Session = Depends(get_db)):
    """Get all demo requests (admin only)"""
    requests = db.query(DemoRequest).order_by(DemoRequest.created_at.desc()).all()
    return {"requests": [{
        "id": r.id,
        "name": r.name,
        "email": r.email,
        "store_url": r.store_url,
        "revenue": r.revenue,
        "message": r.message,
        "status": r.status,
        "created_at": r.created_at.isoformat()
    } for r in requests]}
