"""
Development Environment Configuration
Copyright © 2024 Paksa IT Solutions
"""

DEV_CONFIG = {
    "DEBUG": True,
    "LOG_LEVEL": "DEBUG",
    "DATABASE_POOL_SIZE": 5,
    "RATE_LIMIT_PER_MINUTE": 1000,
    "CACHE_TTL": 300,
    "ENABLE_SWAGGER": True,
    "CORS_ORIGINS": ["http://localhost:3000", "http://localhost:3001", "http://localhost:3002"],
}
