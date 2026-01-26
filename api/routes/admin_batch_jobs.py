"""
Admin Batch Jobs Routes
Copyright © 2024 Paksa IT Solutions
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from api.middleware.auth import verify_admin
from api.models.database_models import BatchJob
from config.database import get_db
from datetime import datetime

router = APIRouter(prefix="/api/admin/batch", tags=["admin"])


@router.get("/jobs")
async def get_batch_jobs(
    status: str = Query(None),
    admin=Depends(verify_admin),
    db: Session = Depends(get_db)
):
    """Get all batch jobs with optional status filter"""
    query = db.query(BatchJob)
    
    if status:
        query = query.filter(BatchJob.status == status)
    
    jobs = query.order_by(BatchJob.created_at.desc()).all()
    
    return {"jobs": [{
        "id": j.id,
        "job_id": j.job_id,
        "job_type": j.job_type,
        "status": j.status,
        "progress": j.progress,
        "total": j.total,
        "tenant_id": j.tenant_id,
        "error_message": j.error_message,
        "created_at": j.created_at,
        "started_at": j.started_at,
        "completed_at": j.completed_at
    } for j in jobs]}


@router.post("/jobs/{job_id}/cancel")
async def cancel_job(job_id: str, admin=Depends(verify_admin), db: Session = Depends(get_db)):
    """Cancel a running batch job"""
    job = db.query(BatchJob).filter(BatchJob.job_id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    
    if job.status not in ["pending", "running"]:
        raise HTTPException(status_code=400, detail="Job cannot be cancelled")
    
    job.status = "cancelled"
    job.completed_at = datetime.utcnow()
    db.commit()
    
    return {"message": "Job cancelled"}


@router.post("/jobs/{job_id}/retry")
async def retry_job(job_id: str, admin=Depends(verify_admin), db: Session = Depends(get_db)):
    """Retry a failed batch job"""
    job = db.query(BatchJob).filter(BatchJob.job_id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    
    if job.status != "failed":
        raise HTTPException(status_code=400, detail="Only failed jobs can be retried")
    
    job.status = "pending"
    job.progress = 0
    job.error_message = None
    job.started_at = None
    job.completed_at = None
    db.commit()
    
    return {"message": "Job queued for retry"}


@router.get("/jobs/{job_id}/logs")
async def get_job_logs(job_id: str, admin=Depends(verify_admin), db: Session = Depends(get_db)):
    """Get logs for a specific job"""
    job = db.query(BatchJob).filter(BatchJob.job_id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    
    return {
        "job_id": job.job_id,
        "logs": job.logs or "No logs available",
        "error_message": job.error_message
    }
