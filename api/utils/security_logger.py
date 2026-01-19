"""
Security Event Logger
Copyright © 2024 Paksa IT Solutions. All Rights Reserved.
"""
from api.models.database_models import SecurityAuditLog, SessionLocal
from datetime import datetime
import logging

logger = logging.getLogger(__name__)

def log_security_event(
    event_type: str,
    user_id: int = None,
    tenant_id: str = None,
    ip_address: str = None,
    details: dict = None
):
    """Log security event to database"""
    try:
        db = SessionLocal()
        try:
            log = SecurityAuditLog(
                event_type=event_type,
                user_id=user_id,
                tenant_id=tenant_id,
                ip_address=ip_address,
                details=details,
                timestamp=datetime.utcnow()
            )
            db.add(log)
            db.commit()
            
            logger.info(
                f"Security Event: {event_type} | User: {user_id} | "
                f"Tenant: {tenant_id} | IP: {ip_address}"
            )
        finally:
            db.close()
    except Exception as e:
        logger.error(f"Failed to log security event: {e}")
