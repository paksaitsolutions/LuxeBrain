import sqlite3

def upgrade():
    conn = sqlite3.connect('luxebrain.db')
    cursor = conn.cursor()
    
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS anomalies (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            anomaly_id TEXT UNIQUE NOT NULL,
            tenant_id TEXT,
            metric_name TEXT NOT NULL,
            metric_value REAL NOT NULL,
            expected_value REAL,
            severity TEXT DEFAULT 'medium',
            status TEXT DEFAULT 'open',
            is_false_positive INTEGER DEFAULT 0,
            related_anomalies TEXT,
            detected_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            resolved_at TIMESTAMP
        )
    """)
    
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_anomalies_tenant_id ON anomalies(tenant_id)")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_anomalies_status ON anomalies(status)")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_anomalies_detected_at ON anomalies(detected_at)")
    
    conn.commit()
    conn.close()
    print("Created anomalies table")

if __name__ == "__main__":
    upgrade()
