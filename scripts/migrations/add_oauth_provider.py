"""
Add OAuth Provider Column Migration
Copyright © 2024 Paksa IT Solutions
"""

from sqlalchemy import text
from config.database import engine

def upgrade():
    """Add oauth_provider column to users table"""
    with engine.connect() as conn:
        # Check if column exists
        result = conn.execute(text(
            "SELECT COUNT(*) FROM pragma_table_info('users') WHERE name='oauth_provider'"
        ))
        exists = result.scalar() > 0
        
        if not exists:
            conn.execute(text(
                "ALTER TABLE users ADD COLUMN oauth_provider VARCHAR"
            ))
            conn.commit()
            print("✅ Added oauth_provider column to users table")
        else:
            print("ℹ️  oauth_provider column already exists")

def downgrade():
    """Remove oauth_provider column from users table"""
    print("⚠️  SQLite does not support DROP COLUMN. Manual migration required.")

if __name__ == "__main__":
    print("Running migration: Add OAuth Provider Column")
    upgrade()
