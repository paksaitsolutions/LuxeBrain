"""
Add admin_invitations table
Copyright © 2024 Paksa IT Solutions
"""

import sqlite3
from datetime import datetime

def migrate():
    conn = sqlite3.connect('luxebrain.db')
    cursor = conn.cursor()
    
    # Create admin_invitations table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS admin_invitations (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email TEXT NOT NULL,
            role TEXT NOT NULL,
            token TEXT NOT NULL UNIQUE,
            status TEXT DEFAULT 'pending',
            invited_by INTEGER,
            expires_at TIMESTAMP NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            accepted_at TIMESTAMP,
            FOREIGN KEY (invited_by) REFERENCES users(id)
        )
    """)
    
    conn.commit()
    conn.close()
    print("✅ admin_invitations table created")

if __name__ == "__main__":
    migrate()
