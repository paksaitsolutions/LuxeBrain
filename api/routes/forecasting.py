"""
Forecasting API
Copyright © 2024 Paksa IT Solutions
"""

from fastapi import APIRouter, HTTPException
from api.schemas.schemas import ForecastRequest, ForecastResponse
from ml_models.forecasting.inference import ForecastingEngine
from typing import List

router = APIRouter()
forecasting_engine = ForecastingEngine()


@router.post("/demand", response_model=List[ForecastResponse])
async def forecast_demand(request: ForecastRequest):
    """Forecast product or category demand"""
    try:
        forecast = forecasting_engine.predict(
            product_id=request.product_id,
            category=request.category,
            days_ahead=request.days_ahead
        )
        return forecast
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/seasonal-trends/{category}")
async def get_seasonal_trends(category: str):
    """Get seasonal trends for a category"""
    try:
        trends = forecasting_engine.seasonal_analysis(category)
        return trends
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
