"""
Input Validation Tests
Copyright © 2024 Paksa IT Solutions
"""

import pytest
from api.utils.input_validator import InputValidator
from fastapi import HTTPException


def test_validate_order_success():
    """Test valid order data"""
    data = {
        "id": 123,
        "customer_id": 456,
        "total": 99.99,
        "status": "completed"
    }
    result = InputValidator.validate_webhook_data("order.created", data)
    assert result["id"] == 123
    assert result["total"] == 99.99


def test_validate_order_missing_field():
    """Test order with missing required field"""
    data = {"id": 123, "total": 99.99}
    with pytest.raises(HTTPException) as exc:
        InputValidator.validate_webhook_data("order.created", data)
    assert exc.value.status_code == 400


def test_validate_customer_invalid_email():
    """Test customer with invalid email"""
    data = {"id": 123, "email": "invalid-email"}
    with pytest.raises(HTTPException) as exc:
        InputValidator.validate_webhook_data("customer.updated", data)
    assert exc.value.status_code == 400


def test_sanitize_string():
    """Test string sanitization"""
    dirty = "<script>alert('xss')</script>Hello"
    clean = InputValidator.sanitize_string(dirty)
    assert "<script>" not in clean


def test_sanitize_html():
    """Test HTML sanitization"""
    dirty = '<p>Safe</p><script>alert("xss")</script>'
    clean = InputValidator.sanitize_html(dirty)
    assert "<script>" not in clean
    assert "<p>Safe</p>" in clean


def test_validate_email():
    """Test email validation"""
    assert InputValidator.validate_email("test@example.com") == True
    assert InputValidator.validate_email("invalid-email") == False


def test_validate_url():
    """Test URL validation"""
    assert InputValidator.validate_url("https://example.com") == True
    assert InputValidator.validate_url("not-a-url") == False


def test_validate_numeric_range():
    """Test numeric range validation"""
    assert InputValidator.validate_numeric_range(50, 0, 100) == True
    assert InputValidator.validate_numeric_range(150, 0, 100) == False
