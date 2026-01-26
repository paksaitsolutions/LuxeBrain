"""
Add Coupon Usage Table Migration
Copyright © 2024 Paksa IT Solutions
"""

import sqlite3

def migrate():
    conn = sqlite3.connect('luxebrain.db')
    cursor = conn.cursor()
    
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS coupon_usage (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            coupon_id INTEGER NOT NULL,
            tenant_id TEXT NOT NULL,
            discount_amount REAL NOT NULL,
            used_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (coupon_id) REFERENCES coupons (id) ON DELETE CASCADE
        )
    """)
    
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_coupon_usage_coupon_id ON coupon_usage(coupon_id)")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_coupon_usage_tenant_id ON coupon_usage(tenant_id)")
    
    conn.commit()
    conn.close()
    print("Coupon usage table created successfully")

if __name__ == "__main__":
    migrate()
