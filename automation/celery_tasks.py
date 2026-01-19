"""
Celery Tasks Configuration
Copyright © 2024 Paksa IT Solutions
"""

from celery import Celery
from config.settings import settings

celery_app = Celery(
    'luxebrain',
    broker=settings.CELERY_BROKER_URL,
    backend=settings.CELERY_RESULT_BACKEND
)

celery_app.conf.update(
    task_serializer='json',
    accept_content=['json'],
    result_serializer='json',
    timezone='UTC',
    enable_utc=True,
)


@celery_app.task
def train_recommendation_model():
    """Background task to train recommendation model"""
    from ml_models.recommendation.train import RecommendationModel
    print("Training recommendation model...")
    # Training logic here
    return {"status": "completed"}


@celery_app.task
def train_forecasting_model():
    """Background task to train forecasting model"""
    from ml_models.forecasting.train import ForecastingModel
    print("Training forecasting model...")
    return {"status": "completed"}


@celery_app.task
def send_abandoned_cart_email(customer_id: int, cart_items: list):
    """Send abandoned cart recovery email"""
    print(f"Sending abandoned cart email to customer {customer_id}")
    # Email sending logic
    return {"status": "sent"}


@celery_app.task
def sync_woocommerce_data():
    """Sync data from WooCommerce"""
    from data_pipeline.sync_woocommerce import WooCommerceSync
    from config.database import SessionLocal
    
    db = SessionLocal()
    sync = WooCommerceSync()
    
    try:
        customers = sync.sync_customers(db)
        products = sync.sync_products(db)
        orders = sync.sync_orders(db)
        
        return {
            "customers": customers,
            "products": products,
            "orders": orders
        }
    finally:
        db.close()


if __name__ == '__main__':
    celery_app.start()
