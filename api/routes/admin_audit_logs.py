"""
Admin Audit Logs Routes
Copyright © 2024 Paksa IT Solutions
"""

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from api.middleware.auth import verify_admin
from config.database import get_db
from datetime import datetime, timedelta
import io
import csv

router = APIRouter(prefix="/api/admin/audit-logs", tags=["admin"])


@router.get("")
async def get_audit_logs(
    user_id: int = None,
    action_type: str = None,
    resource_type: str = None,
    date_from: str = None,
    date_to: str = None,
    limit: int = 100,
    admin=Depends(verify_admin),
    db: Session = Depends(get_db)
):
    """Get comprehensive audit logs with filters"""
    cursor = db.cursor()
    
    # Build query
    query = """
        SELECT ua.*, u.email as user_email, u.role as user_role
        FROM user_activities ua
        LEFT JOIN users u ON ua.user_id = u.id
        WHERE 1=1
    """
    params = []
    
    if user_id:
        query += " AND ua.user_id = ?"
        params.append(user_id)
    
    if action_type:
        query += " AND ua.action = ?"
        params.append(action_type)
    
    if resource_type:
        query += " AND ua.resource_type = ?"
        params.append(resource_type)
    
    if date_from:
        query += " AND ua.created_at >= ?"
        params.append(date_from)
    
    if date_to:
        query += " AND ua.created_at <= ?"
        params.append(date_to)
    
    # Auto-cleanup: delete logs older than 90 days
    ninety_days_ago = (datetime.utcnow() - timedelta(days=90)).isoformat()
    cursor.execute("DELETE FROM user_activities WHERE created_at < ?", (ninety_days_ago,))
    db.commit()
    
    query += " ORDER BY ua.created_at DESC LIMIT ?"
    params.append(limit)
    
    cursor.execute(query, params)
    logs = cursor.fetchall()
    
    return {
        "logs": [dict(log) for log in logs],
        "total": len(logs)
    }


@router.get("/export")
async def export_audit_logs(
    user_id: int = None,
    action_type: str = None,
    resource_type: str = None,
    date_from: str = None,
    date_to: str = None,
    admin=Depends(verify_admin),
    db: Session = Depends(get_db)
):
    """Export audit logs to CSV"""
    cursor = db.cursor()
    
    # Build query (same as get_audit_logs but no limit)
    query = """
        SELECT ua.*, u.email as user_email, u.role as user_role
        FROM user_activities ua
        LEFT JOIN users u ON ua.user_id = u.id
        WHERE 1=1
    """
    params = []
    
    if user_id:
        query += " AND ua.user_id = ?"
        params.append(user_id)
    
    if action_type:
        query += " AND ua.action = ?"
        params.append(action_type)
    
    if resource_type:
        query += " AND ua.resource_type = ?"
        params.append(resource_type)
    
    if date_from:
        query += " AND ua.created_at >= ?"
        params.append(date_from)
    
    if date_to:
        query += " AND ua.created_at <= ?"
        params.append(date_to)
    
    query += " ORDER BY ua.created_at DESC"
    
    cursor.execute(query, params)
    logs = cursor.fetchall()
    
    # Create CSV
    output = io.StringIO()
    writer = csv.writer(output)
    
    # Header
    writer.writerow(['ID', 'User Email', 'Role', 'Action', 'Resource Type', 'Resource ID', 'Details', 'IP Address', 'User Agent', 'Created At'])
    
    # Data
    for log in logs:
        writer.writerow([
            log['id'],
            log['user_email'],
            log['user_role'],
            log['action'],
            log['resource_type'] or '',
            log['resource_id'] or '',
            log['details'] or '',
            log['ip_address'] or '',
            log['user_agent'] or '',
            log['created_at']
        ])
    
    output.seek(0)
    
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename=audit_logs_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"}
    )


@router.get("/stats")
async def get_audit_stats(admin=Depends(verify_admin), db: Session = Depends(get_db)):
    """Get audit log statistics"""
    from sqlalchemy import func
    
    cursor = db.cursor()
    
    # Total logs
    cursor.execute("SELECT COUNT(*) as count FROM user_activities")
    total = cursor.fetchone()['count']
    
    # Logs by action
    cursor.execute("""
        SELECT action, COUNT(*) as count 
        FROM user_activities 
        GROUP BY action 
        ORDER BY count DESC 
        LIMIT 10
    """)
    by_action = [dict(row) for row in cursor.fetchall()]
    
    # Logs by user
    cursor.execute("""
        SELECT u.email, COUNT(*) as count 
        FROM user_activities ua
        LEFT JOIN users u ON ua.user_id = u.id
        GROUP BY ua.user_id 
        ORDER BY count DESC 
        LIMIT 10
    """)
    by_user = [dict(row) for row in cursor.fetchall()]
    
    # Recent activity (last 24 hours)
    yesterday = (datetime.utcnow() - timedelta(hours=24)).isoformat()
    cursor.execute("SELECT COUNT(*) as count FROM user_activities WHERE created_at >= ?", (yesterday,))
    last_24h = cursor.fetchone()['count']
    
    return {
        "total_logs": total,
        "last_24h": last_24h,
        "by_action": by_action,
        "by_user": by_user
    }
