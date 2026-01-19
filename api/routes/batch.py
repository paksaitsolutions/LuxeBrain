"""
Batch Queue Monitoring API
Copyright © 2024 Paksa IT Solutions
"""

from fastapi import APIRouter, Depends
from api.middleware.auth import verify_admin
import redis
import json

router = APIRouter()

@router.get("/api/admin/batch/stats")
async def get_batch_stats(admin=Depends(verify_admin)):
    """Get batch queue statistics"""
    try:
        r = redis.from_url("redis://localhost:6379/0")
        
        # Get queue length
        queue_length = r.llen("batch:queue") or 0
        
        # Get processing count
        processing = r.scard("batch:processing") or 0
        
        # Get failed jobs
        failed_jobs = []
        failed_keys = r.keys("batch:failed:*")
        for key in failed_keys[:10]:  # Limit to 10
            data = r.get(key)
            if data:
                failed_jobs.append(json.loads(data))
        
        # Get completed count (last hour)
        completed = r.get("batch:completed:count") or 0
        
        # Calculate processing rate (jobs per minute)
        rate = float(completed) / 60 if completed else 0
        
        return {
            "queue_length": queue_length,
            "processing": processing,
            "failed_count": len(failed_keys),
            "failed_jobs": failed_jobs,
            "completed_last_hour": int(completed),
            "processing_rate": round(rate, 2)
        }
    except Exception as e:
        return {
            "queue_length": 0,
            "processing": 0,
            "failed_count": 0,
            "failed_jobs": [],
            "completed_last_hour": 0,
            "processing_rate": 0,
            "error": str(e)
        }


@router.post("/api/admin/batch/retry/{job_id}")
async def retry_failed_job(job_id: str, admin=Depends(verify_admin)):
    """Retry a failed batch job"""
    try:
        r = redis.from_url("redis://localhost:6379/0")
        
        # Get failed job data
        key = f"batch:failed:{job_id}"
        data = r.get(key)
        
        if not data:
            return {"error": "Job not found"}
        
        # Re-queue the job
        r.rpush("batch:queue", data)
        r.delete(key)
        
        return {"status": "requeued", "job_id": job_id}
    except Exception as e:
        return {"error": str(e)}
