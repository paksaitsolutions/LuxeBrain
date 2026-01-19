"""
Forecasting Inference Engine
Copyright © 2024 Paksa IT Solutions
"""

import tensorflow as tf
import numpy as np
from typing import Optional, List
from datetime import datetime, timedelta


class ForecastingEngine:
    """Production forecasting engine"""
    
    def __init__(self):
        self.model = None
        self._load_model()
    
    def _load_model(self):
        """Load trained model"""
        try:
            self.model = tf.keras.models.load_model("models/trained/forecasting_model")
        except:
            print("Model not found. Train the model first.")
    
    def predict(
        self,
        product_id: Optional[int] = None,
        category: Optional[str] = None,
        days_ahead: int = 30
    ):
        """Generate demand forecast using moving average and trend analysis"""
        from config.database import SessionLocal
        from api.models.database_models import Product, OrderItem, Order
        from sqlalchemy import func
        from datetime import datetime, timedelta
        
        db = SessionLocal()
        try:
            # Get historical sales data (last 90 days)
            ninety_days_ago = datetime.utcnow() - timedelta(days=90)
            
            if product_id:
                # Product-specific forecast
                daily_sales = db.query(
                    func.date(Order.created_at).label('date'),
                    func.sum(OrderItem.quantity).label('quantity')
                ).join(OrderItem).filter(
                    OrderItem.product_id == product_id,
                    Order.created_at >= ninety_days_ago
                ).group_by(func.date(Order.created_at)).all()
            elif category:
                # Category-level forecast
                daily_sales = db.query(
                    func.date(Order.created_at).label('date'),
                    func.sum(OrderItem.quantity).label('quantity')
                ).join(OrderItem).join(Product).filter(
                    Product.category == category,
                    Order.created_at >= ninety_days_ago
                ).group_by(func.date(Order.created_at)).all()
            else:
                # Overall forecast
                daily_sales = db.query(
                    func.date(Order.created_at).label('date'),
                    func.sum(OrderItem.quantity).label('quantity')
                ).join(OrderItem).filter(
                    Order.created_at >= ninety_days_ago
                ).group_by(func.date(Order.created_at)).all()
            
            # Calculate moving average and trend
            if daily_sales:
                quantities = [float(s.quantity) for s in daily_sales]
                avg_demand = np.mean(quantities)
                std_demand = np.std(quantities)
                
                # Simple trend calculation
                if len(quantities) > 1:
                    trend = (quantities[-1] - quantities[0]) / len(quantities)
                else:
                    trend = 0
            else:
                avg_demand = 0
                std_demand = 0
                trend = 0
            
            # Generate forecasts
            forecasts = []
            base_date = datetime.now()
            
            for day in range(days_ahead):
                forecast_date = base_date + timedelta(days=day)
                predicted = max(0, avg_demand + (trend * day))
                
                forecasts.append({
                    "forecast_date": forecast_date.isoformat(),
                    "predicted_demand": round(predicted, 2),
                    "confidence_interval": {
                        "lower": round(max(0, predicted - std_demand), 2),
                        "upper": round(predicted + std_demand, 2)
                    }
                })
            
            return forecasts
        finally:
            db.close()
    
    def seasonal_analysis(self, category: str):
        """Analyze seasonal trends"""
        from config.database import SessionLocal
        from api.models.database_models import Product, OrderItem, Order
        from sqlalchemy import func, extract
        from datetime import datetime, timedelta
        
        db = SessionLocal()
        try:
            # Get sales by month for the category
            one_year_ago = datetime.utcnow() - timedelta(days=365)
            
            monthly_sales = db.query(
                extract('month', Order.created_at).label('month'),
                func.sum(OrderItem.quantity).label('quantity')
            ).join(OrderItem).join(Product).filter(
                Product.category == category,
                Order.created_at >= one_year_ago
            ).group_by(extract('month', Order.created_at)).all()
            
            # Identify peak months
            if monthly_sales:
                sales_dict = {int(s.month): float(s.quantity) for s in monthly_sales}
                avg_sales = np.mean(list(sales_dict.values()))
                peak_months = [month for month, qty in sales_dict.items() if qty > avg_sales * 1.2]
            else:
                sales_dict = {}
                peak_months = []
            
            return {
                "category": category,
                "peak_seasons": peak_months,
                "trends": sales_dict
            }
        finally:
            db.close()
