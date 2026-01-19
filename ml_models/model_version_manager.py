"""
Model Version Manager
Copyright © 2024 Paksa IT Solutions
"""

import hashlib
from datetime import datetime
from typing import Optional, Dict
from config.database import SessionLocal
from api.models.database_models import ModelVersion, ModelMetrics


class ModelVersionManager:
    """Manage model versions, A/B testing, and rollback"""
    
    def __init__(self, model_name: str):
        self.model_name = model_name
    
    def register_version(
        self,
        version: str,
        file_path: str,
        metadata: Optional[Dict] = None
    ) -> int:
        """Register new model version"""
        db = SessionLocal()
        try:
            model_version = ModelVersion(
                model_name=self.model_name,
                version=version,
                file_path=file_path,
                is_active=False,
                ab_test_percentage=0.0,
                metadata=metadata
            )
            db.add(model_version)
            db.commit()
            db.refresh(model_version)
            return model_version.id
        finally:
            db.close()
    
    def activate_version(self, version: str, ab_percentage: float = 100.0):
        """Activate model version for production"""
        db = SessionLocal()
        try:
            # Deactivate all versions
            db.query(ModelVersion).filter(
                ModelVersion.model_name == self.model_name
            ).update({"is_active": False, "ab_test_percentage": 0.0})
            
            # Activate target version
            model = db.query(ModelVersion).filter(
                ModelVersion.model_name == self.model_name,
                ModelVersion.version == version
            ).first()
            
            if model:
                model.is_active = True
                model.ab_test_percentage = ab_percentage
                model.deployed_at = datetime.utcnow()
                db.commit()
        finally:
            db.close()
    
    def setup_ab_test(self, version_a: str, version_b: str, split: float = 50.0):
        """Setup A/B test between two versions"""
        db = SessionLocal()
        try:
            # Deactivate all
            db.query(ModelVersion).filter(
                ModelVersion.model_name == self.model_name
            ).update({"is_active": False, "ab_test_percentage": 0.0})
            
            # Activate version A
            model_a = db.query(ModelVersion).filter(
                ModelVersion.model_name == self.model_name,
                ModelVersion.version == version_a
            ).first()
            if model_a:
                model_a.is_active = True
                model_a.ab_test_percentage = split
            
            # Activate version B
            model_b = db.query(ModelVersion).filter(
                ModelVersion.model_name == self.model_name,
                ModelVersion.version == version_b
            ).first()
            if model_b:
                model_b.is_active = True
                model_b.ab_test_percentage = 100.0 - split
            
            db.commit()
        finally:
            db.close()
    
    def get_active_version(self, user_id: Optional[str] = None) -> Optional[str]:
        """Get active version for user (A/B test aware)"""
        db = SessionLocal()
        try:
            active_versions = db.query(ModelVersion).filter(
                ModelVersion.model_name == self.model_name,
                ModelVersion.is_active == True
            ).order_by(ModelVersion.ab_test_percentage.desc()).all()
            
            if not active_versions:
                return None
            
            # Single version
            if len(active_versions) == 1:
                return active_versions[0].file_path
            
            # A/B test: hash user_id to determine version
            if user_id:
                hash_val = int(hashlib.md5(user_id.encode()).hexdigest(), 16)
                bucket = hash_val % 100
                
                cumulative = 0
                for version in active_versions:
                    cumulative += version.ab_test_percentage
                    if bucket < cumulative:
                        return version.file_path
            
            # Default to first version
            return active_versions[0].file_path
        finally:
            db.close()
    
    def track_performance(self, version: str, metric_name: str, metric_value: float):
        """Track model performance metrics"""
        db = SessionLocal()
        try:
            # Log metric
            metric = ModelMetrics(
                model_name=self.model_name,
                model_version=version,
                metric_name=metric_name,
                metric_value=metric_value
            )
            db.add(metric)
            
            # Update version performance score
            model = db.query(ModelVersion).filter(
                ModelVersion.model_name == self.model_name,
                ModelVersion.version == version
            ).first()
            if model:
                model.performance_score = metric_value
            
            db.commit()
        finally:
            db.close()
    
    def rollback_to_version(self, version: str):
        """Rollback to previous version"""
        self.activate_version(version, 100.0)
    
    def list_versions(self):
        """List all versions"""
        db = SessionLocal()
        try:
            versions = db.query(ModelVersion).filter(
                ModelVersion.model_name == self.model_name
            ).order_by(ModelVersion.created_at.desc()).all()
            return [{
                "version": v.version,
                "is_active": v.is_active,
                "ab_test_percentage": v.ab_test_percentage,
                "performance_score": v.performance_score,
                "created_at": v.created_at.isoformat(),
                "deployed_at": v.deployed_at.isoformat() if v.deployed_at else None
            } for v in versions]
        finally:
            db.close()
