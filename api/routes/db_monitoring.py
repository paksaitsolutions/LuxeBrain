"""
Database Pool Monitoring Routes
Copyright © 2024 Paksa IT Solutions
"""

from fastapi import APIRouter, HTTPException
from config.database import get_pool_stats
import logging

router = APIRouter(prefix="/api/admin/db", tags=["Database Monitoring"])
logger = logging.getLogger(__name__)

POOL_EXHAUSTION_THRESHOLD = 35


@router.get("/pool-stats")
async def get_database_pool_stats():
    """Get connection pool statistics"""
    try:
        stats = get_pool_stats()
        
        # Alert on pool exhaustion
        if stats.get("overflow", 0) >= POOL_EXHAUSTION_THRESHOLD:
            logger.critical(f"⚠️ DATABASE POOL EXHAUSTION: {stats['overflow']} overflow connections")
        
        return stats
    except Exception as e:
        logger.error(f"Failed to get pool stats: {e}")
        raise HTTPException(status_code=500, detail=str(e))
