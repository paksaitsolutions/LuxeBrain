"""
Visual Search API
Copyright © 2024 Paksa IT Solutions
"""

from fastapi import APIRouter, HTTPException, UploadFile, File
from api.schemas.schemas import VisualSearchRequest
from ml_models.visual_search.inference import VisualSearchEngine

router = APIRouter()
visual_search_engine = VisualSearchEngine()


@router.post("/search")
async def visual_search(image: UploadFile = File(...), limit: int = 10):
    """Search products by uploaded image"""
    try:
        image_bytes = await image.read()
        results = visual_search_engine.search(image_bytes, limit)
        return results
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/similar/{product_id}")
async def find_similar(product_id: int, limit: int = 10):
    """Find visually similar products"""
    try:
        results = visual_search_engine.find_similar(product_id, limit)
        return results
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
