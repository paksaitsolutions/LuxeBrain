"""
Anomaly Detection API
Copyright © 2024 Paksa IT Solutions
"""

from fastapi import APIRouter, Depends, Request
from api.utils.anomaly_detector import AnomalyDetector
from api.middleware.auth import verify_admin

router = APIRouter()
detector = AnomalyDetector()


@router.get("/api/admin/anomalies/{tenant_id}")
async def get_tenant_anomalies(tenant_id: str, admin=Depends(verify_admin)):
    """Get anomalies for specific tenant"""
    anomalies = detector.get_anomalies(tenant_id)
    return {"tenant_id": tenant_id, "anomalies": anomalies}


@router.get("/api/admin/alerts")
async def get_admin_alerts(admin=Depends(verify_admin)):
    """Get all admin security alerts"""
    alerts = detector.get_admin_alerts()
    return {"alerts": alerts, "count": len(alerts)}


@router.post("/api/internal/check-anomaly")
async def check_anomaly(req: Request):
    """Internal endpoint to check for anomalies"""
    tenant_id = getattr(req.state, 'tenant_id', None)
    if not tenant_id:
        return {"anomaly": None}
    
    # Check API rate
    anomaly = detector.check_api_rate_anomaly(tenant_id)
    if anomaly:
        detector.flag_anomaly(anomaly)
        return {"anomaly": anomaly}
    
    return {"anomaly": None}


@router.post("/api/admin/anomalies/resolve")
async def resolve_anomaly(anomaly_id: str, status: str, notes: str = "", admin=Depends(verify_admin)):
    """Resolve or ignore anomaly"""
    from config.database import SessionLocal
    from api.models.database_models import AnomalyResolution
    from datetime import datetime
    
    try:
        db = SessionLocal()
        
        resolution = AnomalyResolution(
            anomaly_id=anomaly_id,
            status=status,
            notes=notes,
            resolved_at=datetime.utcnow()
        )
        db.add(resolution)
        db.commit()
        
        # Clear from Redis
        detector.clear_anomaly(anomaly_id)
        
        db.close()
        return {"status": "resolved", "anomaly_id": anomaly_id}
    except Exception as e:
        return {"error": str(e)}


@router.get("/api/admin/anomalies/count")
async def get_anomaly_count(admin=Depends(verify_admin)):
    """Get count of unresolved anomalies"""
    count = detector.get_anomaly_count()
    return {"count": count}
