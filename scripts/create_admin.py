"""
Create Admin User
Copyright © 2024 Paksa IT Solutions
"""

from config.database import SessionLocal
from api.models.database_models import User, PasswordHistory
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

db = SessionLocal()

# Check if admin exists
admin = db.query(User).filter(User.email == "admin@luxebrain.ai").first()

if admin:
    print("Admin already exists")
else:
    # Create admin
    admin = User(
        email="admin@luxebrain.ai",
        password_hash=pwd_context.hash("Zafar@1980"),
        role="admin",
        tenant_id=None,
        email_verified=True
    )
    db.add(admin)
    db.commit()
    db.refresh(admin)
    
    # Add to password history
    pwd_history = PasswordHistory(user_id=admin.id, password_hash=admin.password_hash)
    db.add(pwd_history)
    db.commit()
    
    print(f"Admin created: {admin.email}")

db.close()
