"""
Add missing columns to users table
Copyright © 2024 Paksa IT Solutions
"""

import sqlite3

conn = sqlite3.connect('luxebrain.db')
cursor = conn.cursor()

# Add missing columns
columns_to_add = [
    "ALTER TABLE users ADD COLUMN full_name TEXT",
    "ALTER TABLE users ADD COLUMN phone TEXT",
    "ALTER TABLE users ADD COLUMN avatar_url TEXT",
    "ALTER TABLE users ADD COLUMN department TEXT",
    "ALTER TABLE users ADD COLUMN is_active INTEGER DEFAULT 1",
    "ALTER TABLE users ADD COLUMN created_by INTEGER",
    "ALTER TABLE users ADD COLUMN last_login_at TIMESTAMP",
    "ALTER TABLE users ADD COLUMN last_login_ip TEXT",
    "ALTER TABLE users ADD COLUMN permissions TEXT"
]

for sql in columns_to_add:
    try:
        cursor.execute(sql)
        print(f"✓ {sql}")
    except sqlite3.OperationalError as e:
        if "duplicate column name" in str(e):
            print(f"⊘ Column already exists: {sql}")
        else:
            print(f"✗ Error: {e}")

conn.commit()
conn.close()
print("\n✅ Migration complete!")
