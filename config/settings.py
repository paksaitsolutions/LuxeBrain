"""
Configuration Settings
Copyright © 2024 Paksa IT Solutions
"""

from pydantic_settings import BaseSettings
from typing import Optional
import logging

logger = logging.getLogger(__name__)


class Settings(BaseSettings):
    """Application settings"""
    
    # Application
    APP_NAME: str = "LuxeBrain AI"
    APP_ENV: str = "development"
    DEBUG: bool = True
    SECRET_KEY: str
    
    # API
    API_HOST: str = "0.0.0.0"
    API_PORT: int = 8000
    API_WORKERS: int = 4
    
    # WooCommerce
    WOOCOMMERCE_URL: str
    WOOCOMMERCE_CONSUMER_KEY: str
    WOOCOMMERCE_CONSUMER_SECRET: str
    
    # Database
    DATABASE_URL: str
    DATABASE_POOL_SIZE: int = 20
    
    # Redis
    REDIS_URL: str
    REDIS_CACHE_TTL: int = 3600
    
    # Celery
    CELERY_BROKER_URL: str
    CELERY_RESULT_BACKEND: str
    
    # AWS/S3
    AWS_ACCESS_KEY_ID: Optional[str] = None
    AWS_SECRET_ACCESS_KEY: Optional[str] = None
    AWS_REGION: str = "us-east-1"
    S3_BUCKET_NAME: Optional[str] = None
    
    # MLflow
    MLFLOW_TRACKING_URI: str = "http://localhost:5000"
    MLFLOW_EXPERIMENT_NAME: str = "luxebrain-models"
    
    # Models
    MODEL_RETRAIN_INTERVAL_DAYS: int = 7
    MIN_TRAINING_SAMPLES: int = 1000
    
    # Email
    SMTP_HOST: Optional[str] = None
    SMTP_PORT: int = 587
    SMTP_USER: Optional[str] = None
    SMTP_PASSWORD: Optional[str] = None
    SENDGRID_API_KEY: Optional[str] = None
    
    # WhatsApp
    WHATSAPP_API_URL: Optional[str] = None
    WHATSAPP_API_TOKEN: Optional[str] = None
    
    # Security
    JWT_SECRET_KEY: str
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRATION_MINUTES: int = 60
    
    # Stripe
    STRIPE_SECRET_KEY: Optional[str] = None
    STRIPE_WEBHOOK_SECRET: Optional[str] = None
    STRIPE_PUBLISHABLE_KEY: Optional[str] = None
    
    # OAuth
    GOOGLE_CLIENT_ID: Optional[str] = None
    GOOGLE_CLIENT_SECRET: Optional[str] = None
    GITHUB_CLIENT_ID: Optional[str] = None
    GITHUB_CLIENT_SECRET: Optional[str] = None
    OAUTH_REDIRECT_URI: str = "http://localhost:8000/api/v1/auth/oauth/callback"
    
    # Rate Limiting
    RATE_LIMIT_PER_MINUTE: int = 60
    
    class Config:
        env_file = ".env"
        case_sensitive = True
        extra = "allow"


settings = Settings()

# Apply environment-specific overrides
from config.environments import env_config
for key, value in env_config.items():
    if hasattr(settings, key):
        setattr(settings, key, value)


def validate_required_keys():
    """Validate required API keys on startup"""
    errors = []
    
    # Stripe validation (production only)
    if settings.APP_ENV == "production":
        if not settings.STRIPE_SECRET_KEY:
            errors.append("STRIPE_SECRET_KEY is required in production")
        if not settings.STRIPE_WEBHOOK_SECRET:
            errors.append("STRIPE_WEBHOOK_SECRET is required in production")
    
    # Email service validation
    has_sendgrid = bool(settings.SENDGRID_API_KEY)
    has_smtp = all([settings.SMTP_HOST, settings.SMTP_USER, settings.SMTP_PASSWORD])
    
    if not has_sendgrid and not has_smtp:
        logger.warning("⚠️ No email service configured (SENDGRID_API_KEY or SMTP settings)")
    
    if errors:
        error_msg = "\n".join([f"  - {e}" for e in errors])
        raise ValueError(f"Configuration validation failed:\n{error_msg}")
    
    logger.info(f"✅ Configuration validation passed (ENV: {settings.APP_ENV})")


# Run validation on import
validate_required_keys()
