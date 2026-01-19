"""
Feature Management Routes (Admin)
Copyright © 2024 Paksa IT Solutions
"""

from fastapi import APIRouter, Depends
from api.middleware.auth import verify_admin
from api.utils.feature_gate import PLAN_FEATURES

router = APIRouter(prefix="/api/admin/features", tags=["admin"])


@router.get("/all")
async def get_all_features(admin=Depends(verify_admin)):
    """Get all feature flags by plan"""
    return {
        "plans": PLAN_FEATURES,
        "total_features": len(set(sum(PLAN_FEATURES.values(), [])))
    }


@router.get("/plan/{plan}")
async def get_plan_features(plan: str, admin=Depends(verify_admin)):
    """Get features for specific plan"""
    return {
        "plan": plan,
        "features": PLAN_FEATURES.get(plan, [])
    }
