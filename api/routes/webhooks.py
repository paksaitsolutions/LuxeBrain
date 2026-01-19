"""
WooCommerce Webhooks API
Copyright © 2024 Paksa IT Solutions
"""

from fastapi import APIRouter, Request, BackgroundTasks, HTTPException
from api.schemas.schemas import WebhookPayload
from api.utils.input_validator import InputValidator
from data_pipeline.processors import process_order, process_customer, process_product

router = APIRouter()


@router.post("/order-created")
async def order_created_webhook(payload: WebhookPayload, background_tasks: BackgroundTasks):
    """Handle new order webhook"""
    try:
        validated_data = InputValidator.validate_webhook_data(payload.event, payload.data)
        background_tasks.add_task(process_order, validated_data)
        return {"status": "accepted"}
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid webhook data: {str(e)}")


@router.post("/customer-updated")
async def customer_updated_webhook(payload: WebhookPayload, background_tasks: BackgroundTasks):
    """Handle customer update webhook"""
    try:
        validated_data = InputValidator.validate_webhook_data(payload.event, payload.data)
        background_tasks.add_task(process_customer, validated_data)
        return {"status": "accepted"}
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid webhook data: {str(e)}")


@router.post("/product-updated")
async def product_updated_webhook(payload: WebhookPayload, background_tasks: BackgroundTasks):
    """Handle product update webhook"""
    try:
        validated_data = InputValidator.validate_webhook_data(payload.event, payload.data)
        background_tasks.add_task(process_product, validated_data)
        return {"status": "accepted"}
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid webhook data: {str(e)}")
