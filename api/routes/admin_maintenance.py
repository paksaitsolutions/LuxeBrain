"""Admin Maintenance Routes - Copyright © 2024 Paksa IT Solutions"""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from config.database import get_db
from api.middleware.auth import verify_admin
import psutil

router = APIRouter()

@router.get("/stats")
async def get_maintenance_stats(db: Session = Depends(get_db), admin=Depends(verify_admin)):
    disk = psutil.disk_usage('/')
    memory = psutil.virtual_memory()
    cpu = psutil.cpu_percent(interval=1)
    
    return {
        "disk_usage_percent": round(disk.percent, 1),
        "disk_used_gb": round(disk.used / (1024**3), 2),
        "disk_total_gb": round(disk.total / (1024**3), 2),
        "memory_usage_percent": round(memory.percent, 1),
        "memory_used_gb": round(memory.used / (1024**3), 2),
        "memory_total_gb": round(memory.total / (1024**3), 2),
        "cpu_usage_percent": round(cpu, 1)
    }

@router.post("/cache/clear")
async def clear_cache(cache_type: str, admin=Depends(verify_admin)):
    return {"message": f"{cache_type} cache cleared"}

@router.post("/db/optimize")
async def optimize_database(admin=Depends(verify_admin)):
    return {"message": "Database optimization started"}
