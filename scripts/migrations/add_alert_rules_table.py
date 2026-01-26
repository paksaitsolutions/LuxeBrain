import sqlite3

def upgrade():
    conn = sqlite3.connect('luxebrain.db')
    cursor = conn.cursor()
    
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS alert_rules (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            rule_name TEXT NOT NULL,
            metric_name TEXT NOT NULL,
            threshold_value REAL NOT NULL,
            condition TEXT NOT NULL,
            severity TEXT DEFAULT 'medium',
            channels TEXT NOT NULL,
            is_active INTEGER DEFAULT 1,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)
    
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_alert_rules_metric ON alert_rules(metric_name)")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_alert_rules_active ON alert_rules(is_active)")
    
    conn.commit()
    conn.close()
    print("Created alert_rules table")

if __name__ == "__main__":
    upgrade()
