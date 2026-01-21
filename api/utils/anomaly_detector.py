"""
Anomaly Detection System
Copyright © 2024 Paksa IT Solutions
"""

from datetime import datetime, timedelta
from typing import Dict, List, Optional
from config.database import SessionLocal
import redis
import json
import os
import requests


class AnomalyDetector:
    """Detect unusual patterns and suspicious activity"""
    
    def __init__(self):
        self.redis_client = redis.from_url("redis://localhost:6379/0")
        self.thresholds = {
            "api_calls_per_minute": 100,
            "failed_auth_attempts": 5,
            "large_order_amount": 10000,
            "rapid_order_creation": 10,
            "unusual_time_activity": True
        }
    
    def check_api_rate_anomaly(self, tenant_id: str) -> Optional[Dict]:
        """Detect unusual API call rate"""
        key = f"anomaly:api:{tenant_id}"
        count = self.redis_client.incr(key)
        self.redis_client.expire(key, 60)
        
        if count > self.thresholds["api_calls_per_minute"]:
            return {
                "type": "high_api_rate",
                "tenant_id": tenant_id,
                "count": count,
                "threshold": self.thresholds["api_calls_per_minute"],
                "severity": "medium"
            }
        return None
    
    def check_auth_anomaly(self, tenant_id: str, success: bool) -> Optional[Dict]:
        """Detect failed authentication attempts"""
        if success:
            self.redis_client.delete(f"anomaly:auth:{tenant_id}")
            return None
        
        key = f"anomaly:auth:{tenant_id}"
        count = self.redis_client.incr(key)
        self.redis_client.expire(key, 300)
        
        if count >= self.thresholds["failed_auth_attempts"]:
            return {
                "type": "failed_auth",
                "tenant_id": tenant_id,
                "count": count,
                "severity": "high"
            }
        return None
    
    def check_order_anomaly(self, tenant_id: str, order_total: float) -> Optional[Dict]:
        """Detect unusually large orders"""
        if order_total > self.thresholds["large_order_amount"]:
            return {
                "type": "large_order",
                "tenant_id": tenant_id,
                "amount": order_total,
                "threshold": self.thresholds["large_order_amount"],
                "severity": "low"
            }
        return None
    
    def check_rapid_orders(self, tenant_id: str) -> Optional[Dict]:
        """Detect rapid order creation"""
        key = f"anomaly:orders:{tenant_id}"
        count = self.redis_client.incr(key)
        self.redis_client.expire(key, 300)
        
        if count > self.thresholds["rapid_order_creation"]:
            return {
                "type": "rapid_orders",
                "tenant_id": tenant_id,
                "count": count,
                "severity": "medium"
            }
        return None
    
    def check_unusual_time(self, tenant_id: str) -> Optional[Dict]:
        """Detect activity during unusual hours (2-6 AM)"""
        hour = datetime.utcnow().hour
        if 2 <= hour < 6:
            return {
                "type": "unusual_time",
                "tenant_id": tenant_id,
                "hour": hour,
                "severity": "low"
            }
        return None
    
    def flag_anomaly(self, anomaly: Dict):
        """Flag anomaly for review"""
        key = f"anomalies:{anomaly['tenant_id']}"
        anomaly["timestamp"] = datetime.utcnow().isoformat()
        self.redis_client.lpush(key, json.dumps(anomaly))
        self.redis_client.ltrim(key, 0, 99)  # Keep last 100
        
        # Alert if high severity
        if anomaly.get("severity") == "high":
            self.alert_admin(anomaly)
    
    def alert_admin(self, anomaly: Dict):
        """Send alert to admin team"""
        alert_key = "admin:alerts"
        alert = {
            "type": "security_anomaly",
            "data": anomaly,
            "timestamp": datetime.utcnow().isoformat()
        }
        self.redis_client.lpush(alert_key, json.dumps(alert))
        self.redis_client.ltrim(alert_key, 0, 49)
        
        # Log to file
        with open("logs/anomalies.log", "a") as f:
            f.write(f"{json.dumps(alert)}\n")
        
        # Send email and Slack alerts for high severity
        if anomaly.get("severity") == "high":
            self.send_email_alert(anomaly)
            self.send_slack_alert(anomaly)
    
    def get_anomalies(self, tenant_id: str, limit: int = 20) -> List[Dict]:
        """Get recent anomalies for tenant"""
        key = f"anomalies:{tenant_id}"
        items = self.redis_client.lrange(key, 0, limit - 1)
        return [json.loads(item) for item in items]
    
    def get_admin_alerts(self, limit: int = 50) -> List[Dict]:
        """Get admin alerts"""
        items = self.redis_client.lrange("admin:alerts", 0, limit - 1)
        return [json.loads(item) for item in items]
    
    def clear_anomaly(self, anomaly_id: str):
        """Clear anomaly from Redis after resolution"""
        # Remove from all tenant anomaly lists
        for key in self.redis_client.scan_iter("anomalies:*"):
            items = self.redis_client.lrange(key, 0, -1)
            for item in items:
                data = json.loads(item)
                if data.get("id") == anomaly_id or f"{data.get('tenant_id')}-" in anomaly_id:
                    self.redis_client.lrem(key, 0, item)
        
        # Remove from admin alerts
        items = self.redis_client.lrange("admin:alerts", 0, -1)
        for item in items:
            data = json.loads(item)
            if data.get("data", {}).get("id") == anomaly_id:
                self.redis_client.lrem("admin:alerts", 0, item)
    
    def send_email_alert(self, anomaly: Dict):
        """Send email alert for high severity anomalies"""
        email_api_key = os.getenv("EMAIL_API_KEY")
        if not email_api_key:
            return
        
        try:
            # Using SendGrid API
            url = "https://api.sendgrid.com/v3/mail/send"
            headers = {
                "Authorization": f"Bearer {email_api_key}",
                "Content-Type": "application/json"
            }
            data = {
                "personalizations": [{"to": [{"email": os.getenv("ADMIN_EMAIL", "admin@luxebrain.ai")}]}],
                "from": {"email": "alerts@luxebrain.ai"},
                "subject": f"[ALERT] High Severity Anomaly - {anomaly['type']}",
                "content": [{
                    "type": "text/plain",
                    "value": f"Anomaly detected:\n\nType: {anomaly['type']}\nTenant: {anomaly['tenant_id']}\nSeverity: {anomaly['severity']}\nDetails: {json.dumps(anomaly, indent=2)}"
                }]
            }
            requests.post(url, headers=headers, json=data, timeout=5)
        except Exception as e:
            print(f"Failed to send email alert: {e}")
    
    def send_slack_alert(self, anomaly: Dict):
        """Send Slack alert for high severity anomalies"""
        webhook_url = os.getenv("SLACK_WEBHOOK_URL")
        if not webhook_url:
            return
        
        try:
            data = {
                "text": f":warning: *High Severity Anomaly Detected*",
                "blocks": [
                    {
                        "type": "header",
                        "text": {"type": "plain_text", "text": "Security Anomaly Alert"}
                    },
                    {
                        "type": "section",
                        "fields": [
                            {"type": "mrkdwn", "text": f"*Type:*\n{anomaly['type']}"},
                            {"type": "mrkdwn", "text": f"*Severity:*\n{anomaly['severity'].upper()}"},
                            {"type": "mrkdwn", "text": f"*Tenant:*\n{anomaly['tenant_id']}"},
                            {"type": "mrkdwn", "text": f"*Time:*\n{datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S')} UTC"}
                        ]
                    }
                ]
            }
            requests.post(webhook_url, json=data, timeout=5)
        except Exception as e:
            print(f"Failed to send Slack alert: {e}")
    
    def get_anomaly_count(self) -> int:
        """Get total count of unresolved anomalies"""
        try:
            items = self.redis_client.lrange("admin:alerts", 0, -1)
            return len(items)
        except Exception:
            return 0
