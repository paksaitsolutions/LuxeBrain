"""
Admin Support Tickets Routes
Copyright © 2024 Paksa IT Solutions
"""

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from api.middleware.auth import verify_admin
from config.database import get_db
from datetime import datetime
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from config.settings import settings

router = APIRouter(prefix="/api/admin/support/tickets", tags=["Admin Support Tickets"])


class ReplyRequest(BaseModel):
    message: str
    is_internal: bool = False
    send_email: bool = True


class StatusUpdateRequest(BaseModel):
    status: str


@router.get("/{ticket_id}")
async def get_ticket_detail(ticket_id: int, user=Depends(verify_admin), db=Depends(get_db)):
    """Get ticket detail with conversation thread"""
    cursor = db.cursor()
    
    # Get ticket
    cursor.execute("""
        SELECT st.*, t.name as tenant_name, t.email as tenant_email,
               u.email as assignee_email
        FROM support_tickets st
        LEFT JOIN tenants t ON st.tenant_id = t.id
        LEFT JOIN users u ON st.assigned_to = u.id
        WHERE st.id = ?
    """, (ticket_id,))
    ticket = cursor.fetchone()
    
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    
    # Get messages
    cursor.execute("""
        SELECT m.*, u.email as sender_email, u.role as sender_role
        FROM ticket_messages m
        LEFT JOIN users u ON m.user_id = u.id
        WHERE m.ticket_id = ?
        ORDER BY m.created_at ASC
    """, (ticket_id,))
    messages = cursor.fetchall()
    
    # Get attachments
    cursor.execute("""
        SELECT * FROM ticket_attachments
        WHERE ticket_id = ?
        ORDER BY created_at DESC
    """, (ticket_id,))
    attachments = cursor.fetchall()
    
    # Get status history
    cursor.execute("""
        SELECT * FROM ticket_status_history
        WHERE ticket_id = ?
        ORDER BY changed_at DESC
    """, (ticket_id,))
    status_history = cursor.fetchall()
    
    return {
        "ticket": dict(ticket),
        "messages": [dict(m) for m in messages],
        "attachments": [dict(a) for a in attachments],
        "status_history": [dict(s) for s in status_history]
    }


@router.post("/{ticket_id}/reply")
async def reply_to_ticket(ticket_id: int, reply: ReplyRequest, user=Depends(verify_admin), db=Depends(get_db)):
    """Reply to support ticket"""
    cursor = db.cursor()
    
    # Get ticket and tenant info
    cursor.execute("""
        SELECT st.*, t.email as tenant_email, t.name as tenant_name
        FROM support_tickets st
        JOIN tenants t ON st.tenant_id = t.id
        WHERE st.id = ?
    """, (ticket_id,))
    ticket = cursor.fetchone()
    
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    
    # Insert message
    cursor.execute("""
        INSERT INTO ticket_messages (ticket_id, user_id, message, is_internal, created_at)
        VALUES (?, ?, ?, ?, ?)
    """, (ticket_id, user.get('user_id'), reply.message, reply.is_internal, datetime.utcnow()))
    db.commit()
    
    # Update ticket last_updated
    cursor.execute("UPDATE support_tickets SET updated_at = ? WHERE id = ?", 
                   (datetime.utcnow(), ticket_id))
    db.commit()
    
    # Send email to customer (if not internal note)
    if reply.send_email and not reply.is_internal:
        try:
            msg = MIMEMultipart()
            msg['From'] = settings.SMTP_USER or 'support@luxebrain.ai'
            msg['To'] = ticket['tenant_email']
            msg['Subject'] = f"Re: Ticket #{ticket['ticket_number']} - {ticket['subject']}"
            
            body = f"""
Hello {ticket['tenant_name']},

{reply.message}

---
Ticket #{ticket['ticket_number']}
Status: {ticket['status']}

Best regards,
LuxeBrain Support Team
            """
            
            msg.attach(MIMEText(body, 'plain'))
            
            # Send email
            smtp_host = settings.SMTP_HOST or 'localhost'
            smtp_port = settings.SMTP_PORT or 587
            
            with smtplib.SMTP(smtp_host, smtp_port) as server:
                if settings.SMTP_USER and settings.SMTP_PASSWORD:
                    server.starttls()
                    server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
                server.send_message(msg)
        except Exception as e:
            print(f"Failed to send email: {e}")
    
    # Log activity
    cursor.execute("""
        INSERT INTO user_activities (user_id, action, details, created_at)
        VALUES (?, ?, ?, ?)
    """, (user.get('user_id'), 'ticket_reply', 
            f"Replied to ticket #{ticket['ticket_number']}", datetime.utcnow()))
    db.commit()
    
    return {"success": True, "message": "Reply sent successfully"}


