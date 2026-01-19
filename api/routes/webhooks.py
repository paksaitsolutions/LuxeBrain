"""
WooCommerce Webhooks API
Copyright © 2024 Paksa IT Solutions
"""

from fastapi import APIRouter, Request, BackgroundTasks
from api.schemas.schemas import WebhookPayload
from data_pipeline.processors import process_order, process_customer, process_product

router = APIRouter()


@router.post("/order-created")
async def order_created_webhook(payload: WebhookPayload, background_tasks: BackgroundTasks):
    """Handle new order webhook"""
    background_tasks.add_task(process_order, payload.data)
    return {"status": "accepted"}


@router.post("/customer-updated")
async def customer_updated_webhook(payload: WebhookPayload, background_tasks: BackgroundTasks):
    """Handle customer update webhook"""
    background_tasks.add_task(process_customer, payload.data)
    return {"status": "accepted"}


@router.post("/product-updated")
async def product_updated_webhook(payload: WebhookPayload, background_tasks: BackgroundTasks):
    """Handle product update webhook"""
    background_tasks.add_task(process_product, payload.data)
    return {"status": "accepted"}
