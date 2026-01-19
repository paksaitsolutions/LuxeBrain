"""
Database Connection with Retry Logic
Copyright © 2024 Paksa IT Solutions
"""

from sqlalchemy import create_engine, event
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
from config.settings import settings
import time
import logging

logger = logging.getLogger(__name__)

Base = declarative_base()


def create_db_engine_with_retry(max_retries=3, initial_delay=1):
    """Create database engine with connection retry logic"""
    
    for attempt in range(max_retries):
        try:
            if settings.DATABASE_URL.startswith('sqlite'):
                engine = create_engine(
                    settings.DATABASE_URL,
                    connect_args={"check_same_thread": False},
                    poolclass=StaticPool
                )
            else:
                engine = create_engine(
                    settings.DATABASE_URL,
                    pool_pre_ping=True,
                    pool_size=10,
                    max_overflow=20,
                    pool_recycle=3600
                )
            
            # Test connection
            with engine.connect() as conn:
                conn.execute("SELECT 1")
            
            logger.info(f"Database connection established on attempt {attempt + 1}")
            return engine
            
        except Exception as e:
            delay = initial_delay * (2 ** attempt)
            logger.error(f"Database connection attempt {attempt + 1} failed: {e}")
            
            if attempt < max_retries - 1:
                logger.info(f"Retrying in {delay} seconds...")
                time.sleep(delay)
            else:
                logger.critical("Max retries reached. Database connection failed.")
                raise


# Create engine with retry
engine = create_db_engine_with_retry()

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def get_db():
    """Dependency for database sessions"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def get_db_health():
    """Check database health"""
    try:
        start_time = time.time()
        db = SessionLocal()
        db.execute("SELECT 1")
        db.close()
        latency = (time.time() - start_time) * 1000
        return {"status": "healthy", "latency_ms": round(latency, 2)}
    except Exception as e:
        return {"status": "unhealthy", "error": str(e)}
