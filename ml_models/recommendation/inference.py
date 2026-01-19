"""
Recommendation Engine - Inference
Copyright © 2024 Paksa IT Solutions
"""

import tensorflow as tf
import numpy as np
from typing import List, Optional
import redis
import json
from api.utils.usage_tracker import UsageTracker
from ml_models.model_version_manager import ModelVersionManager
from ml_models.tenant_model_isolation import TenantModelIsolation


class RecommendationEngine:
    """Production inference engine for recommendations"""
    
    def __init__(self):
        self.model = None
        self.redis_client = redis.from_url("redis://localhost:6379/0")
        self.version_manager = ModelVersionManager("recommendation")
        self.isolation = TenantModelIsolation("recommendation")
        self._load_model()
    
    def _load_model(self, user_id: Optional[str] = None, tenant_id: Optional[str] = None):
        """Load trained model (version-aware and tenant-isolated)"""
        try:
            # Check for tenant-specific model
            if tenant_id:
                tenant_model = self.isolation.get_model_path(tenant_id)
                if tenant_model:
                    self.model = tf.keras.models.load_model(tenant_model)
                    return
            
            # Use version manager for shared model
            model_path = self.version_manager.get_active_version(user_id)
            if model_path:
                self.model = tf.keras.models.load_model(model_path)
            else:
                # Fallback to default
                self.model = tf.keras.models.load_model("models/trained/recommendation_model")
        except:
            print("Model not found. Train the model first.")
    
    def predict(
        self,
        customer_id: Optional[int],
        session_id: Optional[str],
        limit: int = 10,
        recommendation_type: str = "personalized",
        tenant_id: Optional[str] = None
    ):
        """Generate recommendations"""
        
        # Track ML inference
        if tenant_id:
            UsageTracker.track_ml_inference(tenant_id, "recommendation")
        
        # Cold-start detection: check if tenant has enough data
        if tenant_id and self._is_cold_start(tenant_id):
            return self._popular_products(limit)
        
        # Check cache first
        cache_key = f"rec:{customer_id}:{recommendation_type}"
        cached = self.redis_client.get(cache_key)
        if cached:
            return json.loads(cached)
        
        # Generate recommendations
        if recommendation_type == "personalized" and customer_id:
            recommendations = self._personalized_recommendations(customer_id, limit)
        elif recommendation_type == "trending":
            recommendations = self._trending_products(limit)
        else:
            recommendations = self._popular_products(limit)
        
        # Cache results
        self.redis_client.setex(cache_key, 3600, json.dumps(recommendations))
        
        return recommendations
    
    def _personalized_recommendations(self, customer_id: int, limit: int):
        """Generate personalized recommendations using collaborative filtering"""
        from config.database import SessionLocal
        from api.models.database_models import Customer, Order, OrderItem, Product
        from sqlalchemy import func
        
        db = SessionLocal()
        try:
            # Get customer's purchase history
            customer_products = db.query(Product.id).join(OrderItem).join(Order).filter(
                Order.customer_id == customer_id
            ).distinct().all()
            customer_product_ids = [p.id for p in customer_products]
            
            if not customer_product_ids:
                return self._popular_products(limit)
            
            # Find similar customers (who bought same products)
            similar_customers = db.query(Order.customer_id).join(OrderItem).filter(
                OrderItem.product_id.in_(customer_product_ids),
                Order.customer_id != customer_id
            ).group_by(Order.customer_id).having(func.count(OrderItem.id) >= 2).limit(50).all()
            
            similar_customer_ids = [c.customer_id for c in similar_customers]
            
            if not similar_customer_ids:
                return self._trending_products(limit)
            
            # Get products bought by similar customers but not by target customer
            recommendations = db.query(
                Product.id,
                Product.name,
                Product.price,
                Product.image_url,
                func.count(OrderItem.id).label('score')
            ).join(OrderItem).join(Order).filter(
                Order.customer_id.in_(similar_customer_ids),
                Product.id.notin_(customer_product_ids)
            ).group_by(Product.id).order_by(func.count(OrderItem.id).desc()).limit(limit).all()
            
            return {
                "products": [{
                    "id": r.id,
                    "name": r.name,
                    "price": r.price,
                    "image_url": r.image_url
                } for r in recommendations],
                "scores": [float(r.score) for r in recommendations],
                "recommendation_type": "personalized"
            }
        finally:
            db.close()
    
    def cross_sell(self, product_id: int, limit: int = 5):
        """Cross-sell recommendations - products frequently bought together"""
        from config.database import SessionLocal
        from api.models.database_models import Product, OrderItem
        from sqlalchemy import func
        
        db = SessionLocal()
        try:
            # Find products bought together with target product
            cross_sell_products = db.query(
                Product.id,
                Product.name,
                Product.price,
                Product.image_url,
                func.count(OrderItem.order_id).label('frequency')
            ).join(OrderItem, Product.id == OrderItem.product_id).filter(
                OrderItem.order_id.in_(
                    db.query(OrderItem.order_id).filter(OrderItem.product_id == product_id)
                ),
                Product.id != product_id
            ).group_by(Product.id).order_by(func.count(OrderItem.order_id).desc()).limit(limit).all()
            
            return {
                "products": [{
                    "id": p.id,
                    "name": p.name,
                    "price": p.price,
                    "image_url": p.image_url
                } for p in cross_sell_products],
                "scores": [float(p.frequency) for p in cross_sell_products]
            }
        finally:
            db.close()
    
    def outfit_match(self, product_id: int, limit: int = 3):
        """Outfit matching recommendations - complementary items from different categories"""
        from config.database import SessionLocal
        from api.models.database_models import Product
        
        db = SessionLocal()
        try:
            # Get target product category
            target_product = db.query(Product).filter(Product.id == product_id).first()
            if not target_product:
                return {"products": [], "scores": []}
            
            # Find complementary products from different categories
            complementary = db.query(Product).filter(
                Product.category != target_product.category,
                Product.stock_quantity > 0
            ).order_by(Product.id.desc()).limit(limit).all()
            
            return {
                "products": [{
                    "id": p.id,
                    "name": p.name,
                    "price": p.price,
                    "image_url": p.image_url,
                    "category": p.category
                } for p in complementary],
                "scores": [1.0] * len(complementary)
            }
        finally:
            db.close()
    
    def _trending_products(self, limit: int):
        """Get trending products based on recent sales"""
        from config.database import SessionLocal
        from api.models.database_models import Product, OrderItem, Order
        from sqlalchemy import func
        from datetime import datetime, timedelta
        
        db = SessionLocal()
        try:
            # Get products with most sales in last 30 days
            thirty_days_ago = datetime.utcnow() - timedelta(days=30)
            trending = db.query(
                Product.id,
                Product.name,
                Product.price,
                Product.image_url,
                func.count(OrderItem.id).label('sales_count')
            ).join(OrderItem).join(Order).filter(
                Order.created_at >= thirty_days_ago
            ).group_by(Product.id).order_by(func.count(OrderItem.id).desc()).limit(limit).all()
            
            return {
                "products": [{
                    "id": p.id,
                    "name": p.name,
                    "price": p.price,
                    "image_url": p.image_url
                } for p in trending],
                "scores": [float(p.sales_count) for p in trending]
            }
        finally:
            db.close()
    
    def _popular_products(self, limit: int):
        """Get popular products based on total sales"""
        from config.database import SessionLocal
        from api.models.database_models import Product, OrderItem
        from sqlalchemy import func
        
        db = SessionLocal()
        try:
            popular = db.query(
                Product.id,
                Product.name,
                Product.price,
                Product.image_url,
                func.count(OrderItem.id).label('total_sales')
            ).join(OrderItem).group_by(Product.id).order_by(
                func.count(OrderItem.id).desc()
            ).limit(limit).all()
            
            return {
                "products": [{
                    "id": p.id,
                    "name": p.name,
                    "price": p.price,
                    "image_url": p.image_url
                } for p in popular],
                "scores": [float(p.total_sales) for p in popular]
            }
        finally:
            db.close()
    
    def invalidate_cache(self, customer_id: Optional[int] = None):
        """Invalidate recommendation cache"""
        if customer_id:
            self.redis_client.delete(f"rec:{customer_id}:personalized")
            self.redis_client.delete(f"rec:{customer_id}:trending")
        else:
            # Invalidate all caches
            for key in self.redis_client.scan_iter("rec:*"):
                self.redis_client.delete(key)
    
    def _is_cold_start(self, tenant_id: str, min_orders: int = 10) -> bool:
        """Detect if tenant is in cold-start phase (insufficient data)"""
        from config.database import SessionLocal
        from api.models.database_models import Order, Tenant
        from sqlalchemy import func
        
        # Check cache first
        cache_key = f"coldstart:{tenant_id}"
        cached = self.redis_client.get(cache_key)
        if cached:
            return cached.decode() == "1"
        
        db = SessionLocal()
        try:
            # Get tenant and order count
            tenant = db.query(Tenant).filter(Tenant.id == tenant_id).first()
            if not tenant:
                return True
            
            order_count = db.query(func.count(Order.id)).filter(
                Order.tenant_id == tenant_id
            ).scalar()
            
            is_cold = order_count < min_orders
            
            # Cache result for 1 hour
            self.redis_client.setex(cache_key, 3600, "1" if is_cold else "0")
            
            return is_cold
        finally:
            db.close()
