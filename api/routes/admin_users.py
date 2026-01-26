"""
Admin Users Management Routes
Copyright © 2024 Paksa IT Solutions
"""

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from api.middleware.auth import verify_admin
from config.database import get_db
import bcrypt

router = APIRouter(prefix="/api/admin/users", tags=["admin"])


class UpdateProfileRequest(BaseModel):
    email: str = None
    name: str = None


class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str


@router.get("/{user_id}")
async def get_user_profile(user_id: int, admin=Depends(verify_admin), db: Session = Depends(get_db)):
    """Get admin user profile"""
    cursor = db.cursor()
    cursor.execute("""
        SELECT id, email, role, created_at, last_login_at, last_login_ip
        FROM users 
        WHERE id = ? AND role IN ('admin', 'super_admin')
    """, (user_id,))
    user = cursor.fetchone()
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    return {"user": dict(user)}


@router.put("/{user_id}")
async def update_user_profile(
    user_id: int, 
    req: UpdateProfileRequest, 
    admin=Depends(verify_admin), 
    db: Session = Depends(get_db)
):
    """Update admin user profile"""
    cursor = db.cursor()
    
    # Verify user exists
    cursor.execute("SELECT * FROM users WHERE id = ?", (user_id,))
    user = cursor.fetchone()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Update fields
    updates = []
    params = []
    
    if req.email:
        # Check email not taken
        cursor.execute("SELECT id FROM users WHERE email = ? AND id != ?", (req.email, user_id))
        if cursor.fetchone():
            raise HTTPException(status_code=400, detail="Email already in use")
        updates.append("email = ?")
        params.append(req.email)
    
    if req.name:
        updates.append("name = ?")
        params.append(req.name)
    
    if updates:
        params.append(user_id)
        cursor.execute(f"UPDATE users SET {', '.join(updates)} WHERE id = ?", params)
        db.commit()
    
    return {"message": "Profile updated successfully"}


@router.post("/{user_id}/change-password")
async def change_password(
    user_id: int,
    req: ChangePasswordRequest,
    admin=Depends(verify_admin),
    db: Session = Depends(get_db)
):
    """Change admin user password"""
    cursor = db.cursor()
    
    # Get user
    cursor.execute("SELECT password_hash FROM users WHERE id = ?", (user_id,))
    user = cursor.fetchone()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Verify current password
    if not bcrypt.checkpw(req.current_password.encode(), user['password_hash'].encode()):
        raise HTTPException(status_code=400, detail="Current password is incorrect")
    
    # Validate new password strength
    if len(req.new_password) < 8:
        raise HTTPException(status_code=400, detail="Password must be at least 8 characters")
    
    # Hash new password
    new_hash = bcrypt.hashpw(req.new_password.encode(), bcrypt.gensalt()).decode()
    
    # Update password
    cursor.execute("UPDATE users SET password_hash = ? WHERE id = ?", (new_hash, user_id))
    db.commit()
    
    return {"message": "Password changed successfully"}


@router.get("/{user_id}/activity")
async def get_user_activity(
    user_id: int,
    action_type: str = None,
    date_from: str = None,
    date_to: str = None,
    admin=Depends(verify_admin),
    db: Session = Depends(get_db)
):
    """Get admin user activity logs"""
    from datetime import datetime
    
    cursor = db.cursor()
    
    # Build query
    query = "SELECT * FROM user_activities WHERE user_id = ?"
    params = [user_id]
    
    if action_type:
        query += " AND action = ?"
        params.append(action_type)
    
    if date_from:
        query += " AND created_at >= ?"
        params.append(date_from)
    
    if date_to:
        query += " AND created_at <= ?"
        params.append(date_to)
    
    query += " ORDER BY created_at DESC LIMIT 100"
    
    cursor.execute(query, params)
    activities = cursor.fetchall()
    
    return {
        "activities": [dict(a) for a in activities],
        "total": len(activities)
    }


class InviteAdminRequest(BaseModel):
    email: str
    role: str


@router.post("/invite")
async def invite_admin(
    req: InviteAdminRequest,
    admin=Depends(verify_admin),
    db: Session = Depends(get_db)
):
    """Invite new admin user"""
    from datetime import datetime, timedelta
    import secrets
    import smtplib
    from email.mime.text import MIMEText
    from email.mime.multipart import MIMEMultipart
    import os
    
    cursor = db.cursor()
    
    # Check if email already exists
    cursor.execute("SELECT id FROM users WHERE email = ?", (req.email,))
    if cursor.fetchone():
        raise HTTPException(status_code=400, detail="Email already exists")
    
    # Validate role
    if req.role not in ['admin', 'super_admin']:
        raise HTTPException(status_code=400, detail="Invalid role")
    
    # Generate invitation token
    token = secrets.token_urlsafe(32)
    expires_at = datetime.utcnow() + timedelta(hours=48)
    
    # Store invitation
    cursor.execute("""
        INSERT INTO admin_invitations (email, role, token, expires_at, invited_by, created_at)
        VALUES (?, ?, ?, ?, ?, ?)
    """, (req.email, req.role, token, expires_at, admin.get('user_id'), datetime.utcnow()))
    db.commit()
    
    # Send invitation email
    invite_link = f"http://localhost:3001/accept-invite?token={token}"
    
    try:
        msg = MIMEMultipart()
        msg['From'] = os.getenv('SMTP_FROM', 'noreply@luxebrain.ai')
        msg['To'] = req.email
        msg['Subject'] = 'Invitation to join LuxeBrain Admin'
        
        body = f"""
You have been invited to join LuxeBrain as an {req.role}.

Click the link below to accept the invitation and set your password:
{invite_link}

This invitation expires in 48 hours.

Best regards,
LuxeBrain Team
        """
        
        msg.attach(MIMEText(body, 'plain'))
        
        server = smtplib.SMTP(os.getenv('SMTP_HOST', 'localhost'), int(os.getenv('SMTP_PORT', 587)))
        if os.getenv('SMTP_USER'):
            server.starttls()
            server.login(os.getenv('SMTP_USER', ''), os.getenv('SMTP_PASSWORD', ''))
        server.send_message(msg)
        server.quit()
    except Exception as e:
        print(f"Failed to send invitation email: {e}")
    
    return {
        "message": "Invitation sent",
        "email": req.email,
        "expires_at": expires_at.isoformat()
    }


@router.get("/invitations")
async def get_invitations(admin=Depends(verify_admin), db: Session = Depends(get_db)):
    """Get pending invitations"""
    cursor = db.cursor()
    cursor.execute("""
        SELECT * FROM admin_invitations 
        WHERE status = 'pending' AND expires_at > datetime('now')
        ORDER BY created_at DESC
    """)
    invitations = cursor.fetchall()
    
    return {"invitations": [dict(i) for i in invitations]}
