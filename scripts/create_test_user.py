"""
Create Test User
Copyright © 2024 Paksa IT Solutions
"""

from config.database import SessionLocal
from api.models.database_models import User
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

db = SessionLocal()

# Check if user exists
existing = db.query(User).filter(User.email == "test@example.com").first()

if existing:
    print("Test user already exists")
else:
    user = User(
        email="test@example.com",
        password_hash=pwd_context.hash("password123"),
        role="tenant",
        tenant_id="tenant-001",
        email_verified=True
    )
    db.add(user)
    db.commit()
    print("Test user created: test@example.com / password123")

db.close()
