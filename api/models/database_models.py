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


class ModelVersion(Base):
    __tablename__ = "model_versions"
    
    id = Column(Integer, primary_key=True, index=True)
    model_name = Column(String, index=True)
    version = Column(String, index=True)
    file_path = Column(String)
    is_active = Column(Boolean, default=False)
    ab_test_percentage = Column(Float, default=0.0)  # 0-100
    performance_score = Column(Float, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    deployed_at = Column(DateTime, nullable=True)
    model_metadata = Column(JSON, nullable=True)


class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    password_hash = Column(String)
    role = Column(String)  # admin, tenant
    tenant_id = Column(String, nullable=True, index=True)
    failed_login_attempts = Column(Integer, default=0)
    locked_until = Column(DateTime, nullable=True)
    email_verified = Column(Boolean, default=False)
    verification_token = Column(String, nullable=True)
    oauth_provider = Column(String, nullable=True)  # google, github
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class PasswordHistory(Base):
    __tablename__ = "password_history"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), index=True)
    password_hash = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)


class LoginAttempt(Base):
    __tablename__ = "login_attempts"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, index=True)
    ip_address = Column(String)
    user_agent = Column(String, nullable=True)
    success = Column(Boolean)
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)


class SecurityAuditLog(Base):
    __tablename__ = "security_audit_log"
    
    id = Column(Integer, primary_key=True, index=True)
    event_type = Column(String, index=True)  # login, logout, password_change, permission_change
    user_id = Column(Integer, nullable=True)
    tenant_id = Column(String, nullable=True, index=True)
    ip_address = Column(String)
    details = Column(JSON, nullable=True)
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)


class UndoAction(Base):
    __tablename__ = "undo_actions"
    
    id = Column(Integer, primary_key=True, index=True)
    undo_id = Column(String, unique=True, index=True)
    action_type = Column(String, index=True)
    data = Column(JSON)
    tenant_id = Column(String, index=True)
    user_id = Column(Integer, nullable=True)
    executed = Column(Boolean, default=False)
    expires_at = Column(DateTime, index=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    executed_at = Column(DateTime, nullable=True)


class BotDetection(Base):
    __tablename__ = "bot_detections"
    
    id = Column(Integer, primary_key=True, index=True)
    ip_address = Column(String, index=True)
    user_agent = Column(Text)
    endpoint = Column(String)
    reason = Column(String)  # bot_pattern, flooding, suspicious
    request_count = Column(Integer)
    blocked_until = Column(DateTime)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)


class HoneypotDetection(Base):
    __tablename__ = "honeypot_detections"
    
    id = Column(Integer, primary_key=True, index=True)
    ip_address = Column(String, index=True)
    user_agent = Column(Text)
    email = Column(String)
    honeypot_value = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)


class RateLimitLog(Base):
    __tablename__ = "rate_limit_logs"
    
    id = Column(Integer, primary_key=True, index=True)
    ip_address = Column(String, index=True)
    user_agent = Column(Text)
    endpoint = Column(String)
    request_count = Column(Integer)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)


class ApiLog(Base):
    __tablename__ = "api_logs"
    
    id = Column(Integer, primary_key=True, index=True)
    method = Column(String, index=True)
    endpoint = Column(String, index=True)
    status_code = Column(Integer, index=True)
    response_time = Column(Float)
    tenant_id = Column(String, nullable=True, index=True)
    user_id = Column(String, nullable=True)
    ip_address = Column(String)
    user_agent = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)


class SlowQueryLog(Base):
    __tablename__ = "slow_query_logs"
    
    id = Column(Integer, primary_key=True, index=True)
    method = Column(String)
    endpoint = Column(String, index=True)
    duration = Column(Float, index=True)
    tenant_id = Column(String, nullable=True, index=True)
    query_params = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)


class DeprecatedApiLog(Base):
    __tablename__ = "deprecated_api_logs"
    
    id = Column(Integer, primary_key=True, index=True)
    endpoint = Column(String, index=True)
    method = Column(String)
    tenant_id = Column(String, nullable=True, index=True)
    sunset_date = Column(String)
    replacement = Column(String)
    ip_address = Column(String)
    user_agent = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)


class ModelIsolationRequest(Base):
    __tablename__ = "model_isolation_requests"
    
    id = Column(Integer, primary_key=True, index=True)
    tenant_id = Column(String, index=True)
    model_name = Column(String)
    status = Column(String, default="pending")  # pending, approved, rejected
    reason = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    reviewed_at = Column(DateTime, nullable=True)
    reviewed_by = Column(Integer, nullable=True)


class AnomalyResolution(Base):
    __tablename__ = "anomaly_resolutions"
    
    id = Column(Integer, primary_key=True, index=True)
    anomaly_id = Column(String, index=True)
    status = Column(String)  # resolved, ignored
    notes = Column(Text, nullable=True)
    resolved_at = Column(DateTime, default=datetime.utcnow)
    resolved_by = Column(Integer, nullable=True)
