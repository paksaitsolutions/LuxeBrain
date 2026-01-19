"""
Seed Data Script
Copyright © 2024 Paksa IT Solutions
"""

from sqlalchemy.orm import Session
from config.database import SessionLocal, engine, Base
from api.models.database_models import User, Customer, Product, Order, OrderItem, ModelVersion
from passlib.context import CryptContext
from datetime import datetime, timedelta
import random

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def seed_data():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    
    try:
        # Create admin user
        admin = User(
            email="admin@luxebrain.ai",
            password_hash=pwd_context.hash("admin123"),
            role="admin",
            tenant_id=None,
            email_verified=True
        )
        db.add(admin)
        
        # Create demo tenant
        tenant = User(
            email="demo@store.com",
            password_hash=pwd_context.hash("demo123"),
            role="tenant",
            tenant_id="tenant-001",
            email_verified=True
        )
        db.add(tenant)
        
        # Create products
        products = []
        categories = ["Dresses", "Tops", "Bottoms", "Shoes", "Accessories"]
        for i in range(50):
            product = Product(
                woocommerce_id=1000 + i,
                name=f"Product {i+1}",
                sku=f"SKU-{i+1:03d}",
                price=random.uniform(20, 200),
                category=random.choice(categories),
                stock_quantity=random.randint(0, 100)
            )
            products.append(product)
            db.add(product)
        
        db.commit()
        
        # Create customers
        customers = []
        for i in range(20):
            customer = Customer(
                woocommerce_id=2000 + i,
                email=f"customer{i+1}@example.com",
                first_name=f"Customer",
                last_name=f"{i+1}",
                total_spent=random.uniform(100, 5000),
                order_count=random.randint(1, 50)
            )
            customers.append(customer)
            db.add(customer)
        
        db.commit()
        
        # Create orders
        for i in range(100):
            customer = random.choice(customers)
            order = Order(
                woocommerce_id=3000 + i,
                customer_id=customer.id,
                total=random.uniform(50, 500),
                status="completed",
                created_at=datetime.utcnow() - timedelta(days=random.randint(0, 365))
            )
            db.add(order)
            db.commit()
            
            # Add order items
            num_items = random.randint(1, 5)
            for _ in range(num_items):
                product = random.choice(products)
                item = OrderItem(
                    order_id=order.id,
                    product_id=product.id,
                    quantity=random.randint(1, 3),
                    price=product.price
                )
                db.add(item)
        
        db.commit()
        
        # Create model versions
        models = ["recommendation", "forecasting", "segmentation", "pricing"]
        for model_name in models:
            version = ModelVersion(
                model_name=model_name,
                version="1.0.0",
                file_path=f"models/trained/{model_name}_v1.pkl",
                is_active=True,
                performance_score=random.uniform(0.7, 0.95)
            )
            db.add(version)
        
        db.commit()
        
        print("✅ Seed data created successfully!")
        print(f"   - 2 users (admin, tenant)")
        print(f"   - 50 products")
        print(f"   - 20 customers")
        print(f"   - 100 orders")
        print(f"   - 4 model versions")
        
    except Exception as e:
        print(f"❌ Error seeding data: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed_data()
