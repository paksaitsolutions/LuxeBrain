"""
Segmentation Inference Engine
Copyright © 2024 Paksa IT Solutions
"""

import tensorflow as tf
import numpy as np


class SegmentationEngine:
    """Production segmentation engine"""
    
    SEGMENT_DESCRIPTIONS = {
        0: "High-Value VIP",
        1: "Loyal Regular",
        2: "Discount Seeker",
        3: "Occasional Buyer",
        4: "New Customer"
    }
    
    def __init__(self):
        self.model = None
        self._load_model()
    
    def _load_model(self):
        """Load trained model"""
        try:
            self.model = tf.keras.models.load_model("models/trained/segmentation_model")
        except:
            print("Model not found. Train the model first.")
    
    def predict(self, customer_id: int):
        """Predict customer segment using RFM analysis"""
        from config.database import SessionLocal
        from api.models.database_models import Customer, Order
        from sqlalchemy import func
        from datetime import datetime, timedelta
        
        db = SessionLocal()
        try:
            customer = db.query(Customer).filter(Customer.id == customer_id).first()
            if not customer:
                return {
                    "customer_id": customer_id,
                    "segment": "unknown",
                    "segment_description": "Customer not found",
                    "lifetime_value": 0.0
                }
            
            # Calculate RFM metrics
            now = datetime.utcnow()
            
            # Recency: days since last order
            last_order = db.query(Order).filter(
                Order.customer_id == customer_id
            ).order_by(Order.created_at.desc()).first()
            
            if last_order:
                recency = (now - last_order.created_at).days
            else:
                recency = 999
            
            # Frequency: number of orders
            frequency = customer.order_count
            
            # Monetary: total spent
            monetary = customer.total_spent
            
            # Segment based on RFM scores
            segment_id = self._calculate_segment(recency, frequency, monetary)
            
            # Calculate lifetime value
            if frequency > 0:
                avg_order_value = monetary / frequency
                lifetime_value = avg_order_value * frequency * 1.5  # Simple LTV estimate
            else:
                lifetime_value = 0.0
            
            return {
                "customer_id": customer_id,
                "segment": f"segment_{segment_id}",
                "segment_description": self.SEGMENT_DESCRIPTIONS.get(segment_id, "Unknown"),
                "lifetime_value": round(lifetime_value, 2),
                "rfm_scores": {
                    "recency": recency,
                    "frequency": frequency,
                    "monetary": round(monetary, 2)
                }
            }
        finally:
            db.close()
    
    def _calculate_segment(self, recency: int, frequency: int, monetary: float) -> int:
        """Calculate segment based on RFM scores"""
        # High-Value VIP: Recent, frequent, high spending
        if recency <= 30 and frequency >= 5 and monetary >= 500:
            return 0
        # Loyal Regular: Recent, frequent
        elif recency <= 60 and frequency >= 3:
            return 1
        # Discount Seeker: Frequent but low spending
        elif frequency >= 3 and monetary < 200:
            return 2
        # Occasional Buyer: Infrequent
        elif frequency >= 1 and recency <= 180:
            return 3
        # New Customer: First purchase or very recent
        else:
            return 4
    
    def get_segment_members(self, segment_name: str, limit: int = 100):
        """Get customers in a segment"""
        from config.database import SessionLocal
        from api.models.database_models import Customer
        
        db = SessionLocal()
        try:
            customers = db.query(Customer).filter(
                Customer.segment == segment_name
            ).limit(limit).all()
            
            return {
                "customers": [{
                    "id": c.id,
                    "email": c.email,
                    "first_name": c.first_name,
                    "last_name": c.last_name,
                    "total_spent": c.total_spent,
                    "order_count": c.order_count,
                    "lifetime_value": c.lifetime_value
                } for c in customers],
                "count": len(customers)
            }
        finally:
            db.close()
