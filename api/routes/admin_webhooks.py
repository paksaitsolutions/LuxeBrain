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


@router.post("/{webhook_id}/test")
async def test_webhook(webhook_id: int, admin=Depends(verify_admin), db: Session = Depends(get_db)):
    """Send test payload to webhook"""
    import httpx
    import time
    from datetime import datetime
    
    webhook = db.query(Webhook).filter(Webhook.id == webhook_id).first()
    if not webhook:
        raise HTTPException(status_code=404, detail="Webhook not found")
    
    # Sample test payload
    test_payload = {
        "event": "test",
        "timestamp": datetime.utcnow().isoformat(),
        "data": {
            "message": "This is a test webhook from LuxeBrain AI",
            "webhook_id": webhook_id
        }
    }
    
    start_time = time.time()
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.post(
                webhook.url,
                json=test_payload,
                headers={"X-Webhook-Secret": webhook.secret}
            )
        
        duration = time.time() - start_time
        
        # Log delivery
        cursor = db.cursor()
        cursor.execute("""
            INSERT INTO webhook_logs (webhook_id, event, status_code, response_body, duration_ms, retry_count, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        """, (webhook_id, "test", response.status_code, response.text[:500], round(duration * 1000, 2), 0, datetime.utcnow()))
        db.commit()
        
        return {
            "success": True,
            "status_code": response.status_code,
            "response_body": response.text[:500],  # Limit response size
            "duration_ms": round(duration * 1000, 2)
        }
    except Exception as e:
        duration = time.time() - start_time
        
        # Log failed delivery
        cursor = db.cursor()
        cursor.execute("""
            INSERT INTO webhook_logs (webhook_id, event, status_code, response_body, duration_ms, retry_count, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        """, (webhook_id, "test", 0, str(e)[:500], round(duration * 1000, 2), 0, datetime.utcnow()))
        db.commit()
        
        return {
            "success": False,
            "error": str(e),
            "duration_ms": round(duration * 1000, 2)
        }


@router.get("/{webhook_id}/logs")
async def get_webhook_logs(webhook_id: int, admin=Depends(verify_admin), db=Depends(get_db)):
    """Get delivery logs for webhook"""
    webhook = db.query(Webhook).filter(Webhook.id == webhook_id).first()
    if not webhook:
        raise HTTPException(status_code=404, detail="Webhook not found")
    
    cursor = db.cursor()
    cursor.execute("""
        SELECT * FROM webhook_logs
        WHERE webhook_id = ?
        ORDER BY created_at DESC
        LIMIT 100
    """, (webhook_id,))
    logs = cursor.fetchall()
    
    return {"logs": [dict(log) for log in logs]}


@router.post("/logs/{log_id}/retry")
async def retry_webhook_delivery(log_id: int, admin=Depends(verify_admin), db=Depends(get_db)):
    """Manually retry failed webhook delivery"""
    import httpx
    import time
    from datetime import datetime
    
    cursor = db.cursor()
    cursor.execute("SELECT * FROM webhook_logs WHERE id = ?", (log_id,))
    log = cursor.fetchone()
    
    if not log:
        raise HTTPException(status_code=404, detail="Log not found")
    
    # Get webhook
    webhook = db.query(Webhook).filter(Webhook.id == log['webhook_id']).first()
    if not webhook:
        raise HTTPException(status_code=404, detail="Webhook not found")
    
    # Check max retries (3)
    if log['retry_count'] >= 3:
        raise HTTPException(status_code=400, detail="Max retries (3) exceeded")
    
    # Retry payload
    retry_payload = {
        "event": log['event'],
        "timestamp": datetime.utcnow().isoformat(),
        "retry_attempt": log['retry_count'] + 1,
        "original_log_id": log_id
    }
    
    start_time = time.time()
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.post(
                webhook.url,
                json=retry_payload,
                headers={"X-Webhook-Secret": webhook.secret}
            )
        
        duration = time.time() - start_time
        
        # Log retry
        cursor.execute("""
            INSERT INTO webhook_logs (webhook_id, event, status_code, response_body, duration_ms, retry_count, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        """, (webhook.id, log['event'], response.status_code, response.text[:500], 
                round(duration * 1000, 2), log['retry_count'] + 1, datetime.utcnow()))
        db.commit()
        
        return {
            "success": True,
            "status_code": response.status_code,
            "retry_count": log['retry_count'] + 1
        }
    except Exception as e:
        duration = time.time() - start_time
        
        # Log failed retry
        cursor.execute("""
            INSERT INTO webhook_logs (webhook_id, event, status_code, response_body, duration_ms, retry_count, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        """, (webhook.id, log['event'], 0, str(e)[:500], 
                round(duration * 1000, 2), log['retry_count'] + 1, datetime.utcnow()))
        db.commit()
        
        return {
            "success": False,
            "error": str(e),
            "retry_count": log['retry_count'] + 1
        }
