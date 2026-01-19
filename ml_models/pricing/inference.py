"""
Pricing Inference Engine
Copyright © 2024 Paksa IT Solutions
"""

import tensorflow as tf
import numpy as np


class PricingEngine:
    """Production pricing optimization engine"""
    
    def __init__(self):
        self.model = None
        self._load_model()
    
    def _load_model(self):
        """Load trained model"""
        try:
            self.model = tf.keras.models.load_model("models/trained/pricing_model")
        except:
            print("Model not found. Train the model first.")
    
    def predict(self, product_id: int):
        """Get optimal pricing recommendation based on inventory and sales velocity"""
        from config.database import SessionLocal
        from api.models.database_models import Product, OrderItem, Order
        from sqlalchemy import func
        from datetime import datetime, timedelta
        
        db = SessionLocal()
        try:
            product = db.query(Product).filter(Product.id == product_id).first()
            if not product:
                return {
                    "product_id": product_id,
                    "current_price": 0.0,
                    "recommended_price": 0.0,
                    "discount_percentage": 0.0,
                    "reason": "Product not found"
                }
            
            current_price = product.sale_price or product.price
            
            # Calculate sales velocity (units sold per day in last 30 days)
            thirty_days_ago = datetime.utcnow() - timedelta(days=30)
            sales_count = db.query(func.sum(OrderItem.quantity)).join(Order).filter(
                OrderItem.product_id == product_id,
                Order.created_at >= thirty_days_ago
            ).scalar() or 0
            
            sales_velocity = sales_count / 30.0
            
            # Pricing logic
            stock_quantity = product.stock_quantity or 0
            
            # Slow-moving: low velocity, high stock
            if sales_velocity < 1 and stock_quantity > 10:
                discount_percentage = min(30.0, 15.0 + (stock_quantity / 10))
                reason = "Slow-moving inventory optimization"
            # Fast-moving: high velocity, low stock
            elif sales_velocity > 5 and stock_quantity < 5:
                discount_percentage = 0.0
                reason = "High demand - maintain price"
            # Overstocked
            elif stock_quantity > 50:
                discount_percentage = 20.0
                reason = "Overstock clearance"
            # Low stock
            elif stock_quantity < 3:
                discount_percentage = 0.0
                reason = "Low stock - premium pricing"
            # Normal
            else:
                discount_percentage = 10.0
                reason = "Standard promotional pricing"
            
            recommended_price = current_price * (1 - discount_percentage / 100)
            
            return {
                "product_id": product_id,
                "current_price": round(current_price, 2),
                "recommended_price": round(recommended_price, 2),
                "discount_percentage": round(discount_percentage, 2),
                "reason": reason,
                "metrics": {
                    "sales_velocity": round(sales_velocity, 2),
                    "stock_quantity": stock_quantity
                }
            }
        finally:
            db.close()
    
    def identify_slow_movers(self, threshold_days: int = 30):
        """Identify slow-moving products that need price optimization"""
        from config.database import SessionLocal
        from api.models.database_models import Product, OrderItem, Order
        from sqlalchemy import func
        from datetime import datetime, timedelta
        
        db = SessionLocal()
        try:
            threshold_date = datetime.utcnow() - timedelta(days=threshold_days)
            
            # Get products with sales in the period
            products_with_sales = db.query(
                Product.id,
                Product.name,
                Product.price,
                Product.stock_quantity,
                func.sum(OrderItem.quantity).label('units_sold')
            ).outerjoin(OrderItem).outerjoin(Order).filter(
                Order.created_at >= threshold_date
            ).group_by(Product.id).all()
            
            # Identify slow movers (less than 1 unit per week)
            slow_movers = []
            weeks = threshold_days / 7.0
            
            for p in products_with_sales:
                units_sold = p.units_sold or 0
                velocity = units_sold / weeks
                
                if velocity < 1 and p.stock_quantity > 5:
                    slow_movers.append({
                        "id": p.id,
                        "name": p.name,
                        "price": p.price,
                        "stock_quantity": p.stock_quantity,
                        "units_sold": units_sold,
                        "velocity": round(velocity, 2)
                    })
            
            return {
                "products": slow_movers,
                "count": len(slow_movers)
            }
        finally:
            db.close()
