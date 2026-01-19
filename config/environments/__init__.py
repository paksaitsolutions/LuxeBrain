"""
Environment Configuration Loader
Copyright © 2024 Paksa IT Solutions
"""

from config.environments.dev import DEV_CONFIG
from config.environments.staging import STAGING_CONFIG
from config.environments.prod import PROD_CONFIG
import os


def get_env_config():
    """Load environment-specific configuration"""
    env = os.getenv("APP_ENV", "development").lower()
    
    config_map = {
        "development": DEV_CONFIG,
        "dev": DEV_CONFIG,
        "staging": STAGING_CONFIG,
        "production": PROD_CONFIG,
        "prod": PROD_CONFIG,
    }
    
    return config_map.get(env, DEV_CONFIG)


env_config = get_env_config()
