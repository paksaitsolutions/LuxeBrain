"""
Update Admin Password
Copyright © 2024 Paksa IT Solutions
"""

from config.database import SessionLocal
from api.models.database_models import User, PasswordHistory
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def update_admin_password():
    db = SessionLocal()
    
    try:
        # Find admin user
        admin = db.query(User).filter(User.role == "admin").first()
        
        if not admin:
            print("❌ Admin user not found!")
            return
        
        # New password
        new_password = "Zafar@1980"
        
        # Hash the new password
        new_hash = pwd_context.hash(new_password)
        
        # Update password
        admin.password_hash = new_hash
        admin.email_verified = True
        admin.failed_login_attempts = 0
        admin.locked_until = None
        
        # Add to password history
        pwd_history = PasswordHistory(
            user_id=admin.id,
            password_hash=new_hash
        )
        db.add(pwd_history)
        
        db.commit()
        
        print("✅ Admin password updated successfully!")
        print(f"📧 Email: {admin.email}")
        print(f"🔑 Password: {new_password}")
        print(f"🌐 Login at: http://localhost:3001/login")
        
    except Exception as e:
        print(f"❌ Error: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    update_admin_password()
