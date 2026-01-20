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
    role = Column(String)  # super_admin, admin, support, technical, sales, tenant
    tenant_id = Column(String, nullable=True, index=True)
    full_name = Column(String, nullable=True)
    phone = Column(String, nullable=True)
    avatar_url = Column(String, nullable=True)
    department = Column(String, nullable=True)  # support, technical, sales
    permissions = Column(JSON, nullable=True)  # Custom permissions array
    is_active = Column(Boolean, default=True)
    failed_login_attempts = Column(Integer, default=0)
    locked_until = Column(DateTime, nullable=True)
    email_verified = Column(Boolean, default=False)
    verification_token = Column(String, nullable=True)
    oauth_provider = Column(String, nullable=True)  # google, github
    last_login_at = Column(DateTime, nullable=True)
    last_login_ip = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    created_by = Column(Integer, nullable=True)  # User ID who created this user


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


class FeatureFlag(Base):
    __tablename__ = "feature_flags"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True)
    description = Column(Text)
    enabled = Column(Boolean, default=False)
    rollout_percentage = Column(Float, default=0.0)  # 0-100
    tenant_whitelist = Column(JSON, nullable=True)  # [tenant_id1, tenant_id2]
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class SystemLog(Base):
    __tablename__ = "system_logs"
    
    id = Column(Integer, primary_key=True, index=True)
    level = Column(String, index=True)  # INFO, WARNING, ERROR, CRITICAL
    message = Column(Text)
    module = Column(String, index=True)
    function = Column(String)
    line_number = Column(Integer)
    exception = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)


class SupportTicket(Base):
    __tablename__ = "support_tickets"
    
    id = Column(Integer, primary_key=True, index=True)
    ticket_number = Column(String, unique=True, index=True)
    tenant_id = Column(String, index=True)
    subject = Column(String)
    description = Column(Text)
    status = Column(String, default="open")  # open, in_progress, resolved, closed
    priority = Column(String, default="medium")  # low, medium, high, urgent
    assigned_to = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_by = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    resolved_at = Column(DateTime, nullable=True)


class TicketMessage(Base):
    __tablename__ = "ticket_messages"
    
    id = Column(Integer, primary_key=True, index=True)
    ticket_id = Column(Integer, ForeignKey("support_tickets.id"), index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    message = Column(Text)
    is_internal = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)


class Notification(Base):
    __tablename__ = "notifications"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), index=True)
    tenant_id = Column(String, nullable=True, index=True)
    type = Column(String, index=True)  # system, billing, anomaly, ticket
    title = Column(String)
    message = Column(Text)
    link = Column(String, nullable=True)
    read = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)


class ApiKey(Base):
    __tablename__ = "api_keys"
    
    id = Column(Integer, primary_key=True, index=True)
    key = Column(String, unique=True, index=True)
    name = Column(String)
    tenant_id = Column(String, index=True)
    scopes = Column(JSON)  # ["read", "write", "admin"]
    expires_at = Column(DateTime, nullable=True)
    last_used_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    revoked = Column(Boolean, default=False)


class RevenueRecord(Base):
    __tablename__ = "revenue_records"
    
    id = Column(Integer, primary_key=True, index=True)
    tenant_id = Column(String, index=True)
    amount = Column(Float)
    plan = Column(String)
    billing_period = Column(String)  # monthly, yearly
    stripe_invoice_id = Column(String, nullable=True)
    status = Column(String)  # paid, pending, failed
    created_at = Column(DateTime, default=datetime.utcnow, index=True)


class BackupRecord(Base):
    __tablename__ = "backup_records"
    
    id = Column(Integer, primary_key=True, index=True)
    filename = Column(String)
    size_bytes = Column(Integer)
    backup_type = Column(String)  # full, incremental
    status = Column(String)  # completed, failed, in_progress
    storage_location = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    completed_at = Column(DateTime, nullable=True)


class Role(Base):
    __tablename__ = "roles"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True)  # super_admin, admin, support, technical, sales
    display_name = Column(String)
    description = Column(Text)
    permissions = Column(JSON)  # Array of permission strings
    is_system = Column(Boolean, default=False)  # System roles can't be deleted
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class Permission(Base):
    __tablename__ = "permissions"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True)  # tenants.view, tenants.create, etc.
    category = Column(String)  # tenants, billing, analytics, system, etc.
    description = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)


class UserActivity(Base):
    __tablename__ = "user_activities"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), index=True)
    action = Column(String, index=True)  # login, logout, create_tenant, update_settings, etc.
    resource_type = Column(String, nullable=True)  # tenant, user, plan, etc.
    resource_id = Column(String, nullable=True)
    details = Column(JSON, nullable=True)
    ip_address = Column(String)
    user_agent = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)


class Plan(Base):
    __tablename__ = "plans"
    
    id = Column(Integer, primary_key=True, index=True)
    plan_id = Column(String, unique=True, index=True)  # free, starter, growth, enterprise
    name = Column(String)
    price = Column(Float)
    billing_period = Column(String, default="monthly")  # monthly, yearly
    features = Column(JSON)  # Array of feature strings
    limits = Column(JSON)  # {api_calls: 1000, products: 100, etc.}
    is_active = Column(Boolean, default=True)
    admin_only = Column(Boolean, default=False)
    sort_order = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class Tenant(Base):
    __tablename__ = "tenants"
    
    id = Column(Integer, primary_key=True, index=True)
    tenant_id = Column(String, unique=True, index=True)
    name = Column(String)
    email = Column(String, index=True)
    plan = Column(String, default="starter")
    status = Column(String, default="active")  # active, pending, suspended
    api_key = Column(String, unique=True)
    
    # Company Information
    company_name = Column(String, nullable=True)
    company_website = Column(String, nullable=True)
    company_phone = Column(String, nullable=True)
    industry = Column(String, nullable=True)
    
    # Address (stored as JSON for flexibility)
    address = Column(JSON, nullable=True)  # {line1, line2, city, state, postal_code, country}
    
    # Point of Contact (stored as JSON)
    poc = Column(JSON, nullable=True)  # {name, email, phone, title}
    
    # Tax Information (stored as JSON)
    tax_info = Column(JSON, nullable=True)  # {tax_id, vat_number}
    
    # WooCommerce Integration (stored as JSON)
    woocommerce = Column(JSON, nullable=True)  # {url, key, secret}
    
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class DemoRequest(Base):
    __tablename__ = "demo_requests"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String)
    email = Column(String, index=True)
    store_url = Column(String)
    revenue = Column(String)
    message = Column(Text, nullable=True)
    status = Column(String, default="pending")  # pending, contacted, converted, rejected
    created_at = Column(DateTime, default=datetime.utcnow, index=True)


class Coupon(Base):
    __tablename__ = "coupons"
    
    id = Column(Integer, primary_key=True, index=True)
    code = Column(String, unique=True, index=True)
    discount = Column(Float)
    type = Column(String)  # percent, fixed
    uses = Column(Integer, default=0)
    limit = Column(Integer, nullable=True)
    expires = Column(String, nullable=True)
    active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)


class Webhook(Base):
    __tablename__ = "webhooks"
    
    id = Column(Integer, primary_key=True, index=True)
    url = Column(String)
    events = Column(JSON)  # ["tenant.created", "payment.succeeded"]
    secret = Column(String)
    active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)


class EmailTemplate(Base):
    __tablename__ = "email_templates"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True)
    subject = Column(String)
    body = Column(Text)
    active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
