"""
Session Cleanup Script
Copyright © 2024 Paksa IT Solutions
Removes expired sessions from database
"""

import sqlite3
from datetime import datetime

def cleanup_expired_sessions():
    conn = sqlite3.connect('luxebrain.db')
    cursor = conn.cursor()
    
    now = datetime.utcnow().isoformat()
    
    # Count expired sessions
    cursor.execute("SELECT COUNT(*) FROM sessions WHERE expires_at < ?", (now,))
    count = cursor.fetchone()[0]
    
    # Delete expired sessions
    cursor.execute("DELETE FROM sessions WHERE expires_at < ?", (now,))
    
    conn.commit()
    conn.close()
    
    print(f"Cleaned up {count} expired sessions")
    return count

if __name__ == "__main__":
    cleanup_expired_sessions()
