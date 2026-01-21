"""
Admin Email Templates Routes
Copyright © 2024 Paksa IT Solutions
"""

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from api.middleware.auth import verify_admin
from api.models.database_models import EmailTemplate
from config.database import get_db
from datetime import datetime
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import os

router = APIRouter(prefix="/api/admin/email-templates", tags=["admin"])


class EmailTemplateCreate(BaseModel):
    name: str
    subject: str
    body: str


@router.get("")
async def get_templates(admin=Depends(verify_admin), db: Session = Depends(get_db)):
    """Get all email templates"""
    templates = db.query(EmailTemplate).all()
    return {"templates": templates}


@router.post("")
async def create_template(req: EmailTemplateCreate, admin=Depends(verify_admin), db: Session = Depends(get_db)):
    """Create email template"""
    existing = db.query(EmailTemplate).filter(EmailTemplate.name == req.name).first()
    if existing:
        raise HTTPException(status_code=400, detail="Template name already exists")
    
    template = EmailTemplate(**req.dict())
    db.add(template)
    db.commit()
    return {"message": "Template created"}


@router.put("/{template_id}")
async def update_template(template_id: int, req: EmailTemplateCreate, admin=Depends(verify_admin), db: Session = Depends(get_db)):
    """Update email template"""
    template = db.query(EmailTemplate).filter(EmailTemplate.id == template_id).first()
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")
    
    template.name = req.name
    template.subject = req.subject
    template.body = req.body
    db.commit()
    return {"message": "Template updated"}


@router.delete("/{template_id}")
async def delete_template(template_id: int, admin=Depends(verify_admin), db: Session = Depends(get_db)):
    """Delete email template"""
    template = db.query(EmailTemplate).filter(EmailTemplate.id == template_id).first()
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")
    
    db.delete(template)
    db.commit()
    return {"message": "Template deleted"}


@router.get("/variables")
async def get_available_variables(admin=Depends(verify_admin)):
    """Get list of available template variables"""
    variables = {
        "tenant": [
            {"var": "{{tenant_name}}", "desc": "Tenant company name"},
            {"var": "{{tenant_email}}", "desc": "Tenant email address"},
            {"var": "{{tenant_id}}", "desc": "Tenant unique ID"},
        ],
        "subscription": [
            {"var": "{{plan}}", "desc": "Current subscription plan"},
            {"var": "{{plan_price}}", "desc": "Plan price"},
            {"var": "{{billing_period}}", "desc": "Billing period (monthly/yearly)"},
        ],
        "billing": [
            {"var": "{{amount}}", "desc": "Payment amount"},
            {"var": "{{invoice_number}}", "desc": "Invoice number"},
            {"var": "{{due_date}}", "desc": "Payment due date"},
        ],
        "general": [
            {"var": "{{date}}", "desc": "Current date"},
            {"var": "{{year}}", "desc": "Current year"},
            {"var": "{{company_name}}", "desc": "LuxeBrain AI"},
        ]
    }
    return {"variables": variables}


@router.post("/{template_id}/render")
async def render_template(template_id: int, context: dict, admin=Depends(verify_admin), db: Session = Depends(get_db)):
    """Render template with variables"""
    template = db.query(EmailTemplate).filter(EmailTemplate.id == template_id).first()
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")
    
    # Simple variable replacement
    rendered_subject = template.subject
    rendered_body = template.body
    
    for key, value in context.items():
        placeholder = f"{{{{{key}}}}}"
        rendered_subject = rendered_subject.replace(placeholder, str(value))
        rendered_body = rendered_body.replace(placeholder, str(value))
    
    return {
        "subject": rendered_subject,
        "body": rendered_body
    }


