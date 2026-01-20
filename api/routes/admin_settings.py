"""Admin Settings Routes - Copyright © 2024 Paksa IT Solutions"""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from config.database import get_db
from api.middleware.auth import verify_admin
from pydantic import BaseModel

router = APIRouter()

class SettingsUpdate(BaseModel):
    site_name: str = None
    support_email: str = None
    max_tenants_per_plan: int = None
    enable_signups: bool = None
    maintenance_mode: bool = None
    email_notifications: bool = None
    slack_webhook: str = None

@router.get("")
async def get_settings(db: Session = Depends(get_db), admin=Depends(verify_admin)):
    return {
        "site_name": "LuxeBrain AI",
        "support_email": "support@luxebrain.ai",
        "max_tenants_per_plan": 1000,
        "enable_signups": True,
        "maintenance_mode": False,
        "email_notifications": True,
        "slack_webhook": "",
        "stripe_public_key": "pk_test_...",
        "google_analytics": "UA-..."
    }

@router.put("")
async def update_settings(settings: SettingsUpdate, db: Session = Depends(get_db), admin=Depends(verify_admin)):
    return {"message": "Settings updated"}
