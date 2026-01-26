"""
Dashboard Widgets Routes
Copyright © 2024 Paksa IT Solutions
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from api.middleware.auth import verify_admin
from api.models.database_models import DashboardWidget, Tenant, User, SupportTicket, RevenueRecord
from config.database import get_db
from pydantic import BaseModel
from typing import Optional
import json
from datetime import datetime, timedelta

router = APIRouter(prefix="/api/admin/widgets", tags=["widgets"])

class WidgetCreate(BaseModel):
    widget_type: str
    position: int
    size: str = 'medium'
    refresh_interval: int = 300
    config: Optional[dict] = None

class WidgetUpdate(BaseModel):
    position: Optional[int] = None
    size: Optional[str] = None
    refresh_interval: Optional[int] = None
    config: Optional[dict] = None

@router.get("")
async def get_widgets(admin=Depends(verify_admin), db: Session = Depends(get_db)):
    widgets = db.query(DashboardWidget).filter(
        DashboardWidget.user_id == admin.get('user_id')
    ).order_by(DashboardWidget.position).all()
    
    return [{
        "id": w.id,
        "widget_type": w.widget_type,
        "position": w.position,
        "size": w.size,
        "refresh_interval": w.refresh_interval,
        "config": json.loads(w.config) if w.config else {}
    } for w in widgets]

@router.post("")
async def create_widget(
    widget: WidgetCreate,
    admin=Depends(verify_admin),
    db: Session = Depends(get_db)
):
    new_widget = DashboardWidget(
        user_id=admin.get('user_id'),
        widget_type=widget.widget_type,
        position=widget.position,
        size=widget.size,
        refresh_interval=widget.refresh_interval,
        config=json.dumps(widget.config) if widget.config else None
    )
    db.add(new_widget)
    db.commit()
    db.refresh(new_widget)
    
    return {"id": new_widget.id, "message": "Widget created"}

@router.put("/{widget_id}")
async def update_widget(
    widget_id: int,
    widget: WidgetUpdate,
    admin=Depends(verify_admin),
    db: Session = Depends(get_db)
):
    db_widget = db.query(DashboardWidget).filter(
        DashboardWidget.id == widget_id,
        DashboardWidget.user_id == admin.get('user_id')
    ).first()
    
    if not db_widget:
        raise HTTPException(status_code=404, detail="Widget not found")
    
    if widget.position is not None:
        db_widget.position = widget.position
    if widget.size is not None:
        db_widget.size = widget.size
    if widget.refresh_interval is not None:
        db_widget.refresh_interval = widget.refresh_interval
    if widget.config is not None:
        db_widget.config = json.dumps(widget.config)
    
    db.commit()
    return {"message": "Widget updated"}

@router.delete("/{widget_id}")
async def delete_widget(
    widget_id: int,
    admin=Depends(verify_admin),
    db: Session = Depends(get_db)
):
    db_widget = db.query(DashboardWidget).filter(
        DashboardWidget.id == widget_id,
        DashboardWidget.user_id == admin.get('user_id')
    ).first()
    
    if not db_widget:
        raise HTTPException(status_code=404, detail="Widget not found")
    
    db.delete(db_widget)
    db.commit()
    return {"message": "Widget deleted"}

@router.get("/data/revenue")
async def get_revenue_data(admin=Depends(verify_admin), db: Session = Depends(get_db)):
    thirty_days_ago = datetime.utcnow() - timedelta(days=30)
    
    total = db.query(db.func.sum(RevenueRecord.amount)).filter(
        RevenueRecord.status == 'paid'
    ).scalar() or 0
    
    last_30_days = db.query(db.func.sum(RevenueRecord.amount)).filter(
        RevenueRecord.status == 'paid',
        RevenueRecord.created_at >= thirty_days_ago
    ).scalar() or 0
    
    return {"total": total, "last_30_days": last_30_days}

@router.get("/data/tenants")
async def get_tenants_data(admin=Depends(verify_admin), db: Session = Depends(get_db)):
    total = db.query(Tenant).count()
    active = db.query(Tenant).filter(Tenant.status == 'active').count()
    
    return {"total": total, "active": active}

@router.get("/data/tickets")
async def get_tickets_data(admin=Depends(verify_admin), db: Session = Depends(get_db)):
    total = db.query(SupportTicket).count()
    open_tickets = db.query(SupportTicket).filter(SupportTicket.status == 'open').count()
    
    return {"total": total, "open": open_tickets}

@router.get("/data/users")
async def get_users_data(admin=Depends(verify_admin), db: Session = Depends(get_db)):
    total = db.query(User).count()
    active = db.query(User).filter(User.is_active == True).count()
    
    return {"total": total, "active": active}
