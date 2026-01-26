"""Admin Settings Routes - Copyright © 2024 Paksa IT Solutions"""
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from config.database import get_db
from api.middleware.auth import verify_admin
from api.models.database_models import SystemSetting, UserActivity
from pydantic import BaseModel, EmailStr
import os
import shutil
from datetime import datetime

router = APIRouter()

class GeneralSettings(BaseModel):
    company_name: str
    support_email: EmailStr
    support_phone: str
    timezone: str

@router.get("/general")
async def get_general_settings(db: Session = Depends(get_db), admin=Depends(verify_admin)):
    settings = db.query(SystemSetting).filter(SystemSetting.category == 'general').all()
    return {s.key: s.value for s in settings}

@router.put("/general")
async def update_general_settings(
    settings: GeneralSettings,
    db: Session = Depends(get_db),
    admin=Depends(verify_admin)
):
    updates = {
        'company_name': settings.company_name,
        'support_email': settings.support_email,
        'support_phone': settings.support_phone,
        'timezone': settings.timezone
    }
    
    for key, value in updates.items():
        setting = db.query(SystemSetting).filter(SystemSetting.key == key).first()
        if setting:
            setting.value = value
            setting.updated_by = admin.get('user_id')
            setting.updated_at = datetime.utcnow()
        else:
            new_setting = SystemSetting(
                key=key,
                value=value,
                category='general',
                updated_by=admin.get('user_id')
            )
            db.add(new_setting)
    
    activity = UserActivity(
        user_id=admin.get('user_id'),
        action='update_settings',
        resource_type='system',
        resource_id='general',
        details='Updated general settings',
        ip_address='admin',
        user_agent='admin_portal'
    )
    db.add(activity)
    db.commit()
    
    return {"message": "Settings updated successfully"}

@router.post("/general/logo")
async def upload_logo(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    admin=Depends(verify_admin)
):
    if not file.content_type.startswith('image/'):
        raise HTTPException(status_code=400, detail="File must be an image")
    
    os.makedirs('uploads/logos', exist_ok=True)
    file_path = f"uploads/logos/logo_{datetime.utcnow().timestamp()}{os.path.splitext(file.filename)[1]}"
    
    with open(file_path, 'wb') as f:
        shutil.copyfileobj(file.file, f)
    
    setting = db.query(SystemSetting).filter(SystemSetting.key == 'logo_url').first()
    if setting:
        setting.value = f"/{file_path}"
        setting.updated_by = admin.get('user_id')
    else:
        setting = SystemSetting(
            key='logo_url',
            value=f"/{file_path}",
            category='general',
            updated_by=admin.get('user_id')
        )
        db.add(setting)
    
    db.commit()
    return {"message": "Logo uploaded", "url": f"/{file_path}"}


class EmailSettings(BaseModel):
    smtp_host: str
    smtp_port: int
    smtp_username: str
    smtp_password: str
    sender_name: str
    sender_email: EmailStr
    use_tls: bool = True

@router.get("/email")
async def get_email_settings(db: Session = Depends(get_db), admin=Depends(verify_admin)):
    settings = db.query(SystemSetting).filter(SystemSetting.category == 'email').all()
    result = {s.key: s.value for s in settings}
    # Mask password
    if 'smtp_password' in result and result['smtp_password']:
        result['smtp_password'] = '********'
    return result

@router.put("/email")
async def update_email_settings(
    settings: EmailSettings,
    db: Session = Depends(get_db),
    admin=Depends(verify_admin)
):
    updates = {
        'smtp_host': settings.smtp_host,
        'smtp_port': str(settings.smtp_port),
        'smtp_username': settings.smtp_username,
        'smtp_password': settings.smtp_password,
        'sender_name': settings.sender_name,
        'sender_email': settings.sender_email,
        'use_tls': str(settings.use_tls)
    }
    
    for key, value in updates.items():
        setting = db.query(SystemSetting).filter(SystemSetting.key == key).first()
        if setting:
            setting.value = value
            setting.updated_by = admin.get('user_id')
            setting.updated_at = datetime.utcnow()
        else:
            new_setting = SystemSetting(
                key=key,
                value=value,
                category='email',
                updated_by=admin.get('user_id')
            )
            db.add(new_setting)
    
    activity = UserActivity(
        user_id=admin.get('user_id'),
        action='update_settings',
        resource_type='system',
        resource_id='email',
        details='Updated email settings',
        ip_address='admin',
        user_agent='admin_portal'
    )
    db.add(activity)
    db.commit()
    
    return {"message": "Email settings updated successfully"}

