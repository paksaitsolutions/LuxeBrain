"""
Recommendations API
Copyright © 2024 Paksa IT Solutions
"""

from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from api.schemas.schemas import RecommendationRequest, RecommendationResponse
from config.database import get_db
from ml_models.recommendation.inference import RecommendationEngine
from ml_models.recommendation.batch_inference import BatchInferenceQueue

router = APIRouter()
recommendation_engine = RecommendationEngine()
batch_queue = BatchInferenceQueue()


@router.post("/", response_model=RecommendationResponse)
async def get_recommendations(
    req: Request,
    request: RecommendationRequest,
    db: Session = Depends(get_db)
):
    """Get personalized product recommendations"""
    try:
        tenant_id = getattr(req.state, 'tenant_id', None)
        recommendations = recommendation_engine.predict(
            customer_id=request.customer_id,
            session_id=request.session_id,
            limit=request.limit,
            recommendation_type=request.recommendation_type,
            tenant_id=tenant_id
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


@router.post("/batch")
async def batch_recommendations(
    req: Request,
    request: RecommendationRequest,
    db: Session = Depends(get_db)
):
    """Queue recommendation request for batch processing"""
    try:
        tenant_id = getattr(req.state, 'tenant_id', None)
        job_id = batch_queue.enqueue(
            customer_id=request.customer_id,
            session_id=request.session_id,
            limit=request.limit,
            recommendation_type=request.recommendation_type,
            tenant_id=tenant_id
        )
        return {"job_id": job_id, "status": "pending"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/batch/{job_id}")
async def get_batch_result(job_id: str):
    """Get result of batch recommendation job"""
    try:
        result = batch_queue.get_result(job_id)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
