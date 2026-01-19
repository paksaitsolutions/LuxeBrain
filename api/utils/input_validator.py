"""
Input Validation & Sanitization
Copyright © 2024 Paksa IT Solutions
"""

import re
import bleach
from typing import Dict, Any, Optional
from fastapi import HTTPException


class InputValidator:
    """Validate and sanitize all inputs"""
    
    @staticmethod
    def validate_webhook_data(event: str, data: Dict[str, Any]) -> Dict[str, Any]:
        """Validate webhook payload structure"""
        if not event or not isinstance(event, str):
            raise HTTPException(status_code=400, detail="Invalid event type")
        
        if not data or not isinstance(data, dict):
            raise HTTPException(status_code=400, detail="Invalid data payload")
        
        # Validate based on event type
        if event == "order.created":
            return InputValidator._validate_order(data)
        elif event == "customer.updated":
            return InputValidator._validate_customer(data)
        elif event == "product.updated":
            return InputValidator._validate_product(data)
        
        return data
    
    @staticmethod
    def _validate_order(data: Dict[str, Any]) -> Dict[str, Any]:
        """Validate order data"""
        required = ["id", "customer_id", "total", "status"]
        for field in required:
            if field not in data:
                raise HTTPException(status_code=400, detail=f"Missing field: {field}")
        
        # Type validation
        if not isinstance(data["id"], int):
            raise HTTPException(status_code=400, detail="Invalid order ID")
        if not isinstance(data["total"], (int, float)) or data["total"] < 0:
            raise HTTPException(status_code=400, detail="Invalid total amount")
        
        # Sanitize strings
        data["status"] = InputValidator.sanitize_string(data["status"])
        
        return data
    
    @staticmethod
    def _validate_customer(data: Dict[str, Any]) -> Dict[str, Any]:
        """Validate customer data"""
        required = ["id", "email"]
        for field in required:
            if field not in data:
                raise HTTPException(status_code=400, detail=f"Missing field: {field}")
        
        # Email validation
        if not InputValidator.validate_email(data["email"]):
            raise HTTPException(status_code=400, detail="Invalid email format")
        
        # Sanitize strings
        if "first_name" in data:
            data["first_name"] = InputValidator.sanitize_string(data["first_name"])
        if "last_name" in data:
            data["last_name"] = InputValidator.sanitize_string(data["last_name"])
        
        return data
    
    @staticmethod
    def _validate_product(data: Dict[str, Any]) -> Dict[str, Any]:
        """Validate product data"""
        required = ["id", "name", "price"]
        for field in required:
            if field not in data:
                raise HTTPException(status_code=400, detail=f"Missing field: {field}")
        
        # Type validation
        if not isinstance(data["price"], (int, float)) or data["price"] < 0:
            raise HTTPException(status_code=400, detail="Invalid price")
        
        # Sanitize strings
        data["name"] = InputValidator.sanitize_string(data["name"])
        if "description" in data:
            data["description"] = InputValidator.sanitize_html(data["description"])
        
        return data
    
    @staticmethod
    def sanitize_string(text: str, max_length: int = 500) -> str:
        """Sanitize plain text input"""
        if not isinstance(text, str):
            return ""
        
        # Remove control characters
        text = re.sub(r'[\x00-\x1f\x7f-\x9f]', '', text)
        
        # Strip whitespace
        text = text.strip()
        
        # Truncate
        return text[:max_length]
    
    @staticmethod
    def sanitize_html(html: str, max_length: int = 5000) -> str:
        """Sanitize HTML content"""
        if not isinstance(html, str):
            return ""
        
        # Allow only safe tags
        allowed_tags = ['p', 'br', 'strong', 'em', 'u', 'a', 'ul', 'ol', 'li']
        allowed_attrs = {'a': ['href', 'title']}
        
        clean = bleach.clean(
            html,
            tags=allowed_tags,
            attributes=allowed_attrs,
            strip=True
        )
        
        return clean[:max_length]
    
    @staticmethod
    def validate_email(email: str) -> bool:
        """Validate email format"""
        pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
        return bool(re.match(pattern, email))
    
    @staticmethod
    def validate_url(url: str) -> bool:
        """Validate URL format"""
        pattern = r'^https?://[^\s/$.?#].[^\s]*$'
        return bool(re.match(pattern, url))
    
    @staticmethod
    def validate_numeric_range(value: Any, min_val: float, max_val: float) -> bool:
        """Validate numeric value is within range"""
        try:
            num = float(value)
            return min_val <= num <= max_val
        except (ValueError, TypeError):
            return False
    
    @staticmethod
    def sanitize_sql_input(text: str) -> str:
        """Prevent SQL injection"""
        if not isinstance(text, str):
            return ""
        
        # Remove SQL keywords and special chars
        dangerous = ['--', ';', '/*', '*/', 'xp_', 'sp_', 'DROP', 'DELETE', 'INSERT', 'UPDATE']
        for keyword in dangerous:
            text = text.replace(keyword, '')
        
        return text.strip()
