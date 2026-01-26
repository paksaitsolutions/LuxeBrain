"""
Add System Settings Table Migration
Copyright © 2024 Paksa IT Solutions
"""

import sqlite3
from datetime import datetime

def migrate():
    conn = sqlite3.connect('luxebrain.db')
    cursor = conn.cursor()
    
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS system_settings (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            key TEXT UNIQUE NOT NULL,
            value TEXT,
            category TEXT NOT NULL,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_by INTEGER,
            FOREIGN KEY (updated_by) REFERENCES users (id)
        )
    """)
    
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_system_settings_key ON system_settings(key)")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_system_settings_category ON system_settings(category)")
    
    # Insert default settings
    defaults = [
        ('company_name', 'LuxeBrain AI', 'general'),
        ('support_email', 'support@luxebrain.ai', 'general'),
        ('support_phone', '+1-555-0100', 'general'),
        ('timezone', 'UTC', 'general'),
        ('logo_url', '', 'general'),
    ]
    
    for key, value, category in defaults:
        cursor.execute(
            "INSERT OR IGNORE INTO system_settings (key, value, category) VALUES (?, ?, ?)",
            (key, value, category)
        )
    
    conn.commit()
    conn.close()
    print("System settings table created successfully")

if __name__ == "__main__":
    migrate()
