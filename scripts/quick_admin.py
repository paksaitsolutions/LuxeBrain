"""
Quick Admin User Creation
Copyright © 2024 Paksa IT Solutions
"""

import sqlite3
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

conn = sqlite3.connect('luxebrain.db')
cursor = conn.cursor()

# Delete existing admin
cursor.execute("DELETE FROM users WHERE email = 'admin@luxebrain.ai'")

# Create new admin with pre-hashed password
password_hash = pwd_context.hash("Zafar@1980")

cursor.execute("""
    INSERT INTO users (email, password_hash, role, tenant_id, email_verified, failed_login_attempts, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
""", ('admin@luxebrain.ai', password_hash, 'admin', None, 1, 0))

conn.commit()
conn.close()

print("✅ Admin user created: admin@luxebrain.ai / Zafar@1980")
