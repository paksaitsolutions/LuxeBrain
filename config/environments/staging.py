"""
Staging Environment Configuration
Copyright © 2024 Paksa IT Solutions
"""

STAGING_CONFIG = {
    "DEBUG": False,
    "LOG_LEVEL": "INFO",
    "DATABASE_POOL_SIZE": 10,
    "RATE_LIMIT_PER_MINUTE": 500,
    "CACHE_TTL": 600,
    "ENABLE_SWAGGER": True,
    "CORS_ORIGINS": ["https://staging.luxebrain.ai", "https://staging-admin.luxebrain.ai"],
}
