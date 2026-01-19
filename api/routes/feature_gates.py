"""
Feature Gates Routes
Copyright © 2024 Paksa IT Solutions
"""

from fastapi import APIRouter, Request
from api.utils.feature_gate import FeatureGate

router = APIRouter(prefix="/api/features", tags=["features"])


@router.get("/available")
async def get_available_features(request: Request):
    """Get list of features available to authenticated tenant"""
    tenant_id = getattr(request.state, 'tenant_id', None)
    
    if not tenant_id:
        return {"error": "Tenant not authenticated"}
    
    features = FeatureGate.get_features(tenant_id)
    
    return {
        "features": features,
        "count": len(features)
    }


@router.get("/check/{feature}")
async def check_feature(request: Request, feature: str):
    """Check if tenant has access to specific feature"""
    tenant_id = getattr(request.state, 'tenant_id', None)
    
    if not tenant_id:
        return {"error": "Tenant not authenticated"}
    
    has_access = FeatureGate.has_feature(tenant_id, feature)
    
    return {
        "feature": feature,
        "has_access": has_access
    }
