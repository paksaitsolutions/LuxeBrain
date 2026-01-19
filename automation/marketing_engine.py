"""
Marketing Automation Engine
Copyright © 2024 Paksa IT Solutions

Connects AI decisions to email, WhatsApp, and campaigns
"""

from typing import Dict, List
from datetime import datetime, timedelta
from automation.celery_tasks import celery_app
from decision_engine.engine import DecisionEngine
from config.database import SessionLocal
from api.models.database_models import Customer, Order


class MarketingAutomation:
    """AI-driven marketing automation"""
    
    def __init__(self):
        self.decision_engine = DecisionEngine()
    
    def trigger_abandoned_cart(self, customer_id: int, cart_items: List[int]):
        """Execute abandoned cart recovery strategy"""
        
        strategy = self.decision_engine.abandoned_cart_strategy(customer_id, cart_items)
        
        if strategy['send_email']:
            celery_app.send_task(
                'send_abandoned_cart_email',
                args=[customer_id, cart_items, strategy['discount_offer']],
                countdown=strategy['wait_hours'] * 3600
            )
        
        if strategy['send_whatsapp']:
            celery_app.send_task(
                'send_whatsapp_message',
                args=[customer_id, strategy['message']],
                countdown=strategy['wait_hours'] * 3600
            )
    
    def post_purchase_campaign(self, order_id: int):
        """Post-purchase engagement"""
        
        db = SessionLocal()
        order = db.query(Order).filter(Order.id == order_id).first()
        
        if not order:
            return
        
        customer = order.customer
        segment = self.decision_engine.segmentation_engine.predict(customer.id)
        
        # Immediate: Thank you + cross-sell
        celery_app.send_task(
            'send_thank_you_email',
            args=[customer.id, order.id],
            countdown=300  # 5 minutes
        )
        
        # Day 3: Review request
        celery_app.send_task(
            'send_review_request',
            args=[customer.id, order.id],
            countdown=259200  # 3 days
        )
        
        # Day 7: Replenishment reminder (if applicable)
        if segment['segment'] == 'segment_0':  # VIP
            celery_app.send_task(
                'send_vip_exclusive',
                args=[customer.id],
                countdown=604800  # 7 days
            )
        
        db.close()
    
    def seasonal_campaign(self, campaign_type: str):
        """Launch seasonal campaign"""
        
        targeting = self.decision_engine.marketing_campaign_targeting(campaign_type)
        
        db = SessionLocal()
        
        for segment in targeting['segments']:
            customers = db.query(Customer).filter(
                Customer.segment == segment
            ).all()
            
            for customer in customers:
                # Get personalized product recommendations
                recommendations = self.decision_engine.recommendation_engine.predict(
                    customer_id=customer.id,
                    session_id=None,
                    limit=6,
                    recommendation_type='personalized'
                )
                
                celery_app.send_task(
                    'send_campaign_email',
                    args=[
                        customer.id,
                        campaign_type,
                        recommendations.get('products', []),
                        targeting['discount_level']
                    ]
                )
        
        db.close()
    
    def win_back_inactive(self):
        """Win back inactive customers"""
        
        db = SessionLocal()
        
        # Find customers inactive for 60+ days
        cutoff_date = datetime.now() - timedelta(days=60)
        
        inactive_customers = db.query(Customer).join(Order).filter(
            Order.created_at < cutoff_date
        ).all()
        
        for customer in inactive_customers:
            segment = self.decision_engine.segmentation_engine.predict(customer.id)
            
            # High-value customers get bigger incentive
            if segment['segment'] == 'segment_0':
                discount = 20
            else:
                discount = 15
            
            recommendations = self.decision_engine.recommendation_engine.predict(
                customer_id=customer.id,
                session_id=None,
                limit=8,
                recommendation_type='personalized'
            )
            
            celery_app.send_task(
                'send_winback_email',
                args=[customer.id, discount, recommendations.get('products', [])]
            )
        
        db.close()


# Celery tasks for actual sending
@celery_app.task
def send_abandoned_cart_email(customer_id: int, cart_items: List[int], discount: int):
    """Send abandoned cart email"""
    # Email template with personalized products and discount code
    pass


@celery_app.task
def send_whatsapp_message(customer_id: int, message: str):
    """Send WhatsApp message via Business API"""
    pass


@celery_app.task
def send_thank_you_email(customer_id: int, order_id: int):
    """Send thank you email with cross-sell"""
    pass


@celery_app.task
def send_review_request(customer_id: int, order_id: int):
    """Request product review"""
    pass


@celery_app.task
def send_vip_exclusive(customer_id: int):
    """Send VIP exclusive offer"""
    pass


@celery_app.task
def send_campaign_email(customer_id: int, campaign_type: str, products: List, discount: int):
    """Send campaign email"""
    pass


@celery_app.task
def send_winback_email(customer_id: int, discount: int, products: List):
    """Send win-back email"""
    pass
