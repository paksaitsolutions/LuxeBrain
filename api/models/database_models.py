"""
Database Models
Copyright © 2024 Paksa IT Solutions
"""

from sqlalchemy import Column, Integer, String, Float, DateTime, Boolean, JSON, ForeignKey, Text
from sqlalchemy.orm import relationship
from datetime import datetime
from config.database import Base


class Customer(Base):
    __tablename__ = "customers"
    
    id = Column(Integer, primary_key=True, index=True)
    woocommerce_id = Column(Integer, unique=True, index=True)
    email = Column(String, unique=True, index=True)
    first_name = Column(String)
    last_name = Column(String)
    total_spent = Column(Float, default=0.0)
    order_count = Column(Integer, default=0)
    segment = Column(String, nullable=True)
    lifetime_value = Column(Float, default=0.0)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    orders = relationship("Order", back_populates="customer")
    interactions = relationship("UserInteraction", back_populates="customer")


class Product(Base):
    __tablename__ = "products"
    
    id = Column(Integer, primary_key=True, index=True)
    woocommerce_id = Column(Integer, unique=True, index=True)
    name = Column(String)
    sku = Column(String, unique=True, index=True)
    price = Column(Float)
    sale_price = Column(Float, nullable=True)
    category = Column(String)
    stock_quantity = Column(Integer, default=0)
    image_url = Column(String, nullable=True)
    attributes = Column(JSON, nullable=True)  # size, color, etc.
    embedding = Column(JSON, nullable=True)  # visual embedding
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    order_items = relationship("OrderItem", back_populates="product")


class Order(Base):
    __tablename__ = "orders"
    
    id = Column(Integer, primary_key=True, index=True)
    woocommerce_id = Column(Integer, unique=True, index=True)
    customer_id = Column(Integer, ForeignKey("customers.id"))
    total = Column(Float)
    status = Column(String)
    payment_method = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    customer = relationship("Customer", back_populates="orders")
    items = relationship("OrderItem", back_populates="order")


class OrderItem(Base):
    __tablename__ = "order_items"
    
    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.id"))
    product_id = Column(Integer, ForeignKey("products.id"))
    quantity = Column(Integer)
    price = Column(Float)
    
    order = relationship("Order", back_populates="items")
    product = relationship("Product", back_populates="order_items")


class UserInteraction(Base):
    __tablename__ = "user_interactions"
    
    id = Column(Integer, primary_key=True, index=True)
    customer_id = Column(Integer, ForeignKey("customers.id"), nullable=True)
    session_id = Column(String, index=True)
    event_type = Column(String)  # view, click, add_to_cart, search
    product_id = Column(Integer, nullable=True)
    event_metadata = Column(JSON, nullable=True)
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)
    
    customer = relationship("Customer", back_populates="interactions")


class Recommendation(Base):
    __tablename__ = "recommendations"
    
    id = Column(Integer, primary_key=True, index=True)
    customer_id = Column(Integer, ForeignKey("customers.id"))
    product_id = Column(Integer, ForeignKey("products.id"))
    score = Column(Float)
    recommendation_type = Column(String)  # personalized, cross_sell, outfit
    created_at = Column(DateTime, default=datetime.utcnow)


class Forecast(Base):
    __tablename__ = "forecasts"
    
    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=True)
    category = Column(String, nullable=True)
    forecast_date = Column(DateTime)
    predicted_demand = Column(Float)
    confidence_interval_lower = Column(Float)
    confidence_interval_upper = Column(Float)
    created_at = Column(DateTime, default=datetime.utcnow)


class PricingRecommendation(Base):
    __tablename__ = "pricing_recommendations"
    
    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey("products.id"))
    current_price = Column(Float)
    recommended_price = Column(Float)
    discount_percentage = Column(Float)
    reason = Column(String)
    applied = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)


class ModelMetrics(Base):
    __tablename__ = "model_metrics"
    
    id = Column(Integer, primary_key=True, index=True)
    model_name = Column(String, index=True)
    model_version = Column(String)
    metric_name = Column(String)
    metric_value = Column(Float)
    timestamp = Column(DateTime, default=datetime.utcnow)
