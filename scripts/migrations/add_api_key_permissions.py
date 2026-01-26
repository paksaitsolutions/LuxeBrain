import sqlite3

def upgrade():
    conn = sqlite3.connect('luxebrain.db')
    cursor = conn.cursor()
    
    try:
        cursor.execute("ALTER TABLE api_keys ADD COLUMN permissions TEXT DEFAULT '[]'")
    except sqlite3.OperationalError:
        pass
    
    conn.commit()
    conn.close()
    print("Added permissions column to api_keys table")

if __name__ == "__main__":
    upgrade()
