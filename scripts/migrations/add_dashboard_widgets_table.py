"""
Add Dashboard Widgets Table Migration
Copyright © 2024 Paksa IT Solutions
"""

import sqlite3
from datetime import datetime

def migrate():
    conn = sqlite3.connect('luxebrain.db')
    cursor = conn.cursor()
    
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS dashboard_widgets (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            widget_type TEXT NOT NULL,
            position INTEGER NOT NULL,
            size TEXT DEFAULT 'medium',
            refresh_interval INTEGER DEFAULT 300,
            config TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
        )
    """)
    
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_dashboard_widgets_user_id ON dashboard_widgets(user_id)")
    
    conn.commit()
    conn.close()
    print("Dashboard widgets table created successfully")

if __name__ == "__main__":
    migrate()
