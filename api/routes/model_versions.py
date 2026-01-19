"""
Model Version Management API
Copyright © 2024 Paksa IT Solutions
"""

from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional, Dict
from ml_models.model_version_manager import ModelVersionManager
from api.middleware.auth import verify_admin

router = APIRouter()


class RegisterVersionRequest(BaseModel):
    model_name: str
    version: str
    file_path: str
    metadata: Optional[Dict] = None


class ActivateVersionRequest(BaseModel):
    model_name: str
    version: str
    ab_percentage: float = 100.0


class ABTestRequest(BaseModel):
    model_name: str
    version_a: str
    version_b: str
    split: float = 50.0


class TrackPerformanceRequest(BaseModel):
    model_name: str
    version: str
    metric_name: str
    metric_value: float


@router.post("/register")
async def register_version(req: RegisterVersionRequest, admin=Depends(verify_admin)):
    """Register new model version"""
    try:
        manager = ModelVersionManager(req.model_name)
        version_id = manager.register_version(req.version, req.file_path, req.metadata)
        return {"version_id": version_id, "status": "registered"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/activate")
async def activate_version(req: ActivateVersionRequest, admin=Depends(verify_admin)):
    """Activate model version"""
    try:
        manager = ModelVersionManager(req.model_name)
        manager.activate_version(req.version, req.ab_percentage)
        return {"status": "activated", "version": req.version}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/ab-test")
async def setup_ab_test(req: ABTestRequest, admin=Depends(verify_admin)):
    """Setup A/B test between two versions"""
    try:
        manager = ModelVersionManager(req.model_name)
        manager.setup_ab_test(req.version_a, req.version_b, req.split)
        return {
            "status": "ab_test_active",
            "version_a": req.version_a,
            "version_b": req.version_b,
            "split": f"{req.split}/{100-req.split}"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/rollback")
async def rollback_version(
    model_name: str,
    version: str,
    admin=Depends(verify_admin)
):
    """Rollback to previous version"""
    try:
        manager = ModelVersionManager(model_name)
        manager.rollback_to_version(version)
        return {"status": "rolled_back", "version": version}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/track")
async def track_performance(req: TrackPerformanceRequest):
    """Track model performance"""
    try:
        manager = ModelVersionManager(req.model_name)
        manager.track_performance(req.version, req.metric_name, req.metric_value)
        return {"status": "tracked"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/list/{model_name}")
async def list_versions(model_name: str, admin=Depends(verify_admin)):
    """List all versions for a model"""
    try:
        manager = ModelVersionManager(model_name)
        versions = manager.list_versions()
        return {"model_name": model_name, "versions": versions}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/performance")
async def get_model_performance(tenant_id: Optional[str] = None):
    """Get model performance metrics for tenant"""
    from config.database import SessionLocal
    from api.models.database_models import ModelMetrics, Recommendation
    from sqlalchemy import func, desc
    
    try:
        db = SessionLocal()
        
        # Get latest metrics for recommendation model
        metrics = db.query(
            ModelMetrics.metric_name,
            func.avg(ModelMetrics.metric_value).label('value')
        ).filter(
            ModelMetrics.model_name == 'recommendation',
            ModelMetrics.timestamp >= func.datetime('now', '-7 days')
        ).group_by(ModelMetrics.metric_name).all()
        
        # Get recommendation stats
        total_recs = db.query(func.count(Recommendation.id)).scalar() or 0
        
        db.close()
        
        # Format metrics
        metrics_dict = {m.metric_name: round(m.value, 2) for m in metrics}
        
        return {
            "ctr": metrics_dict.get('ctr', 0),
            "conversion_rate": metrics_dict.get('conversion_rate', 0),
            "accuracy": metrics_dict.get('accuracy', 0),
            "total_recommendations": total_recs,
            "period": "7_days"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/metrics-history/{model_name}")
async def get_metrics_history(model_name: str, days: int = 7, admin=Depends(verify_admin)):
    """Get historical metrics for charts"""
    from config.database import SessionLocal
    from api.models.database_models import ModelMetrics
    from sqlalchemy import func
    
    try:
        db = SessionLocal()
        
        metrics = db.query(
            func.date(ModelMetrics.timestamp).label('date'),
            ModelMetrics.metric_name,
            func.avg(ModelMetrics.metric_value).label('value')
        ).filter(
            ModelMetrics.model_name == model_name,
            ModelMetrics.timestamp >= func.datetime('now', f'-{days} days')
        ).group_by(
            func.date(ModelMetrics.timestamp),
            ModelMetrics.metric_name
        ).order_by(func.date(ModelMetrics.timestamp)).all()
        
        db.close()
        
        # Format for charts
        result = {}
        for m in metrics:
            date_str = str(m.date)
            if date_str not in result:
                result[date_str] = {}
            result[date_str][m.metric_name] = round(m.value, 2)
        
        return [{"date": k, **v} for k, v in result.items()]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/request-isolation")
async def request_isolation(tenant_id: str, model_name: str = "recommendation"):
    """Request isolated model for tenant"""
    from config.database import SessionLocal
    from api.models.database_models import ModelIsolationRequest, User
    
    try:
        db = SessionLocal()
        
        # Check if already requested
        existing = db.query(ModelIsolationRequest).filter(
            ModelIsolationRequest.tenant_id == tenant_id,
            ModelIsolationRequest.model_name == model_name,
            ModelIsolationRequest.status == "pending"
        ).first()
        
        if existing:
            db.close()
            return {"status": "already_requested", "request_id": existing.id}
        
        # Create request
        request = ModelIsolationRequest(
            tenant_id=tenant_id,
            model_name=model_name,
            status="pending"
        )
        db.add(request)
        db.commit()
        db.refresh(request)
        
        request_id = request.id
        db.close()
        
        return {"status": "requested", "request_id": request_id}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/isolation-status/{tenant_id}")
async def get_isolation_status(tenant_id: str):
    """Get isolation request status for tenant"""
    from config.database import SessionLocal
    from api.models.database_models import ModelIsolationRequest
    from sqlalchemy import desc
    
    try:
        db = SessionLocal()
        
        request = db.query(ModelIsolationRequest).filter(
            ModelIsolationRequest.tenant_id == tenant_id
        ).order_by(desc(ModelIsolationRequest.created_at)).first()
        
        if not request:
            db.close()
            return {"has_request": False}
        
        result = {
            "has_request": True,
            "status": request.status,
            "model_name": request.model_name,
            "created_at": request.created_at.isoformat(),
            "reason": request.reason
        }
        
        db.close()
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/isolation-requests")
async def list_isolation_requests(admin=Depends(verify_admin)):
    """List all isolation requests"""
    from config.database import SessionLocal
    from api.models.database_models import ModelIsolationRequest
    from sqlalchemy import desc
    
    try:
        db = SessionLocal()
        
        requests = db.query(ModelIsolationRequest).order_by(
            desc(ModelIsolationRequest.created_at)
        ).all()
        
        result = [{
            "id": r.id,
            "tenant_id": r.tenant_id,
            "model_name": r.model_name,
            "status": r.status,
            "created_at": r.created_at.isoformat(),
            "reason": r.reason
        } for r in requests]
        
        db.close()
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/isolation-requests/{request_id}")
async def update_isolation_request(
    request_id: int,
    status: str,
    reason: Optional[str] = None,
    admin=Depends(verify_admin)
):
    """Update isolation request status"""
    from config.database import SessionLocal
    from api.models.database_models import ModelIsolationRequest
    from datetime import datetime
    
    try:
        db = SessionLocal()
        
        request = db.query(ModelIsolationRequest).filter(
            ModelIsolationRequest.id == request_id
        ).first()
        
        if not request:
            db.close()
            raise HTTPException(status_code=404, detail="Request not found")
        
        request.status = status
        request.reason = reason
        request.reviewed_at = datetime.utcnow()
        
        db.commit()
        db.close()
        
        return {"status": "updated"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/create-tenant-model")
async def create_tenant_model(tenant_id: str, base_model: str = "recommendation", admin=Depends(verify_admin)):
    """Create isolated model for tenant"""
    from ml_models.tenant_model_isolation import TenantModelIsolation
    
    try:
        isolation = TenantModelIsolation(base_model)
        base_path = f"models/trained/{base_model}_model"
        isolation.create_tenant_model(tenant_id, base_path)
        
        return {"status": "created", "tenant_id": tenant_id, "model": base_model}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/tenants")
async def list_tenants(admin=Depends(verify_admin)):
    """List all tenants for dropdown"""
    from config.database import SessionLocal
    from api.models.database_models import User
    from sqlalchemy import distinct
    
    try:
        db = SessionLocal()
        
        tenants = db.query(distinct(User.tenant_id)).filter(
            User.tenant_id.isnot(None)
        ).all()
        
        result = [t[0] for t in tenants if t[0]]
        
        db.close()
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
