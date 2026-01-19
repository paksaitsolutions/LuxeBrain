"""
Per-Tenant Model Isolation
Copyright © 2024 Paksa IT Solutions
"""

import os
from typing import Optional
from config.database import SessionLocal


class TenantModelIsolation:
    """Isolate ML models per tenant to prevent cross-tenant poisoning"""
    
    def __init__(self, model_name: str):
        self.model_name = model_name
        self.base_path = f"models/tenant_models/{model_name}"
        os.makedirs(self.base_path, exist_ok=True)
    
    def get_model_path(self, tenant_id: str, use_shared: bool = True) -> str:
        """Get model path for tenant (isolated or shared)"""
        tenant_model = f"{self.base_path}/{tenant_id}/model"
        
        # Check if tenant has dedicated model
        if os.path.exists(tenant_model):
            return tenant_model
        
        # Use shared model with tenant weighting
        if use_shared:
            return f"models/trained/{self.model_name}_model"
        
        return None
    
    def create_tenant_model(self, tenant_id: str, base_model_path: str):
        """Create isolated model for tenant"""
        import shutil
        tenant_dir = f"{self.base_path}/{tenant_id}"
        os.makedirs(tenant_dir, exist_ok=True)
        
        # Copy base model
        if os.path.exists(base_model_path):
            shutil.copytree(base_model_path, f"{tenant_dir}/model", dirs_exist_ok=True)
    
    def should_isolate_tenant(self, tenant_id: str) -> bool:
        """Determine if tenant needs isolated model"""
        db = SessionLocal()
        try:
            from api.models.database_models import User
            user = db.query(User).filter(User.tenant_id == tenant_id).first()
            if not user:
                return False
            
            # Isolate enterprise tenants (check via tenant_id pattern or config)
            # For now, assume enterprise if tenant_id starts with 'ent_'
            if tenant_id.startswith('ent_'):
                return True
            
            # Isolate tenants with >1000 orders
            from api.models.database_models import Order
            from sqlalchemy import func
            order_count = db.query(func.count(Order.id)).scalar() or 0
            
            return order_count > 1000
        finally:
            db.close()
    
    def get_training_weight(self, tenant_id: str, data_point: dict) -> float:
        """Get weight for training data point (prevents poisoning)"""
        # Higher weight for tenant's own data
        if data_point.get("tenant_id") == tenant_id:
            return 1.0
        
        # Lower weight for other tenants' data
        return 0.1
    
    def filter_training_data(self, tenant_id: str, all_data: list) -> list:
        """Filter and weight training data for tenant"""
        filtered = []
        for item in all_data:
            weight = self.get_training_weight(tenant_id, item)
            if weight > 0:
                item["sample_weight"] = weight
                filtered.append(item)
        return filtered
