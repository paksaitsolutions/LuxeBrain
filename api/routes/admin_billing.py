"""
Admin Billing Management Routes
Copyright © 2024 Paksa IT Solutions
"""

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from api.middleware.auth import verify_admin
from config.database import get_db
from api.models.database_models import Tenant, RevenueRecord
from api.utils.usage_tracker import UsageTracker

router = APIRouter(prefix="/api/admin/billing", tags=["admin"])


class InvoiceActionRequest(BaseModel):
    action: str  # mark_paid, refund
    amount: float = None


@router.get("/invoices/{invoice_id}")
async def get_invoice_detail(invoice_id: int, db: Session = Depends(get_db), admin=Depends(verify_admin)):
    """Get full invoice details"""
    invoice = db.query(RevenueRecord).filter(RevenueRecord.id == invoice_id).first()
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")
    
    tenant = db.query(Tenant).filter(Tenant.tenant_id == invoice.tenant_id).first()
    
    # Calculate line items
    base_amount = invoice.amount
    tax_rate = 0.0  # No tax for now
    tax_amount = base_amount * tax_rate
    discount = 0.0
    total = base_amount + tax_amount - discount
    
    return {
        "invoice": {
            "id": invoice.id,
            "invoice_number": f"INV-{invoice.id:06d}",
            "tenant_id": invoice.tenant_id,
            "tenant_name": tenant.name if tenant else "Unknown",
            "tenant_email": tenant.email if tenant else "Unknown",
            "amount": invoice.amount,
            "plan": invoice.plan,
            "billing_period": invoice.billing_period,
            "status": invoice.status,
            "stripe_invoice_id": invoice.stripe_invoice_id,
            "created_at": invoice.created_at.isoformat(),
            "line_items": [
                {
                    "description": f"{invoice.plan.title()} Plan - {invoice.billing_period.title()}",
                    "quantity": 1,
                    "unit_price": invoice.amount,
                    "total": invoice.amount
                }
            ],
            "subtotal": base_amount,
            "tax_rate": tax_rate,
            "tax_amount": tax_amount,
            "discount": discount,
            "total": total,
            "payment_method": "Stripe" if invoice.stripe_invoice_id else "Manual"
        }
    }


@router.post("/invoices/{invoice_id}/action")
async def invoice_action(
    invoice_id: int,
    req: InvoiceActionRequest,
    db: Session = Depends(get_db),
    admin=Depends(verify_admin)
):
    """Perform action on invoice (mark paid, refund)"""
    from api.models.database_models import UserActivity
    
    invoice = db.query(RevenueRecord).filter(RevenueRecord.id == invoice_id).first()
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")
    
    if req.action == "mark_paid":
        invoice.status = "paid"
        message = "Invoice marked as paid"
    elif req.action == "refund":
        if invoice.status != "paid":
            raise HTTPException(status_code=400, detail="Can only refund paid invoices")
        invoice.status = "refunded"
        message = f"Invoice refunded: ${req.amount or invoice.amount}"
    else:
        raise HTTPException(status_code=400, detail="Invalid action")
    
    # Log activity
    activity = UserActivity(
        user_id=admin.get("user_id"),
        action=f"invoice_{req.action}",
        resource_type="invoice",
        resource_id=str(invoice_id),
        details={"invoice_id": invoice_id, "amount": invoice.amount},
        ip_address="admin",
        user_agent="admin_portal"
    )
    db.add(activity)
    db.commit()
    
    return {"message": message}


