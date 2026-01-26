import sqlite3

def upgrade():
    conn = sqlite3.connect('luxebrain.db')
    cursor = conn.cursor()
    
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS batch_jobs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            job_id TEXT UNIQUE NOT NULL,
            job_type TEXT NOT NULL,
            status TEXT DEFAULT 'pending',
            progress INTEGER DEFAULT 0,
            total INTEGER DEFAULT 0,
            tenant_id TEXT,
            created_by INTEGER,
            error_message TEXT,
            logs TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            started_at TIMESTAMP,
            completed_at TIMESTAMP
        )
    """)
    
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_batch_jobs_status ON batch_jobs(status)")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_batch_jobs_tenant_id ON batch_jobs(tenant_id)")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_batch_jobs_created_at ON batch_jobs(created_at)")
    
    conn.commit()
    conn.close()
    print("Created batch_jobs table")

if __name__ == "__main__":
    upgrade()
