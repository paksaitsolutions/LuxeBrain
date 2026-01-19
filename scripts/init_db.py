"""
Database Initialization Script
Copyright © 2024 Paksa IT Solutions
"""

from config.database import engine, Base
from api.models.database_models import (
    Customer, Product, Order, OrderItem,
    UserInteraction, Recommendation, Forecast,
    PricingRecommendation, ModelMetrics
)


def init_database():
    """Initialize database tables"""
    print("Creating database tables...")
    Base.metadata.create_all(bind=engine)
    print("✓ Database tables created successfully")


if __name__ == "__main__":
    init_database()
