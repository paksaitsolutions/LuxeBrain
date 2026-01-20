"""
Admin Webhooks Routes
Copyright © 2024 Paksa IT Solutions
"""

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from api.middleware.auth import verify_admin
from api.models.database_models import Webhook
from config.database import get_db
from typing import List
import secrets

router = APIRouter(prefix="/api/admin/webhooks", tags=["admin"])


class WebhookCreate(BaseModel):
    url: str
    events: List[str]


@router.get("")
async def get_webhooks(admin=Depends(verify_admin), db: Session = Depends(get_db)):
    """Get all webhooks"""
    webhooks = db.query(Webhook).all()
    return {"webhooks": webhooks}


@router.post("")
async def create_webhook(req: WebhookCreate, admin=Depends(verify_admin), db: Session = Depends(get_db)):
    """Create webhook"""
    webhook = Webhook(
        url=req.url,
        events=req.events,
        secret=secrets.token_hex(32)
    )
    db.add(webhook)
    db.commit()
    return {"message": "Webhook created", "secret": webhook.secret}


@router.delete("/{webhook_id}")
async def delete_webhook(webhook_id: int, admin=Depends(verify_admin), db: Session = Depends(get_db)):
    """Delete webhook"""
    webhook = db.query(Webhook).filter(Webhook.id == webhook_id).first()
    if not webhook:
        raise HTTPException(status_code=404, detail="Webhook not found")
    
    db.delete(webhook)
    db.commit()
    return {"message": "Webhook deleted"}