@router.get("/invoices/{invoice_id}/pdf")
async def download_invoice_pdf(invoice_id: int, db: Session = Depends(get_db), admin=Depends(verify_admin)):
    """Generate and download invoice PDF"""
    from fastapi.responses import StreamingResponse
    from reportlab.lib.pagesizes import letter
    from reportlab.lib import colors
    from reportlab.lib.units import inch
    from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
    from reportlab.lib.styles import getSampleStyleSheet
    from io import BytesIO
    
    invoice = db.query(RevenueRecord).filter(RevenueRecord.id == invoice_id).first()
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")
    
    tenant = db.query(Tenant).filter(Tenant.tenant_id == invoice.tenant_id).first()
    
    buffer = BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=letter)
    elements = []
    styles = getSampleStyleSheet()
    
    # Title
    elements.append(Paragraph(f"<b>INVOICE #{invoice.id:06d}</b>", styles['Title']))
    elements.append(Spacer(1, 0.3*inch))
    
    # Bill To
    elements.append(Paragraph(f"<b>Bill To:</b>", styles['Heading2']))
    elements.append(Paragraph(f"{tenant.name if tenant else 'Unknown'}", styles['Normal']))
    elements.append(Paragraph(f"{tenant.email if tenant else ''}", styles['Normal']))
    elements.append(Spacer(1, 0.3*inch))
    
    # Invoice Info
    info_data = [
        ['Invoice Date:', invoice.created_at.strftime('%Y-%m-%d')],
        ['Status:', invoice.status.upper()],
        ['Plan:', invoice.plan.title()],
    ]
    info_table = Table(info_data, colWidths=[2*inch, 3*inch])
    elements.append(info_table)
    elements.append(Spacer(1, 0.5*inch))
    
    # Line Items
    data = [['Description', 'Qty', 'Price', 'Total']]
    data.append([f"{invoice.plan.title()} Plan - {invoice.billing_period.title()}", '1', f"${invoice.amount:.2f}", f"${invoice.amount:.2f}"])
    
    table = Table(data, colWidths=[3*inch, 1*inch, 1.5*inch, 1.5*inch])
    table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 12),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
        ('GRID', (0, 0), (-1, -1), 1, colors.black)
    ]))
    elements.append(table)
    elements.append(Spacer(1, 0.5*inch))
    
    # Total
    total_data = [['Total:', f"${invoice.amount:.2f}"]]
    total_table = Table(total_data, colWidths=[5.5*inch, 1.5*inch])
    total_table.setStyle(TableStyle([('ALIGN', (1, 0), (1, 0), 'RIGHT'), ('FONTNAME', (0, 0), (-1, -1), 'Helvetica-Bold')]))
    elements.append(total_table)
    
    doc.build(elements)
    buffer.seek(0)
    
    return StreamingResponse(buffer, media_type="application/pdf", headers={"Content-Disposition": f"attachment; filename=invoice_{invoice.id:06d}.pdf"})


