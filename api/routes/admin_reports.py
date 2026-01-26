"""
Custom Reports API
Copyright © 2024 Paksa IT Solutions
"""

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from api.middleware.auth import verify_admin
from api.models.database_models import Tenant, User, RevenueRecord, ApiLog, SupportTicket
from config.database import get_db
from pydantic import BaseModel
from datetime import datetime, timedelta
from typing import Optional, List
import csv
import io

router = APIRouter(prefix="/api/admin/reports", tags=["reports"])

class ReportRequest(BaseModel):
    report_type: str
    metrics: List[str]
    date_from: Optional[str] = None
    date_to: Optional[str] = None
    filters: Optional[dict] = None

@router.post("/generate")
async def generate_report(
    req: ReportRequest,
    admin=Depends(verify_admin),
    db: Session = Depends(get_db)
):
    """Generate custom report"""
    date_from = datetime.fromisoformat(req.date_from) if req.date_from else datetime.utcnow() - timedelta(days=30)
    date_to = datetime.fromisoformat(req.date_to) if req.date_to else datetime.utcnow()
    
    if req.report_type == "revenue":
        records = db.query(RevenueRecord).filter(
            RevenueRecord.created_at >= date_from,
            RevenueRecord.created_at <= date_to
        ).all()
        
        data = [{
            "date": r.created_at.isoformat(),
            "tenant_id": r.tenant_id,
            "amount": r.amount,
            "plan": r.plan,
            "status": r.status
        } for r in records]
        
        total = sum(r.amount for r in records if r.status == "paid")
        
        return {
            "report_type": "revenue",
            "data": data,
            "summary": {
                "total_revenue": total,
                "total_records": len(records),
                "date_range": f"{date_from.date()} to {date_to.date()}"
            }
        }
    
    elif req.report_type == "tenants":
        query = db.query(Tenant).filter(
            Tenant.created_at >= date_from,
            Tenant.created_at <= date_to
        )
        
        if req.filters and req.filters.get("plan"):
            query = query.filter(Tenant.plan == req.filters["plan"])
        if req.filters and req.filters.get("status"):
            query = query.filter(Tenant.status == req.filters["status"])
        
        tenants = query.all()
        
        data = [{
            "tenant_id": t.tenant_id,
            "name": t.name,
            "email": t.email,
            "plan": t.plan,
            "status": t.status,
            "created_at": t.created_at.isoformat()
        } for t in tenants]
        
        return {
            "report_type": "tenants",
            "data": data,
            "summary": {
                "total_tenants": len(tenants),
                "date_range": f"{date_from.date()} to {date_to.date()}"
            }
        }
    
    elif req.report_type == "usage":
        logs = db.query(ApiLog).filter(
            ApiLog.created_at >= date_from,
            ApiLog.created_at <= date_to
        ).all()
        
        data = [{
            "date": l.created_at.isoformat(),
            "tenant_id": l.tenant_id,
            "endpoint": l.endpoint,
            "method": l.method,
            "status_code": l.status_code
        } for l in logs]
        
        return {
            "report_type": "usage",
            "data": data,
            "summary": {
                "total_api_calls": len(logs),
                "date_range": f"{date_from.date()} to {date_to.date()}"
            }
        }
    
    elif req.report_type == "support":
        tickets = db.query(SupportTicket).filter(
            SupportTicket.created_at >= date_from,
            SupportTicket.created_at <= date_to
        ).all()
        
        data = [{
            "ticket_number": t.ticket_number,
            "tenant_id": t.tenant_id,
            "subject": t.subject,
            "status": t.status,
            "priority": t.priority,
            "created_at": t.created_at.isoformat()
        } for t in tickets]
        
        return {
            "report_type": "support",
            "data": data,
            "summary": {
                "total_tickets": len(tickets),
                "open_tickets": len([t for t in tickets if t.status in ["open", "in_progress"]]),
                "date_range": f"{date_from.date()} to {date_to.date()}"
            }
        }
    
    else:
        raise HTTPException(status_code=400, detail="Invalid report type")

@router.post("/export/csv")
async def export_csv(
    req: ReportRequest,
    admin=Depends(verify_admin),
    db: Session = Depends(get_db)
):
    """Export report as CSV"""
    report = await generate_report(req, admin, db)
    
    output = io.StringIO()
    if not report["data"]:
        raise HTTPException(status_code=404, detail="No data to export")
    
    writer = csv.DictWriter(output, fieldnames=report["data"][0].keys())
    writer.writeheader()
    writer.writerows(report["data"])
    
    csv_data = output.getvalue()
    
    return StreamingResponse(
        iter([csv_data]),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={req.report_type}_report_{datetime.utcnow().date()}.csv"}
    )

@router.get("/templates")
async def get_report_templates(admin=Depends(verify_admin)):
    """Get available report templates"""
    return {
        "templates": [
            {
                "id": "revenue",
                "name": "Revenue Report",
                "description": "Financial revenue breakdown",
                "metrics": ["total_revenue", "transactions", "plans"]
            },
            {
                "id": "tenants",
                "name": "Tenant Report",
                "description": "Tenant signups and status",
                "metrics": ["total_tenants", "by_plan", "by_status"]
            },
            {
                "id": "usage",
                "name": "API Usage Report",
                "description": "API call statistics",
                "metrics": ["total_calls", "by_endpoint", "by_tenant"]
            },
            {
                "id": "support",
                "name": "Support Tickets Report",
                "description": "Support ticket analytics",
                "metrics": ["total_tickets", "by_status", "by_priority"]
            }
        ]
    }
