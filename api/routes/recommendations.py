"""
Recommendations API
Copyright © 2024 Paksa IT Solutions
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from api.schemas.schemas import RecommendationRequest, RecommendationResponse
from config.database import get_db
from ml_models.recommendation.inference import RecommendationEngine

router = APIRouter()
recommendation_engine = RecommendationEngine()


@router.post("/", response_model=RecommendationResponse)
async def get_recommendations(
    request: RecommendationRequest,
    db: Session = Depends(get_db)
):
    """Get personalized product recommendations"""
    try:
        recommendations = recommendation_engine.predict(
            customer_id=request.customer_id,
            session_id=request.session_id,
            limit=request.limit,
            recommendation_type=request.recommendation_type
        )
        return recommendations
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/cross-sell/{product_id}")
async def get_cross_sell(product_id: int, limit: int = 5):
    """Get cross-sell recommendations for a product"""
    try:
        recommendations = recommendation_engine.cross_sell(product_id, limit)
        return recommendations
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/outfit/{product_id}")
async def get_outfit_recommendations(product_id: int, limit: int = 3):
    """Get outfit matching recommendations"""
    try:
        recommendations = recommendation_engine.outfit_match(product_id, limit)
        return recommendations
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
