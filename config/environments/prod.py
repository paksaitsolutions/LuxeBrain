"""
Production Environment Configuration
Copyright © 2024 Paksa IT Solutions
"""

PROD_CONFIG = {
    "DEBUG": False,
    "LOG_LEVEL": "WARNING",
    "DATABASE_POOL_SIZE": 20,
    "RATE_LIMIT_PER_MINUTE": 100,
    "CACHE_TTL": 3600,
    "ENABLE_SWAGGER": False,
    "CORS_ORIGINS": ["https://app.luxebrain.ai", "https://admin.luxebrain.ai", "https://luxebrain.ai"],
}
