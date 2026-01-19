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
    from jinja2 import Environment, FileSystemLoader
    import os
    
    db = SessionLocal()
    customer = db.query(Customer).filter(Customer.id == customer_id).first()
    if not customer:
        db.close()
        return
    
    # Load products
    from api.models.database_models import Product
    products = db.query(Product).filter(Product.id.in_(cart_items)).all()
    
    # Render template
    env = Environment(loader=FileSystemLoader('automation/templates'))
    template = env.get_template('abandoned_cart.html')
    
    html_content = template.render(
        customer_name=customer.first_name or 'Valued Customer',
        cart_products=[{
            'name': p.name,
            'price': p.sale_price or p.price,
            'image_url': p.image_url or 'https://via.placeholder.com/150'
        } for p in products],
        discount_code=f'CART{discount}' if discount > 0 else None,
        discount_percentage=discount,
        cart_url='https://yourstore.com/cart',
        store_name='Your Fashion Store'
    )
    
    # Send email (using SendGrid or SMTP)
    send_email_via_provider(
        to_email=customer.email,
        subject='Complete Your Purchase - Special Offer Inside!',
        html_content=html_content
    )
    
    db.close()


@celery_app.task
def send_whatsapp_message(customer_id: int, message: str):
    """Send WhatsApp message via Business API"""
    from twilio.rest import Client
    import os
    
    db = SessionLocal()
    customer = db.query(Customer).filter(Customer.id == customer_id).first()
    if not customer:
        db.close()
        return
    
    # Twilio WhatsApp integration
    account_sid = os.getenv('TWILIO_ACCOUNT_SID', 'your_account_sid')
    auth_token = os.getenv('TWILIO_AUTH_TOKEN', 'your_auth_token')
    
    try:
        client = Client(account_sid, auth_token)
        message = client.messages.create(
            from_='whatsapp:+14155238886',  # Twilio sandbox number
            body=message,
            to=f'whatsapp:{customer.phone}'  # Assuming phone field exists
        )
        print(f'WhatsApp sent: {message.sid}')
    except Exception as e:
        print(f'WhatsApp error: {e}')
    
    db.close()


@celery_app.task
def send_thank_you_email(customer_id: int, order_id: int):
    """Send thank you email with cross-sell"""
    from jinja2 import Environment, FileSystemLoader
    
    db = SessionLocal()
    customer = db.query(Customer).filter(Customer.id == customer_id).first()
    order = db.query(Order).filter(Order.id == order_id).first()
    
    if not customer or not order:
        db.close()
        return
    
    # Get cross-sell recommendations
    from decision_engine.engine import DecisionEngine
    engine = DecisionEngine()
    recommendations = engine.recommendation_engine.predict(
        customer_id=customer_id,
        session_id=None,
        limit=4,
        recommendation_type='personalized'
    )
    
    env = Environment(loader=FileSystemLoader('automation/templates'))
    template = env.get_template('recommendations.html')
    
    html_content = template.render(
        customer_name=customer.first_name or 'Valued Customer',
        recommended_products=recommendations.get('products', []),
        shop_url='https://yourstore.com/shop',
        store_name='Your Fashion Store'
    )
    
    send_email_via_provider(
        to_email=customer.email,
        subject='Thank You For Your Order!',
        html_content=html_content
    )
    
    db.close()


@celery_app.task
def send_review_request(customer_id: int, order_id: int):
    """Request product review"""
    db = SessionLocal()
    customer = db.query(Customer).filter(Customer.id == customer_id).first()
    
    if customer:
        send_email_via_provider(
            to_email=customer.email,
            subject='How Was Your Recent Purchase?',
            html_content=f'<p>Hi {customer.first_name}, we\'d love to hear your feedback!</p>'
        )
    
    db.close()


@celery_app.task
def send_vip_exclusive(customer_id: int):
    """Send VIP exclusive offer"""
    db = SessionLocal()
    customer = db.query(Customer).filter(Customer.id == customer_id).first()
    
    if customer:
        send_email_via_provider(
            to_email=customer.email,
            subject='VIP Exclusive: Early Access to New Collection',
            html_content=f'<p>Hi {customer.first_name}, as a VIP member, you get exclusive early access!</p>'
        )
    
    db.close()


@celery_app.task
def send_campaign_email(customer_id: int, campaign_type: str, products: List, discount: int):
    """Send campaign email"""
    from jinja2 import Environment, FileSystemLoader
    
    db = SessionLocal()
    customer = db.query(Customer).filter(Customer.id == customer_id).first()
    
    if customer:
        env = Environment(loader=FileSystemLoader('automation/templates'))
        template = env.get_template('recommendations.html')
        
        html_content = template.render(
            customer_name=customer.first_name or 'Valued Customer',
            recommended_products=products,
            shop_url='https://yourstore.com/shop',
            store_name='Your Fashion Store'
        )
        
        send_email_via_provider(
            to_email=customer.email,
            subject=f'{campaign_type.title()} Campaign - Special Offers Inside!',
            html_content=html_content
        )
    
    db.close()


@celery_app.task
def send_winback_email(customer_id: int, discount: int, products: List):
    """Send win-back email"""
    from jinja2 import Environment, FileSystemLoader
    
    db = SessionLocal()
    customer = db.query(Customer).filter(Customer.id == customer_id).first()
    
    if customer:
        env = Environment(loader=FileSystemLoader('automation/templates'))
        template = env.get_template('recommendations.html')
        
        html_content = template.render(
            customer_name=customer.first_name or 'Valued Customer',
            recommended_products=products,
            shop_url='https://yourstore.com/shop',
            store_name='Your Fashion Store'
        )
        
        send_email_via_provider(
            to_email=customer.email,
            subject=f'We Miss You! {discount}% OFF Your Next Order',
            html_content=html_content
        )
    
    db.close()


def send_email_via_provider(to_email: str, subject: str, html_content: str):
    """Send email using SendGrid or SMTP"""
    import os
    
    # Option 1: SendGrid
    sendgrid_api_key = os.getenv('SENDGRID_API_KEY')
    if sendgrid_api_key:
        try:
            from sendgrid import SendGridAPIClient
            from sendgrid.helpers.mail import Mail
            
            message = Mail(
                from_email='noreply@yourstore.com',
                to_emails=to_email,
                subject=subject,
                html_content=html_content
            )
            
            sg = SendGridAPIClient(sendgrid_api_key)
            response = sg.send(message)
            print(f'Email sent: {response.status_code}')
            return
        except Exception as e:
            print(f'SendGrid error: {e}')
    
    # Option 2: SMTP fallback
    import smtplib
    from email.mime.text import MIMEText
    from email.mime.multipart import MIMEMultipart
    
    smtp_host = os.getenv('SMTP_HOST', 'smtp.gmail.com')
    smtp_port = int(os.getenv('SMTP_PORT', '587'))
    smtp_user = os.getenv('SMTP_USER', '')
    smtp_pass = os.getenv('SMTP_PASS', '')
    
    if not smtp_user:
        print('No email provider configured')
        return
    
    try:
        msg = MIMEMultipart('alternative')
        msg['Subject'] = subject
        msg['From'] = smtp_user
        msg['To'] = to_email
        
        html_part = MIMEText(html_content, 'html')
        msg.attach(html_part)
        
        with smtplib.SMTP(smtp_host, smtp_port) as server:
            server.starttls()
            server.login(smtp_user, smtp_pass)
            server.send_message(msg)
        
        print(f'Email sent via SMTP to {to_email}')
    except Exception as e:
        print(f'SMTP error: {e}')
