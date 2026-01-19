"""
Migration: Add api_logs table
Copyright © 2024 Paksa IT Solutions. All Rights Reserved.
"""

from sqlalchemy import create_engine, Column, Integer, String, DateTime, Float, Text
from sqlalchemy.ext.declarative import declarative_base
from datetime import datetime
import sys
import os

sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(__file__))))

from config.database import Base, engine
from api.models.database_models import ApiLog

def migrate():
    """Add api_logs table"""
    print("Creating api_logs table...")
    
    try:
        Base.metadata.create_all(bind=engine, tables=[ApiLog.__table__])
        print("✅ api_logs table created successfully")
    except Exception as e:
        print(f"❌ Error creating table: {e}")
        raise

if __name__ == "__main__":
    migrate()
