"""Admin Support & Usage Routes - Copyright © 2024 Paksa IT Solutions"""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from config.database import get_db
from api.middleware.auth import verify_admin

router = APIRouter()

@router.get("/support/overview")
async def get_support_overview(db: Session = Depends(get_db), admin=Depends(verify_admin)):
    return {
        "open_tickets": 12,
        "pending_escalations": 3,
        "avg_response_time": "2.5 hours",
        "satisfaction_rate": 94
    }

@router.get("/usage/overview")
async def get_usage_overview(db: Session = Depends(get_db), admin=Depends(verify_admin)):
    return {
        "total_api_calls": 1250000,
        "total_ml_inferences": 450000,
        "total_storage_gb": 125.5,
        "active_tenants": 45
    }
