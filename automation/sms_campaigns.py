"""
SMS Campaign Module
Copyright © 2024 Paksa IT Solutions
"""

import os
from typing import List, Dict
from config.database import SessionLocal
from api.models.database_models import Customer


class SMSCampaign:
    """SMS marketing campaigns via Twilio or AWS SNS"""
    
    def __init__(self):
        self.provider = os.getenv('SMS_PROVIDER', 'twilio')  # twilio or aws_sns
        
        if self.provider == 'twilio':
            self.account_sid = os.getenv('TWILIO_ACCOUNT_SID')
            self.auth_token = os.getenv('TWILIO_AUTH_TOKEN')
            self.from_number = os.getenv('TWILIO_PHONE_NUMBER')
        else:
            self.aws_region = os.getenv('AWS_REGION', 'us-east-1')
    
    def send_sms(self, to_number: str, message: str) -> bool:
        """Send single SMS"""
        if self.provider == 'twilio':
            return self._send_via_twilio(to_number, message)
        else:
            return self._send_via_aws_sns(to_number, message)
    
    def _send_via_twilio(self, to_number: str, message: str) -> bool:
        """Send SMS via Twilio"""
        try:
            from twilio.rest import Client
            
            client = Client(self.account_sid, self.auth_token)
            msg = client.messages.create(
                body=message,
                from_=self.from_number,
                to=to_number
            )
            print(f'SMS sent via Twilio: {msg.sid}')
            return True
        except Exception as e:
            print(f'Twilio SMS error: {e}')
            return False
    
    def _send_via_aws_sns(self, to_number: str, message: str) -> bool:
        """Send SMS via AWS SNS"""
        try:
            import boto3
            
            sns = boto3.client('sns', region_name=self.aws_region)
            response = sns.publish(
                PhoneNumber=to_number,
                Message=message
            )
            print(f'SMS sent via AWS SNS: {response["MessageId"]}')
            return True
        except Exception as e:
            print(f'AWS SNS error: {e}')
            return False
    
    def send_bulk_campaign(self, customer_ids: List[int], message: str) -> Dict:
        """Send SMS campaign to multiple customers"""
        db = SessionLocal()
        
        sent = 0
        failed = 0
        
        for customer_id in customer_ids:
            customer = db.query(Customer).filter(Customer.id == customer_id).first()
            
            if not customer:
                failed += 1
                continue
            
            # Check opt-in status
            if not self._check_opt_in(customer_id, db):
                failed += 1
                continue
            
            # Assuming phone field exists
            phone = getattr(customer, 'phone', None)
            if not phone:
                failed += 1
                continue
            
            if self.send_sms(phone, message):
                sent += 1
            else:
                failed += 1
        
        db.close()
        
        return {
            'total': len(customer_ids),
            'sent': sent,
            'failed': failed
        }
    
    def _check_opt_in(self, customer_id: int, db) -> bool:
        """Check if customer opted in for SMS"""
        # Placeholder - would check opt-in table
        return True
    
    def opt_in_customer(self, customer_id: int):
        """Opt customer into SMS campaigns"""
        # Store opt-in preference
        pass
    
    def opt_out_customer(self, customer_id: int):
        """Opt customer out of SMS campaigns"""
        # Store opt-out preference
        pass


# Pre-defined SMS templates
SMS_TEMPLATES = {
    'abandoned_cart': '{name}, you left items in your cart! Complete your order now and get {discount}% off: {url}',
    'order_shipped': 'Great news {name}! Your order #{order_id} has shipped. Track it here: {url}',
    'flash_sale': 'FLASH SALE! {discount}% off {category} for the next {hours} hours. Shop now: {url}',
    'back_in_stock': '{name}, the {product} you wanted is back in stock! Get it before it sells out: {url}',
    'vip_exclusive': 'VIP EXCLUSIVE: Early access to our new collection. Shop now: {url}'
}


def send_sms_campaign(campaign_type: str, customer_ids: List[int], **kwargs):
    """Send SMS campaign using template"""
    sms = SMSCampaign()
    
    template = SMS_TEMPLATES.get(campaign_type)
    if not template:
        print(f'Unknown campaign type: {campaign_type}')
        return
    
    db = SessionLocal()
    
    for customer_id in customer_ids:
        customer = db.query(Customer).filter(Customer.id == customer_id).first()
        if not customer:
            continue
        
        message = template.format(
            name=customer.first_name or 'Customer',
            **kwargs
        )
        
        phone = getattr(customer, 'phone', None)
        if phone:
            sms.send_sms(phone, message)
    
    db.close()
