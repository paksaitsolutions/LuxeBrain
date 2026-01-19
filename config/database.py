"""
Database Configuration
Copyright © 2024 Paksa IT Solutions
"""

from sqlalchemy import create_engine
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
                    pool_size=settings.DATABASE_POOL_SIZE,
                    max_overflow=40,
                    pool_recycle=3600
                )
            
            # Test connection
            with engine.connect() as conn:
                from sqlalchemy import text
                conn.execute(text("SELECT 1"))
            
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
    """Database session dependency"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def get_db_health():
    """Check database health"""
    try:
        from sqlalchemy import text
        start_time = time.time()
        db = SessionLocal()
        db.execute(text("SELECT 1"))
        db.close()
        latency = (time.time() - start_time) * 1000
        return {"status": "healthy", "latency_ms": round(latency, 2)}
    except Exception as e:
        return {"status": "unhealthy", "error": str(e)}


def get_pool_stats():
    """Get connection pool statistics"""
    pool = engine.pool
    
    if settings.DATABASE_URL.startswith('sqlite'):
        return {
            "pool_type": "StaticPool",
            "note": "SQLite uses StaticPool (single connection)"
        }
    
    return {
        "pool_size": pool.size(),
        "checked_in": pool.checkedin(),
        "checked_out": pool.checkedout(),
        "overflow": pool.overflow(),
        "total_connections": pool.size() + pool.overflow(),
        "max_overflow": 40,
        "utilization_percent": round((pool.checkedout() / (pool.size() + pool.overflow())) * 100, 2) if (pool.size() + pool.overflow()) > 0 else 0,
        "status": "critical" if pool.overflow() >= 35 else "warning" if pool.overflow() >= 20 else "healthy"
    }
