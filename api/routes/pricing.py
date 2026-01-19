"""
Dynamic Pricing API
Copyright © 2024 Paksa IT Solutions
"""

from fastapi import APIRouter, HTTPException
from api.schemas.schemas import PricingRequest, PricingResponse
from ml_models.pricing.inference import PricingEngine
from typing import List

router = APIRouter()
pricing_engine = PricingEngine()


@router.post("/optimize", response_model=PricingResponse)
async def optimize_pricing(request: PricingRequest):
    """Get optimal pricing recommendation"""
    try:
        recommendation = pricing_engine.predict(request.product_id)
        return recommendation
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/slow-moving")
async def get_slow_moving_products(threshold_days: int = 30):
    """Identify slow-moving inventory"""
    try:
        products = pricing_engine.identify_slow_movers(threshold_days)
        return products
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
