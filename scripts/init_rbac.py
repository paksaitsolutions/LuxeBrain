"""
Initialize RBAC System with Default Roles
Copyright © 2024 Paksa IT Solutions
"""

import sys
from pathlib import Path

# Add parent directory to Python path
sys.path.insert(0, str(Path(__file__).parent.parent))

from sqlalchemy.orm import Session
from config.database import SessionLocal
from api.models.database_models import Role

ROLE_TEMPLATES = {
    "super_admin": {
        "display_name": "Super Administrator",
        "description": "Full system access",
        "permissions": ["*"]
    },
    "admin": {
        "display_name": "Administrator",
        "description": "Manage tenants and billing",
        "permissions": [
            "tenants.*", "billing.*", "analytics.view", "users.view",
            "support.*", "ml.view_models"
        ]
    },
    "support": {
        "display_name": "Support Team",
        "description": "Handle customer support",
        "permissions": [
            "tenants.view", "support.*", "analytics.view"
        ]
    },
    "technical": {
        "display_name": "Technical Team",
        "description": "Manage system and ML models",
        "permissions": [
            "system.*", "ml.*", "tenants.view", "analytics.view"
        ]
    },
    "sales": {
        "display_name": "Sales Team",
        "description": "Manage billing and plans",
        "permissions": [
            "tenants.view", "tenants.create", "billing.*", "analytics.view"
        ]
    }
}

def initialize_rbac():
    """Initialize RBAC system with default roles"""
    db = SessionLocal()
    
    try:
        print("Initializing RBAC system...")
        
        for role_name, role_data in ROLE_TEMPLATES.items():
            existing = db.query(Role).filter(Role.name == role_name).first()
            
            if existing:
                print(f"  ⏭️  Role '{role_name}' already exists")
            else:
                role = Role(
                    name=role_name,
                    display_name=role_data["display_name"],
                    description=role_data["description"],
                    permissions=role_data["permissions"],
                    is_system=True
                )
                db.add(role)
                print(f"  ✅ Created role: {role_name}")
        
        db.commit()
        print("\n✅ RBAC system initialized successfully!")
        
        # List all roles
        roles = db.query(Role).all()
        print(f"\n📋 Total roles: {len(roles)}")
        for role in roles:
            print(f"  - {role.display_name} ({role.name}): {len(role.permissions)} permissions")
            
    except Exception as e:
        print(f"❌ Error initializing RBAC: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    initialize_rbac()