@router.post("/invoices/{invoice_id}/send")
async def send_invoice_email(invoice_id: int, db: Session = Depends(get_db), admin=Depends(verify_admin)):
    """Send invoice via email with PDF attachment"""
    import smtplib
    from email.mime.multipart import MIMEMultipart
    from email.mime.text import MIMEText
    from email.mime.application import MIMEApplication
    from reportlab.lib.pagesizes import letter
    from reportlab.lib import colors
    from reportlab.lib.units import inch
    from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
    from reportlab.lib.styles import getSampleStyleSheet
    from io import BytesIO
    from api.models.database_models import UserActivity
    from config.settings import settings
    
    invoice = db.query(RevenueRecord).filter(RevenueRecord.id == invoice_id).first()
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")
    
    tenant = db.query(Tenant).filter(Tenant.tenant_id == invoice.tenant_id).first()
    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant not found")
    
    # Generate PDF
    buffer = BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=letter)
    elements = []
    styles = getSampleStyleSheet()
    elements.append(Paragraph(f"<b>INVOICE #{invoice.id:06d}</b>", styles['Title']))
    elements.append(Spacer(1, 0.3*inch))
    elements.append(Paragraph(f"<b>Bill To:</b>", styles['Heading2']))
    elements.append(Paragraph(f"{tenant.name}", styles['Normal']))
    elements.append(Paragraph(f"{tenant.email}", styles['Normal']))
    elements.append(Spacer(1, 0.3*inch))
    info_data = [['Invoice Date:', invoice.created_at.strftime('%Y-%m-%d')], ['Status:', invoice.status.upper()], ['Plan:', invoice.plan.title()]]
    elements.append(Table(info_data, colWidths=[2*inch, 3*inch]))
    elements.append(Spacer(1, 0.5*inch))
    data = [['Description', 'Qty', 'Price', 'Total']]
    data.append([f"{invoice.plan.title()} Plan - {invoice.billing_period.title()}", '1', f"${invoice.amount:.2f}", f"${invoice.amount:.2f}"])
    table = Table(data, colWidths=[3*inch, 1*inch, 1.5*inch, 1.5*inch])
    table.setStyle(TableStyle([('BACKGROUND', (0, 0), (-1, 0), colors.grey), ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke), ('ALIGN', (0, 0), (-1, -1), 'CENTER'), ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'), ('GRID', (0, 0), (-1, -1), 1, colors.black)]))
    elements.append(table)
    elements.append(Spacer(1, 0.5*inch))
    total_table = Table([['Total:', f"${invoice.amount:.2f}"]], colWidths=[5.5*inch, 1.5*inch])
    total_table.setStyle(TableStyle([('ALIGN', (1, 0), (1, 0), 'RIGHT'), ('FONTNAME', (0, 0), (-1, -1), 'Helvetica-Bold')]))
    elements.append(total_table)
    doc.build(elements)
    buffer.seek(0)
    
    # Send Email
    msg = MIMEMultipart()
    msg['From'] = settings.SMTP_FROM_EMAIL if hasattr(settings, 'SMTP_FROM_EMAIL') else 'noreply@luxebrain.ai'
    msg['To'] = tenant.email
    msg['Subject'] = f"Invoice #{invoice.id:06d} from LuxeBrain AI"
    
    body = f"""Dear {tenant.name},

Please find attached your invoice #{invoice.id:06d} for ${invoice.amount:.2f}.

Invoice Details:
- Plan: {invoice.plan.title()}
- Billing Period: {invoice.billing_period.title()}
- Amount: ${invoice.amount:.2f}
- Status: {invoice.status.upper()}

Thank you for your business!

Best regards,
LuxeBrain AI Team
"""
    msg.attach(MIMEText(body, 'plain'))
    
    # Attach PDF
    pdf_attachment = MIMEApplication(buffer.read(), _subtype='pdf')
    pdf_attachment.add_header('Content-Disposition', 'attachment', filename=f'invoice_{invoice.id:06d}.pdf')
    msg.attach(pdf_attachment)
    
    # Send via SMTP (using environment variables or defaults)
    try:
        smtp_host = getattr(settings, 'SMTP_HOST', 'localhost')
        smtp_port = getattr(settings, 'SMTP_PORT', 587)
        smtp_user = getattr(settings, 'SMTP_USER', None)
        smtp_pass = getattr(settings, 'SMTP_PASSWORD', None)
        
        with smtplib.SMTP(smtp_host, smtp_port) as server:
            if smtp_user and smtp_pass:
                server.starttls()
                server.login(smtp_user, smtp_pass)
            server.send_message(msg)
        
        # Log activity
        activity = UserActivity(
            user_id=admin.get("user_id"),
            action="invoice_email_sent",
            resource_type="invoice",
            resource_id=str(invoice_id),
            details={"invoice_id": invoice_id, "recipient": tenant.email},
            ip_address="admin",
            user_agent="admin_portal"
        )
        db.add(activity)
        db.commit()
        
        return {"message": f"Invoice sent to {tenant.email}"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to send email: {str(e)}")


@router.get("/subscriptions/{tenant_id}")
async def get_subscription(tenant_id: str, db: Session = Depends(get_db), admin=Depends(verify_admin)):
    """Get subscription details for tenant"""
    tenant = db.query(Tenant).filter(Tenant.tenant_id == tenant_id).first()
    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant not found")
    
    return {
        "subscription": {
            "tenant_id": tenant_id,
            "plan": tenant.plan,
            "status": tenant.status,
            "created_at": tenant.created_at.isoformat(),
            "stripe_subscription_id": None  # TODO: Add to tenant model
        }
    }


@router.put("/subscriptions/{tenant_id}")
async def update_subscription(
    tenant_id: str,
    action: str,
    new_plan: str = None,
    db: Session = Depends(get_db),
    admin=Depends(verify_admin)
):
    """Update subscription (pause, resume, cancel, change_plan)"""
    from api.models.database_models import UserActivity
    
    tenant = db.query(Tenant).filter(Tenant.tenant_id == tenant_id).first()
    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant not found")
    
    if action == "pause":
        tenant.status = "suspended"
        message = "Subscription paused"
    elif action == "resume":
        tenant.status = "active"
        message = "Subscription resumed"
    elif action == "cancel":
        tenant.status = "canceled"
        message = "Subscription canceled"
    elif action == "change_plan":
        if not new_plan:
            raise HTTPException(status_code=400, detail="new_plan required")
        tenant.plan = new_plan
        message = f"Plan changed to {new_plan}"
    else:
        raise HTTPException(status_code=400, detail="Invalid action")
    
    # TODO: Sync with Stripe API
    # stripe.Subscription.modify(tenant.stripe_subscription_id, ...)
    
    activity = UserActivity(
        user_id=admin.get("user_id"),
        action=f"subscription_{action}",
        resource_type="subscription",
        resource_id=tenant_id,
        details={"action": action, "new_plan": new_plan},
        ip_address="admin",
        user_agent="admin_portal"
    )
    db.add(activity)
    db.commit()
    
    return {"message": message}


@router.get("/revenue/analytics")
async def get_revenue_analytics(
    date_from: str = None,
    date_to: str = None,
    plan: str = None,
    db: Session = Depends(get_db),
    admin=Depends(verify_admin)
):
    """Get revenue analytics (MRR, ARR, churn, revenue by plan)"""
    from datetime import datetime, timedelta
    from sqlalchemy import func, extract
    
    # Date range
    if not date_from:
        date_from = (datetime.utcnow() - timedelta(days=365)).isoformat()
    if not date_to:
        date_to = datetime.utcnow().isoformat()
    
    # Active tenants
    active_query = db.query(Tenant).filter(Tenant.status == "active")
    if plan:
        active_query = active_query.filter(Tenant.plan == plan)
    active_tenants = active_query.all()
    
    # MRR calculation
    plan_prices = {"free": 0, "starter": 29, "growth": 99, "enterprise": 299}
    mrr = sum(plan_prices.get(t.plan, 0) for t in active_tenants)
    arr = mrr * 12
    
    # Revenue by plan
    revenue_by_plan = {}
    for plan_name in ["free", "starter", "growth", "enterprise"]:
        count = sum(1 for t in active_tenants if t.plan == plan_name)
        revenue_by_plan[plan_name] = {
            "count": count,
            "revenue": count * plan_prices.get(plan_name, 0)
        }
    
    # Churn rate (last 30 days)
    thirty_days_ago = datetime.utcnow() - timedelta(days=30)
    total_start = db.query(func.count(Tenant.id)).filter(
        Tenant.created_at < thirty_days_ago
    ).scalar() or 1
    churned = db.query(func.count(Tenant.id)).filter(
        Tenant.status == "canceled",
        Tenant.updated_at >= thirty_days_ago
    ).scalar() or 0
    churn_rate = (churned / total_start) * 100 if total_start > 0 else 0
    
    # Monthly revenue trend (last 12 months)
    monthly_revenue = []
    for i in range(12):
        month_date = datetime.utcnow() - timedelta(days=30*i)
        month_tenants = db.query(func.count(Tenant.id)).filter(
            Tenant.status == "active",
            Tenant.created_at <= month_date
        ).scalar() or 0
        monthly_revenue.insert(0, {
            "month": month_date.strftime("%b %Y"),
            "revenue": month_tenants * 50  # Avg revenue
        })
    
    return {
        "mrr": mrr,
        "arr": arr,
        "churn_rate": round(churn_rate, 2),
        "active_tenants": len(active_tenants),
        "revenue_by_plan": revenue_by_plan,
        "monthly_revenue": monthly_revenue
    }


@router.get("/failed-payments")
async def get_failed_payments(db: Session = Depends(get_db), admin=Depends(verify_admin)):
    """Get all failed payments"""
    failed = db.query(RevenueRecord).filter(RevenueRecord.status == "failed").all()
    
    result = []
    for record in failed:
        tenant = db.query(Tenant).filter(Tenant.tenant_id == record.tenant_id).first()
        result.append({
            "id": record.id,
            "tenant_id": record.tenant_id,
            "tenant_name": tenant.name if tenant else "Unknown",
            "tenant_email": tenant.email if tenant else "Unknown",
            "amount": record.amount,
            "plan": record.plan,
            "created_at": record.created_at.isoformat(),
            "retry_count": 0  # TODO: Add retry_count to model
        })
    
    return {"failed_payments": result, "total": len(result)}


@router.post("/failed-payments/{payment_id}/retry")
async def retry_payment(payment_id: int, db: Session = Depends(get_db), admin=Depends(verify_admin)):
    """Retry failed payment"""
    from api.models.database_models import UserActivity
    
    payment = db.query(RevenueRecord).filter(RevenueRecord.id == payment_id).first()
    if not payment:
        raise HTTPException(status_code=404, detail="Payment not found")
    
    # TODO: Integrate with Stripe to retry payment
    # For now, mark as pending
    payment.status = "pending"
    
    activity = UserActivity(
        user_id=admin.get("user_id"),
        action="payment_retry",
        resource_type="payment",
        resource_id=str(payment_id),
        details={"payment_id": payment_id, "amount": payment.amount},
        ip_address="admin",
        user_agent="admin_portal"
    )
    db.add(activity)
    db.commit()
    
    return {"message": "Payment retry initiated"}


@router.post("/failed-payments/{payment_id}/contact")
async def contact_customer(payment_id: int, db: Session = Depends(get_db), admin=Depends(verify_admin)):
    """Send dunning email to customer"""
    import smtplib
    from email.mime.text import MIMEText
    from config.settings import settings
    
    payment = db.query(RevenueRecord).filter(RevenueRecord.id == payment_id).first()
    if not payment:
        raise HTTPException(status_code=404, detail="Payment not found")
    
    tenant = db.query(Tenant).filter(Tenant.tenant_id == payment.tenant_id).first()
    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant not found")
    
    # Send dunning email
    msg = MIMEText(f"""Dear {tenant.name},

Your recent payment of ${payment.amount} has failed. Please update your payment method to continue using our service.

Amount: ${payment.amount}
Plan: {payment.plan}

Please contact support if you need assistance.

Best regards,
LuxeBrain AI Team""")
    msg['Subject'] = 'Payment Failed - Action Required'
    msg['From'] = getattr(settings, 'SMTP_FROM_EMAIL', 'noreply@luxebrain.ai')
    msg['To'] = tenant.email
    
    try:
        smtp_host = getattr(settings, 'SMTP_HOST', 'localhost')
        smtp_port = getattr(settings, 'SMTP_PORT', 587)
        with smtplib.SMTP(smtp_host, smtp_port) as server:
            server.send_message(msg)
        return {"message": f"Dunning email sent to {tenant.email}"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to send email: {str(e)}")


@router.post("/failed-payments/{payment_id}/suspend")
async def suspend_for_failed_payment(payment_id: int, db: Session = Depends(get_db), admin=Depends(verify_admin)):
    """Suspend account due to failed payment"""
    payment = db.query(RevenueRecord).filter(RevenueRecord.id == payment_id).first()
    if not payment:
        raise HTTPException(status_code=404, detail="Payment not found")
    
    tenant = db.query(Tenant).filter(Tenant.tenant_id == payment.tenant_id).first()
    if tenant:
        tenant.status = "suspended"
        db.commit()
    
    return {"message": "Account suspended"}


@router.post("/credits")
async def issue_credit(
    tenant_id: str,
    amount: float,
    reason: str,
    db: Session = Depends(get_db),
    admin=Depends(verify_admin)
):
    """Issue credit to tenant account"""
    from api.models.database_models import UserActivity
    
    tenant = db.query(Tenant).filter(Tenant.tenant_id == tenant_id).first()
    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant not found")
    
    # Create credit record
    credit = RevenueRecord(
        tenant_id=tenant_id,
        amount=-amount,  # Negative for credit
        plan=tenant.plan,
        billing_period="credit",
        status="paid"
    )
    db.add(credit)
    
    # TODO: Create Stripe credit note
    # stripe.CreditNote.create(customer=tenant.stripe_customer_id, amount=amount)
    
    activity = UserActivity(
        user_id=admin.get("user_id"),
        action="credit_issued",
        resource_type="credit",
        resource_id=tenant_id,
        details={"amount": amount, "reason": reason},
        ip_address="admin",
        user_agent="admin_portal"
    )
    db.add(activity)
    db.commit()
    
    return {"message": f"Credit of ${amount} issued to {tenant.name}"}


@router.post("/refunds")
async def process_refund(
    invoice_id: int,
    amount: float,
    reason: str,
    db: Session = Depends(get_db),
    admin=Depends(verify_admin)
):
    """Process refund for invoice"""
    from api.models.database_models import UserActivity
    
    invoice = db.query(RevenueRecord).filter(RevenueRecord.id == invoice_id).first()
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")
    
    if invoice.status != "paid":
        raise HTTPException(status_code=400, detail="Can only refund paid invoices")
    
    # Update invoice status
    invoice.status = "refunded"
    
    # Create refund record
    refund = RevenueRecord(
        tenant_id=invoice.tenant_id,
        amount=-amount,
        plan=invoice.plan,
        billing_period="refund",
        status="paid"
    )
    db.add(refund)
    
    # TODO: Process Stripe refund
    # stripe.Refund.create(charge=invoice.stripe_charge_id, amount=amount)
    
    activity = UserActivity(
        user_id=admin.get("user_id"),
        action="refund_processed",
        resource_type="refund",
        resource_id=str(invoice_id),
        details={"amount": amount, "reason": reason},
        ip_address="admin",
        user_agent="admin_portal"
    )
    db.add(activity)
    db.commit()
    
    return {"message": f"Refund of ${amount} processed"}


@router.get("/credits/{tenant_id}")
async def get_credit_balance(tenant_id: str, db: Session = Depends(get_db), admin=Depends(verify_admin)):
    """Get credit balance for tenant"""
    from sqlalchemy import func
    
    credits = db.query(func.sum(RevenueRecord.amount)).filter(
        RevenueRecord.tenant_id == tenant_id,
        RevenueRecord.amount < 0,
        RevenueRecord.status == "paid"
    ).scalar() or 0
    
    return {"tenant_id": tenant_id, "credit_balance": abs(credits)}


@router.get("/refunds/{tenant_id}")
async def get_refund_history(tenant_id: str, db: Session = Depends(get_db), admin=Depends(verify_admin)):
    """Get refund history for tenant"""
    refunds = db.query(RevenueRecord).filter(
        RevenueRecord.tenant_id == tenant_id,
        RevenueRecord.billing_period == "refund"
    ).all()
    
    return {
        "refunds": [{
            "id": r.id,
            "amount": abs(r.amount),
            "created_at": r.created_at.isoformat()
        } for r in refunds]
    }


@router.get("/tenants")
async def get_all_tenants_billing(db: Session = Depends(get_db), admin=Depends(verify_admin)):
    """Get billing overview for all tenants"""
    tenants_data = []
    tenants = db.query(Tenant).all()
    
    for tenant in tenants:
        usage = UsageTracker.get_usage(tenant.tenant_id)
        daily = UsageTracker.get_daily_usage(tenant.tenant_id)
        
        tenants_data.append({
            "tenant_id": tenant.tenant_id,
            "name": tenant.name,
            "email": tenant.email,
            "plan": tenant.plan,
            "status": tenant.status,
            "subscription_status": "active" if tenant.status == "active" else "inactive",
            "usage": {
                "api_calls_today": daily.get("api_calls", 0),
                "ml_inferences_today": daily.get("ml_inferences", 0),
                "storage_mb": usage.get("storage_bytes", 0) / (1024 * 1024)
            }
        })
    
    return {"tenants": tenants_data, "total": len(tenants_data)}


@router.get("/tenant/{tenant_id}")
async def get_tenant_billing(tenant_id: str, db: Session = Depends(get_db), admin=Depends(verify_admin)):
    """Get detailed billing info for specific tenant"""
    tenant = db.query(Tenant).filter(Tenant.tenant_id == tenant_id).first()
    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant not found")
    
    usage = UsageTracker.get_usage(tenant_id)
    
    return {
        "tenant": {
            "tenant_id": tenant.tenant_id,
            "name": tenant.name,
            "email": tenant.email,
            "plan": tenant.plan,
            "status": tenant.status
        },
        "usage": usage,
        "daily_breakdown": usage.get("daily_breakdown", {})
    }


@router.put("/tenant/{tenant_id}/plan")
async def update_tenant_plan(tenant_id: str, plan: str, db: Session = Depends(get_db), admin=Depends(verify_admin)):
    """Manually update tenant plan"""
    if plan not in ["basic", "premium", "enterprise"]:
        raise HTTPException(status_code=400, detail="Invalid plan")
    
    tenant = db.query(Tenant).filter(Tenant.tenant_id == tenant_id).first()
    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant not found")
    
    tenant.plan = plan
    db.commit()
    
    return {"message": f"Plan updated to {plan}", "tenant_id": tenant_id}


@router.put("/tenant/{tenant_id}/status")
async def update_tenant_status(tenant_id: str, status: str, db: Session = Depends(get_db), admin=Depends(verify_admin)):
    """Update tenant status (active/suspended/canceled)"""
    if status not in ["active", "suspended", "canceled"]:
        raise HTTPException(status_code=400, detail="Invalid status")
    
    tenant = db.query(Tenant).filter(Tenant.tenant_id == tenant_id).first()
    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant not found")
    
    tenant.status = status
    db.commit()
    
    return {"message": f"Status updated to {status}", "tenant_id": tenant_id}


@router.get("/revenue")
async def get_revenue_stats(db: Session = Depends(get_db), admin=Depends(verify_admin)):
    """Get revenue statistics"""
    plan_prices = {"basic": 0, "premium": 99, "enterprise": 299}
    
    revenue = {"mrr": 0, "by_plan": {"basic": 0, "premium": 0, "enterprise": 0}}
    
    tenants = db.query(Tenant).filter(Tenant.status == "active").all()
    for tenant in tenants:
        plan = tenant.plan or "basic"
        revenue["mrr"] += plan_prices.get(plan, 0)
        revenue["by_plan"][plan] += 1
    
    return revenue
