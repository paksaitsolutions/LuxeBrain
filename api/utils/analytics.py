"""
API Usage Analytics
Copyright © 2024 Paksa IT Solutions. All Rights Reserved.
"""
from api.models.database_models import ApiLog, SessionLocal
from datetime import datetime, timedelta
from sqlalchemy import func, and_

class ApiAnalytics:
    @staticmethod
    def get_hourly_stats(hours: int = 24):
        """Get hourly request stats"""
        db = SessionLocal()
        try:
            cutoff = datetime.utcnow() - timedelta(hours=hours)
            
            results = db.query(
                func.strftime('%Y-%m-%d %H:00:00', ApiLog.created_at).label('hour'),
                func.count(ApiLog.id).label('requests'),
                func.avg(ApiLog.response_time).label('avg_time')
            ).filter(
                ApiLog.created_at >= cutoff
            ).group_by('hour').order_by('hour').all()
            
            return [{
                'hour': hour,
                'requests': requests,
                'avg_response_time': round(avg_time, 3) if avg_time else 0
            } for hour, requests, avg_time in results]
        finally:
            db.close()
    
    @staticmethod
    def get_status_distribution():
        """Get distribution of status codes"""
        db = SessionLocal()
        try:
            results = db.query(
                ApiLog.status_code,
                func.count(ApiLog.id).label('count')
            ).group_by(ApiLog.status_code).all()
            
            return [{
                'status_code': status,
                'count': count
            } for status, count in results]
        finally:
            db.close()
    
    @staticmethod
    def get_endpoint_performance(limit: int = 20):
        """Get endpoint performance metrics"""
        db = SessionLocal()
        try:
            results = db.query(
                ApiLog.endpoint,
                func.count(ApiLog.id).label('requests'),
                func.avg(ApiLog.response_time).label('avg_time'),
                func.min(ApiLog.response_time).label('min_time'),
                func.max(ApiLog.response_time).label('max_time')
            ).group_by(
                ApiLog.endpoint
            ).order_by(
                func.count(ApiLog.id).desc()
            ).limit(limit).all()
            
            return [{
                'endpoint': endpoint,
                'requests': requests,
                'avg_response_time': round(avg_time, 3) if avg_time else 0,
                'min_response_time': round(min_time, 3) if min_time else 0,
                'max_response_time': round(max_time, 3) if max_time else 0
            } for endpoint, requests, avg_time, min_time, max_time in results]
        finally:
            db.close()
    
    @staticmethod
    def get_tenant_analytics(tenant_id: str = None):
        """Get per-tenant analytics"""
        db = SessionLocal()
        try:
            query = db.query(
                ApiLog.tenant_id,
                func.count(ApiLog.id).label('requests'),
                func.avg(ApiLog.response_time).label('avg_time'),
                func.count(func.distinct(ApiLog.endpoint)).label('unique_endpoints')
            ).filter(ApiLog.tenant_id.isnot(None))
            
            if tenant_id:
                query = query.filter(ApiLog.tenant_id == tenant_id)
            
            results = query.group_by(ApiLog.tenant_id).order_by(
                func.count(ApiLog.id).desc()
            ).all()
            
            return [{
                'tenant_id': tid,
                'requests': requests,
                'avg_response_time': round(avg_time, 3) if avg_time else 0,
                'unique_endpoints': unique_endpoints
            } for tid, requests, avg_time, unique_endpoints in results]
        finally:
            db.close()