@router.post("/{template_id}/preview")
async def preview_template(template_id: int, admin=Depends(verify_admin), db: Session = Depends(get_db)):
    """Preview template with sample data"""
    template = db.query(EmailTemplate).filter(EmailTemplate.id == template_id).first()
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")
    
    # Sample data
    sample_data = {
        "tenant_name": "Fashion Boutique Inc",
        "tenant_email": "contact@fashionboutique.com",
        "tenant_id": "TEN-12345",
        "plan": "Professional",
        "plan_price": "$99",
        "billing_period": "monthly",
        "amount": "$99.00",
        "invoice_number": "INV-2024-001",
        "due_date": "2024-02-15",
        "date": datetime.now().strftime("%Y-%m-%d"),
        "year": str(datetime.now().year),
        "company_name": "LuxeBrain AI"
    }
    
    rendered_subject = template.subject
    rendered_body = template.body
    
    for key, value in sample_data.items():
        placeholder = f"{{{{{key}}}}}"
        rendered_subject = rendered_subject.replace(placeholder, str(value))
        rendered_body = rendered_body.replace(placeholder, str(value))
    
    return {
        "subject": rendered_subject,
        "body": rendered_body
    }


class SendTestEmailRequest(BaseModel):
    email: str


@router.post("/{template_id}/send-test")
async def send_test_email(template_id: int, req: SendTestEmailRequest, admin=Depends(verify_admin), db: Session = Depends(get_db)):
    """Send test email"""
    template = db.query(EmailTemplate).filter(EmailTemplate.id == template_id).first()
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")
    
    # Sample data
    sample_data = {
        "tenant_name": "Fashion Boutique Inc",
        "tenant_email": "contact@fashionboutique.com",
        "tenant_id": "TEN-12345",
        "plan": "Professional",
        "plan_price": "$99",
        "billing_period": "monthly",
        "amount": "$99.00",
        "invoice_number": "INV-2024-001",
        "due_date": "2024-02-15",
        "date": datetime.now().strftime("%Y-%m-%d"),
        "year": str(datetime.now().year),
        "company_name": "LuxeBrain AI"
    }
    
    rendered_subject = template.subject
    rendered_body = template.body
    
    for key, value in sample_data.items():
        placeholder = f"{{{{{key}}}}}"
        rendered_subject = rendered_subject.replace(placeholder, str(value))
        rendered_body = rendered_body.replace(placeholder, str(value))
    
    # Send email
    try:
        msg = MIMEMultipart()
        msg['From'] = os.getenv('SMTP_FROM', 'noreply@luxebrain.ai')
        msg['To'] = req.email
        msg['Subject'] = f"[TEST] {rendered_subject}"
        msg.attach(MIMEText(rendered_body, 'html'))
        
        server = smtplib.SMTP(os.getenv('SMTP_HOST', 'smtp.gmail.com'), int(os.getenv('SMTP_PORT', 587)))
        server.starttls()
        server.login(os.getenv('SMTP_USER', ''), os.getenv('SMTP_PASSWORD', ''))
        server.send_message(msg)
        server.quit()
        
        return {"message": "Test email sent successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to send email: {str(e)}")


@router.get("/{template_id}/analytics")
async def get_template_analytics(template_id: int, admin=Depends(verify_admin), db: Session = Depends(get_db)):
    """Get email analytics for template"""
    template = db.query(EmailTemplate).filter(EmailTemplate.id == template_id).first()
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")
    
    # Mock data - TODO: implement email_logs table
    import random
    total_sent = random.randint(100, 1000)
    total_opened = int(total_sent * random.uniform(0.15, 0.35))
    total_clicked = int(total_opened * random.uniform(0.1, 0.3))
    total_bounced = int(total_sent * random.uniform(0.01, 0.05))
    
    open_rate = (total_opened / total_sent * 100) if total_sent > 0 else 0
    click_rate = (total_clicked / total_sent * 100) if total_sent > 0 else 0
    bounce_rate = (total_bounced / total_sent * 100) if total_sent > 0 else 0
    
    return {
        "template_id": template_id,
        "template_name": template.name,
        "total_sent": total_sent,
        "total_opened": total_opened,
        "total_clicked": total_clicked,
        "total_bounced": total_bounced,
        "open_rate": round(open_rate, 2),
        "click_rate": round(click_rate, 2),
        "bounce_rate": round(bounce_rate, 2)
    }