@router.put("/{ticket_id}/assign")
async def assign_ticket(ticket_id: int, assignee_id: int, user=Depends(verify_admin), db=Depends(get_db)):
    """Assign ticket to admin user"""
    cursor = db.cursor()
    
    # Verify ticket exists
    cursor.execute("SELECT * FROM support_tickets WHERE id = ?", (ticket_id,))
    ticket = cursor.fetchone()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    
    # Verify assignee exists and is admin
    cursor.execute("SELECT * FROM users WHERE id = ? AND role IN ('admin', 'super_admin')", (assignee_id,))
    assignee = cursor.fetchone()
    if not assignee:
        raise HTTPException(status_code=404, detail="Assignee not found or not admin")
    
    # Update ticket
    cursor.execute("""
        UPDATE support_tickets 
        SET assigned_to = ?, updated_at = ?
        WHERE id = ?
    """, (assignee_id, datetime.utcnow(), ticket_id))
    db.commit()
    
    # Log activity
    cursor.execute("""
        INSERT INTO user_activities (user_id, action, details, created_at)
        VALUES (?, ?, ?, ?)
    """, (user.get('user_id'), 'ticket_assigned', 
            f"Assigned ticket #{ticket['ticket_number']} to {assignee['email']}", datetime.utcnow()))
    db.commit()
    
    return {"success": True, "message": f"Ticket assigned to {assignee['email']}"}


@router.get("/admins")
async def get_admin_users(user=Depends(verify_admin), db=Depends(get_db)):
    """Get list of admin users for assignment"""
    cursor = db.cursor()
    cursor.execute("""
        SELECT id, email, role 
        FROM users 
        WHERE role IN ('admin', 'super_admin')
        ORDER BY email
    """)
    admins = cursor.fetchall()
    
    return {"admins": [dict(a) for a in admins]}


@router.put("/{ticket_id}/status")
async def update_ticket_status(ticket_id: int, req: StatusUpdateRequest, user=Depends(verify_admin), db=Depends(get_db)):
    """Update ticket status"""
    valid_statuses = ['new', 'in_progress', 'resolved', 'closed']
    if req.status not in valid_statuses:
        raise HTTPException(status_code=400, detail=f"Invalid status. Must be one of: {', '.join(valid_statuses)}")
    
    cursor = db.cursor()
    
    # Get current ticket
    cursor.execute("SELECT * FROM support_tickets WHERE id = ?", (ticket_id,))
    ticket = cursor.fetchone()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    
    old_status = ticket['status']
    
    # Update status
    cursor.execute("""
        UPDATE support_tickets 
        SET status = ?, updated_at = ?
        WHERE id = ?
    """, (req.status, datetime.utcnow(), ticket_id))
    db.commit()
    
    # Log status change in history
    cursor.execute("""
        INSERT INTO ticket_status_history (ticket_id, old_status, new_status, changed_by, changed_at)
        VALUES (?, ?, ?, ?, ?)
    """, (ticket_id, old_status, req.status, user.get('user_id'), datetime.utcnow()))
    db.commit()
    
    # Log activity
    cursor.execute("""
        INSERT INTO user_activities (user_id, action, details, created_at)
        VALUES (?, ?, ?, ?)
    """, (user.get('user_id'), 'ticket_status_changed', 
            f"Changed ticket #{ticket['ticket_number']} status from {old_status} to {req.status}", datetime.utcnow()))
    db.commit()
    
    # TODO: Auto-close after 7 days - implement background job
    # TODO: SLA tracking - calculate response time and resolution time
    # TODO: Escalation rules - notify if SLA breach
    
    return {"success": True, "message": f"Status updated to {req.status}"}
