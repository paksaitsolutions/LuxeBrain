"""
Logs Monitoring Routes
Copyright © 2024 Paksa IT Solutions
"""

from fastapi import APIRouter, Depends
from api.middleware.auth import verify_admin
from typing import List
import os

router = APIRouter(prefix="/api/admin/logs", tags=["admin"])

LOG_FILE = "logs/requests.log"


@router.get("/requests")
async def get_request_logs(limit: int = 100, admin=Depends(verify_admin)):
    """Get recent request logs"""
    try:
        if not os.path.exists(LOG_FILE):
            return {"logs": [], "total": 0}
        
        with open(LOG_FILE, 'r') as f:
            lines = f.readlines()
        
        # Get last N lines
        recent_logs = lines[-limit:] if len(lines) > limit else lines
        
        return {
            "logs": [line.strip() for line in reversed(recent_logs)],
            "total": len(lines)
        }
    except Exception as e:
        return {"error": str(e), "logs": []}


@router.get("/errors")
async def get_error_logs(limit: int = 50, admin=Depends(verify_admin)):
    """Get recent error logs"""
    try:
        if not os.path.exists(LOG_FILE):
            return {"errors": [], "total": 0}
        
        with open(LOG_FILE, 'r') as f:
            lines = f.readlines()
        
        # Filter error lines
        error_lines = [line for line in lines if 'ERROR' in line or 'Exception' in line]
        recent_errors = error_lines[-limit:] if len(error_lines) > limit else error_lines
        
        return {
            "errors": [line.strip() for line in reversed(recent_errors)],
            "total": len(error_lines)
        }
    except Exception as e:
        return {"error": str(e), "errors": []}
