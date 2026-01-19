"""
Migration: Add deprecated_api_logs table
Copyright © 2024 Paksa IT Solutions. All Rights Reserved.
"""

from sqlalchemy import create_engine, Column, Integer, String, DateTime, Text
from sqlalchemy.ext.declarative import declarative_base
from datetime import datetime
import sys
import os

sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(__file__))))

from config.database import Base, engine
from api.models.database_models import DeprecatedApiLog

def migrate():
    """Add deprecated_api_logs table"""
    print("Creating deprecated_api_logs table...")
    
    try:
        Base.metadata.create_all(bind=engine, tables=[DeprecatedApiLog.__table__])
        print("✅ deprecated_api_logs table created successfully")
    except Exception as e:
        print(f"❌ Error creating table: {e}")
        raise

if __name__ == "__main__":
    migrate()
