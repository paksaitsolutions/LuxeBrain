import sys
import os
import sqlite3

def upgrade():
    conn = sqlite3.connect('luxebrain.db')
    cursor = conn.cursor()
    
    try:
        cursor.execute("ALTER TABLE coupons ADD COLUMN restrictions TEXT DEFAULT '{}'")
    except sqlite3.OperationalError:
        pass
    
    try:
        cursor.execute("ALTER TABLE coupons ADD COLUMN is_stackable INTEGER DEFAULT 0")
    except sqlite3.OperationalError:
        pass
    
    try:
        cursor.execute("ALTER TABLE coupons ADD COLUMN auto_apply INTEGER DEFAULT 0")
    except sqlite3.OperationalError:
        pass
    
    conn.commit()
    conn.close()
    print("Added coupon restrictions columns")

if __name__ == "__main__":
    upgrade()
