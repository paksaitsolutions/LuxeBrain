"""
Admin Stats Routes
Copyright © 2024 Paksa IT Solutions
"""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from api.middleware.auth import verify_admin
from api.models.database_models import Tenant, RevenueRecord
from config.database import get_db

router = APIRouter(prefix="/api/admin/stats", tags=["admin"])


@router.get("")
async def get_stats(admin=Depends(verify_admin), db: Session = Depends(get_db)):
    """Get admin dashboard stats"""
    from api.utils.anomaly_detector import AnomalyDetector
    
    # Count tenants
    total_tenants = db.query(Tenant).count()
    active_tenants = db.query(Tenant).filter(Tenant.status == 'active').count()
    
    # Calculate revenue (sum of paid invoices)
    total_revenue = db.query(func.sum(RevenueRecord.amount)).filter(RevenueRecord.status == 'paid').scalar() or 0
    
    # Count active anomalies from Redis
    detector = AnomalyDetector()
    active_anomalies = detector.get_anomaly_count()
    
    return {
        "totalTenants": total_tenants,
        "activeTenants": active_tenants,
        "totalRevenue": float(total_revenue),
        "activeAnomalies": active_anomalies
    }
