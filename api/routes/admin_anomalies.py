"""
Admin Anomalies Routes
Copyright © 2024 Paksa IT Solutions
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from api.middleware.auth import verify_admin
from api.models.database_models import Anomaly, Tenant, SupportTicket, Notification
from config.database import get_db
from datetime import datetime, timedelta
import uuid

router = APIRouter(prefix="/api/admin/anomalies", tags=["admin"])


@router.get("/{anomaly_id}")
async def get_anomaly_detail(anomaly_id: str, admin=Depends(verify_admin), db: Session = Depends(get_db)):
    """Get detailed information about an anomaly"""
    anomaly = db.query(Anomaly).filter(Anomaly.anomaly_id == anomaly_id).first()
    if not anomaly:
        raise HTTPException(status_code=404, detail="Anomaly not found")
    
    # Get tenant info
    tenant = None
    if anomaly.tenant_id:
        tenant = db.query(Tenant).filter(Tenant.tenant_id == anomaly.tenant_id).first()
    
    # Get related anomalies
    related = []
    if anomaly.related_anomalies:
        related_ids = anomaly.related_anomalies.split(',')
        related = db.query(Anomaly).filter(Anomaly.anomaly_id.in_(related_ids)).all()
    
    # Get timeline (similar anomalies in last 7 days)
    seven_days_ago = datetime.utcnow() - timedelta(days=7)
    timeline = db.query(Anomaly).filter(
        Anomaly.metric_name == anomaly.metric_name,
        Anomaly.detected_at >= seven_days_ago
    ).order_by(Anomaly.detected_at.desc()).limit(10).all()
    
    return {
        "anomaly": {
            "id": anomaly.id,
            "anomaly_id": anomaly.anomaly_id,
            "metric_name": anomaly.metric_name,
            "metric_value": anomaly.metric_value,
            "expected_value": anomaly.expected_value,
            "severity": anomaly.severity,
            "status": anomaly.status,
            "is_false_positive": anomaly.is_false_positive,
            "detected_at": anomaly.detected_at,
            "resolved_at": anomaly.resolved_at
        },
        "tenant": {
            "tenant_id": tenant.tenant_id,
            "name": tenant.name,
            "email": tenant.email
        } if tenant else None,
        "related_anomalies": [{
            "anomaly_id": r.anomaly_id,
            "metric_name": r.metric_name,
            "severity": r.severity,
            "detected_at": r.detected_at
        } for r in related],
        "timeline": [{
            "anomaly_id": t.anomaly_id,
            "metric_value": t.metric_value,
            "severity": t.severity,
            "detected_at": t.detected_at
        } for t in timeline]
    }


@router.post("/{anomaly_id}/mark-false-positive")
async def mark_false_positive(anomaly_id: str, admin=Depends(verify_admin), db: Session = Depends(get_db)):
    """Mark anomaly as false positive"""
    anomaly = db.query(Anomaly).filter(Anomaly.anomaly_id == anomaly_id).first()
    if not anomaly:
        raise HTTPException(status_code=404, detail="Anomaly not found")
    
    anomaly.is_false_positive = True
    anomaly.status = "ignored"
    anomaly.resolved_at = datetime.utcnow()
    db.commit()
    
    return {"message": "Marked as false positive"}


@router.post("/{anomaly_id}/create-ticket")
async def create_ticket_from_anomaly(anomaly_id: str, admin=Depends(verify_admin), db: Session = Depends(get_db)):
    """Create support ticket from anomaly"""
    anomaly = db.query(Anomaly).filter(Anomaly.anomaly_id == anomaly_id).first()
    if not anomaly:
        raise HTTPException(status_code=404, detail="Anomaly not found")
    
    if not anomaly.tenant_id:
        raise HTTPException(status_code=400, detail="Anomaly has no associated tenant")
    
    # Create ticket
    ticket_number = f"ANO-{uuid.uuid4().hex[:8].upper()}"
    ticket = SupportTicket(
        ticket_number=ticket_number,
        tenant_id=anomaly.tenant_id,
        subject=f"Anomaly Detected: {anomaly.metric_name}",
        description=f"An anomaly was detected in {anomaly.metric_name}. Value: {anomaly.metric_value}, Expected: {anomaly.expected_value}",
        priority="high" if anomaly.severity in ["high", "critical"] else "medium",
        created_by=admin.get('user_id')
    )
    db.add(ticket)
    db.commit()
    
    return {"message": "Ticket created", "ticket_number": ticket_number}


@router.post("/{anomaly_id}/notify-tenant")
async def notify_tenant(anomaly_id: str, admin=Depends(verify_admin), db: Session = Depends(get_db)):
    """Send notification to tenant about anomaly"""
    anomaly = db.query(Anomaly).filter(Anomaly.anomaly_id == anomaly_id).first()
    if not anomaly:
        raise HTTPException(status_code=404, detail="Anomaly not found")
    
    if not anomaly.tenant_id:
        raise HTTPException(status_code=400, detail="Anomaly has no associated tenant")
    
    # Get tenant users
    from api.models.database_models import User
    users = db.query(User).filter(User.tenant_id == anomaly.tenant_id).all()
    
    # Create notifications
    for user in users:
        notification = Notification(
            user_id=user.id,
            tenant_id=anomaly.tenant_id,
            type="anomaly",
            title=f"Anomaly Detected: {anomaly.metric_name}",
            message=f"An anomaly was detected in {anomaly.metric_name}. Please review your metrics.",
            link=f"/anomalies/{anomaly.anomaly_id}"
        )
        db.add(notification)
    
    db.commit()
    
    return {"message": f"Notified {len(users)} users"}


@router.get("/rules")
async def get_alert_rules(admin=Depends(verify_admin), db: Session = Depends(get_db)):
    """Get all alert rules"""
    from api.models.database_models import AlertRule
    
    rules = db.query(AlertRule).all()
    return {"rules": [{
        "id": r.id,
        "rule_name": r.rule_name,
        "metric_name": r.metric_name,
        "threshold_value": r.threshold_value,
        "condition": r.condition,
        "severity": r.severity,
        "channels": r.channels,
        "is_active": r.is_active,
        "created_at": r.created_at
    } for r in rules]}


@router.post("/rules")
async def create_alert_rule(rule: dict, admin=Depends(verify_admin), db: Session = Depends(get_db)):
    """Create new alert rule"""
    from api.models.database_models import AlertRule
    
    alert_rule = AlertRule(
        rule_name=rule['rule_name'],
        metric_name=rule['metric_name'],
        threshold_value=rule['threshold_value'],
        condition=rule['condition'],
        severity=rule.get('severity', 'medium'),
        channels=rule['channels']
    )
    db.add(alert_rule)
    db.commit()
    
    return {"message": "Alert rule created", "id": alert_rule.id}


@router.put("/rules/{rule_id}")
async def update_alert_rule(rule_id: int, rule: dict, admin=Depends(verify_admin), db: Session = Depends(get_db)):
    """Update alert rule"""
    from api.models.database_models import AlertRule
    
    alert_rule = db.query(AlertRule).filter(AlertRule.id == rule_id).first()
    if not alert_rule:
        raise HTTPException(status_code=404, detail="Rule not found")
    
    alert_rule.rule_name = rule.get('rule_name', alert_rule.rule_name)
    alert_rule.metric_name = rule.get('metric_name', alert_rule.metric_name)
    alert_rule.threshold_value = rule.get('threshold_value', alert_rule.threshold_value)
    alert_rule.condition = rule.get('condition', alert_rule.condition)
    alert_rule.severity = rule.get('severity', alert_rule.severity)
    alert_rule.channels = rule.get('channels', alert_rule.channels)
    alert_rule.is_active = rule.get('is_active', alert_rule.is_active)
    alert_rule.updated_at = datetime.utcnow()
    
    db.commit()
    
    return {"message": "Alert rule updated"}


@router.delete("/rules/{rule_id}")
async def delete_alert_rule(rule_id: int, admin=Depends(verify_admin), db: Session = Depends(get_db)):
    """Delete alert rule"""
    from api.models.database_models import AlertRule
    
    alert_rule = db.query(AlertRule).filter(AlertRule.id == rule_id).first()
    if not alert_rule:
        raise HTTPException(status_code=404, detail="Rule not found")
    
    db.delete(alert_rule)
    db.commit()
    
    return {"message": "Alert rule deleted"}
