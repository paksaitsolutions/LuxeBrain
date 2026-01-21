"""
Add webhook_logs table
Copyright © 2024 Paksa IT Solutions
"""

import sqlite3

def migrate():
    conn = sqlite3.connect('luxebrain.db')
    cursor = conn.cursor()
    
    # Create webhook_logs table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS webhook_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            webhook_id INTEGER NOT NULL,
            event TEXT NOT NULL,
            status_code INTEGER,
            response_body TEXT,
            duration_ms REAL,
            retry_count INTEGER DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (webhook_id) REFERENCES webhooks(id) ON DELETE CASCADE
        )
    """)
    
    conn.commit()
    conn.close()
    print("webhook_logs table created")

if __name__ == "__main__":
    migrate()
