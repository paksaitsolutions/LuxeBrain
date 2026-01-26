import sqlite3

def upgrade():
    conn = sqlite3.connect('luxebrain.db')
    cursor = conn.cursor()
    
    try:
        cursor.execute("ALTER TABLE api_logs ADD COLUMN api_key_id INTEGER")
    except sqlite3.OperationalError:
        pass
    
    try:
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_api_logs_api_key_id ON api_logs(api_key_id)")
    except sqlite3.OperationalError:
        pass
    
    conn.commit()
    conn.close()
    print("Added api_key_id column to api_logs table")

if __name__ == "__main__":
    upgrade()
