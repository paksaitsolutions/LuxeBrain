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