@router.post("/email/test")
async def test_email(
    test_email: EmailStr,
    db: Session = Depends(get_db),
    admin=Depends(verify_admin)
):
    import smtplib
    from email.mime.text import MIMEText
    from email.mime.multipart import MIMEMultipart
    
    settings = db.query(SystemSetting).filter(SystemSetting.category == 'email').all()
    config = {s.key: s.value for s in settings}
    
    if not all(k in config for k in ['smtp_host', 'smtp_port', 'smtp_username', 'smtp_password']):
        raise HTTPException(status_code=400, detail="Email settings not configured")
    
    try:
        msg = MIMEMultipart()
        msg['From'] = f"{config.get('sender_name', 'LuxeBrain')} <{config.get('sender_email', config['smtp_username'])}>"
        msg['To'] = test_email
        msg['Subject'] = 'Test Email from LuxeBrain AI'
        
        body = f"""This is a test email from LuxeBrain AI.
        
If you received this, your email configuration is working correctly.
        
Sent at: {datetime.utcnow().isoformat()}"""
        
        msg.attach(MIMEText(body, 'plain'))
        
        server = smtplib.SMTP(config['smtp_host'], int(config['smtp_port']))
        if config.get('use_tls', 'True') == 'True':
            server.starttls()
        server.login(config['smtp_username'], config['smtp_password'])
        server.send_message(msg)
        server.quit()
        
        return {"message": f"Test email sent to {test_email}"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to send email: {str(e)}")


class PaymentSettings(BaseModel):
    stripe_test_public_key: str
    stripe_test_secret_key: str
    stripe_live_public_key: str
    stripe_live_secret_key: str
    paypal_client_id: str
    paypal_secret: str
    test_mode: bool = True

@router.get("/payment")
async def get_payment_settings(db: Session = Depends(get_db), admin=Depends(verify_admin)):
    settings = db.query(SystemSetting).filter(SystemSetting.category == 'payment').all()
    result = {s.key: s.value for s in settings}
    # Mask secrets
    for key in ['stripe_test_secret_key', 'stripe_live_secret_key', 'paypal_secret']:
        if key in result and result[key]:
            result[key] = '********'
    return result

@router.put("/payment")
async def update_payment_settings(
    settings: PaymentSettings,
    db: Session = Depends(get_db),
    admin=Depends(verify_admin)
):
    updates = {
        'stripe_test_public_key': settings.stripe_test_public_key,
        'stripe_test_secret_key': settings.stripe_test_secret_key,
        'stripe_live_public_key': settings.stripe_live_public_key,
        'stripe_live_secret_key': settings.stripe_live_secret_key,
        'paypal_client_id': settings.paypal_client_id,
        'paypal_secret': settings.paypal_secret,
        'test_mode': str(settings.test_mode)
    }
    
    for key, value in updates.items():
        setting = db.query(SystemSetting).filter(SystemSetting.key == key).first()
        if setting:
            setting.value = value
            setting.updated_by = admin.get('user_id')
            setting.updated_at = datetime.utcnow()
        else:
            new_setting = SystemSetting(
                key=key,
                value=value,
                category='payment',
                updated_by=admin.get('user_id')
            )
            db.add(new_setting)
    
    activity = UserActivity(
        user_id=admin.get('user_id'),
        action='update_settings',
        resource_type='system',
        resource_id='payment',
        details='Updated payment settings',
        ip_address='admin',
        user_agent='admin_portal'
    )
    db.add(activity)
    db.commit()
    
    return {"message": "Payment settings updated successfully"}

@router.post("/payment/test")
async def test_payment_connection(
    db: Session = Depends(get_db),
    admin=Depends(verify_admin)
):
    import stripe
    
    settings = db.query(SystemSetting).filter(SystemSetting.category == 'payment').all()
    config = {s.key: s.value for s in settings}
    
    test_mode = config.get('test_mode', 'True') == 'True'
    secret_key = config.get('stripe_test_secret_key' if test_mode else 'stripe_live_secret_key')
    
    if not secret_key:
        raise HTTPException(status_code=400, detail="Stripe keys not configured")
    
    try:
        stripe.api_key = secret_key
        stripe.Account.retrieve()
        return {"message": "Stripe connection successful", "mode": "test" if test_mode else "live"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Stripe connection failed: {str(e)}")
