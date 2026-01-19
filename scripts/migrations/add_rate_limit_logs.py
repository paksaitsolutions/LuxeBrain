"""
Migration: Add rate_limit_logs table
Copyright © 2024 Paksa IT Solutions. All Rights Reserved.
"""

from sqlalchemy import create_engine, Column, Integer, String, DateTime, Text
from sqlalchemy.ext.declarative import declarative_base
from datetime import datetime
import sys
import os

sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(__file__))))

from config.database import Base, engine
from api.models.database_models import RateLimitLog

def migrate():
    """Add rate_limit_logs table"""
    print("Creating rate_limit_logs table...")
    
    try:
        Base.metadata.create_all(bind=engine, tables=[RateLimitLog.__table__])
        print("✅ rate_limit_logs table created successfully")
    except Exception as e:
        print(f"❌ Error creating table: {e}")
        raise

if __name__ == "__main__":
    migrate()
