"""
API Schemas
Copyright © 2024 Paksa IT Solutions
"""

from pydantic import BaseModel, EmailStr
from typing import Optional, List, Dict, Any
from datetime import datetime


class ProductSchema(BaseModel):
    id: int
    name: str
    price: float
    category: str
    image_url: Optional[str] = None
    
    class Config:
        from_attributes = True


class RecommendationRequest(BaseModel):
    customer_id: Optional[int] = None
    session_id: Optional[str] = None
    limit: int = 10
    recommendation_type: str = "personalized"


class RecommendationResponse(BaseModel):
    products: List[ProductSchema]
    scores: List[float]
    recommendation_type: str


class ForecastRequest(BaseModel):
    product_id: Optional[int] = None
    category: Optional[str] = None
    days_ahead: int = 30


class ForecastResponse(BaseModel):
    forecast_date: datetime
    predicted_demand: float
    confidence_interval: Dict[str, float]


class CustomerSegmentResponse(BaseModel):
    customer_id: int
    segment: str
    segment_description: str
    lifetime_value: float


class PricingRequest(BaseModel):
    product_id: int


class PricingResponse(BaseModel):
    product_id: int
    current_price: float
    recommended_price: float
    discount_percentage: float
    reason: str


class VisualSearchRequest(BaseModel):
    image_url: Optional[str] = None
    limit: int = 10


class WebhookPayload(BaseModel):
    event: str
    data: Dict[str, Any]
