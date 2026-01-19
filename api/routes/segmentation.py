"""
Customer Segmentation API
Copyright © 2024 Paksa IT Solutions
"""

from fastapi import APIRouter, HTTPException
from api.schemas.schemas import CustomerSegmentResponse
from ml_models.segmentation.inference import SegmentationEngine

router = APIRouter()
segmentation_engine = SegmentationEngine()


@router.get("/{customer_id}", response_model=CustomerSegmentResponse)
async def get_customer_segment(customer_id: int):
    """Get customer segment and profile"""
    try:
        segment = segmentation_engine.predict(customer_id)
        return segment
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/segment/{segment_name}/customers")
async def get_segment_customers(segment_name: str, limit: int = 100):
    """Get all customers in a segment"""
    try:
        customers = segmentation_engine.get_segment_members(segment_name, limit)
        return customers
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
