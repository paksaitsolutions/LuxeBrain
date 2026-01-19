"""
API Tests
Copyright © 2024 Paksa IT Solutions
"""

import pytest
from fastapi.testclient import TestClient
from api.main import app

client = TestClient(app)


def test_root_endpoint():
    """Test root endpoint"""
    response = client.get("/")
    assert response.status_code == 200
    assert "LuxeBrain AI" in response.json()["name"]


def test_health_check():
    """Test health check endpoint"""
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "healthy"


@pytest.mark.unit
def test_recommendation_engine_initialization():
    """Test recommendation engine can be initialized"""
    from ml_models.recommendation.inference import RecommendationEngine
    engine = RecommendationEngine()
    assert engine is not None


@pytest.mark.unit
def test_segmentation_engine_initialization():
    """Test segmentation engine can be initialized"""
    from ml_models.segmentation.inference import SegmentationEngine
    engine = SegmentationEngine()
    assert engine is not None
