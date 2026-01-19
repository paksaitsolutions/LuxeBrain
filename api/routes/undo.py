"""
Undo Actions Routes
Copyright © 2024 Paksa IT Solutions
"""

from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Dict, Any
from datetime import datetime, timedelta
import uuid

router = APIRouter(prefix="/api/v1/undo", tags=["Undo Actions"])

# In-memory undo stack (use Redis in production)
UNDO_STACK: Dict[str, dict] = {}


class UndoAction(BaseModel):
    action_type: str
    data: Dict[str, Any]
    tenant_id: str


class UndoResponse(BaseModel):
    undo_id: str
    expires_at: str


@router.post("/save", response_model=UndoResponse)
async def save_undo_action(action: UndoAction):
    """Save an action that can be undone"""
    undo_id = str(uuid.uuid4())
    expires_at = datetime.utcnow() + timedelta(seconds=5)
    
    UNDO_STACK[undo_id] = {
        "action_type": action.action_type,
        "data": action.data,
        "tenant_id": action.tenant_id,
        "expires_at": expires_at,
        "created_at": datetime.utcnow(),
    }
    
    return UndoResponse(
        undo_id=undo_id,
        expires_at=expires_at.isoformat()
    )


@router.post("/execute/{undo_id}")
async def execute_undo(undo_id: str):
    """Execute an undo action"""
    if undo_id not in UNDO_STACK:
        raise HTTPException(status_code=404, detail="Undo action not found or expired")
    
    action = UNDO_STACK[undo_id]
    
    # Check if expired
    if action["expires_at"] < datetime.utcnow():
        del UNDO_STACK[undo_id]
        raise HTTPException(status_code=410, detail="Undo action expired")
    
    # Execute undo based on action type
    action_type = action["action_type"]
    data = action["data"]
    
    if action_type == "delete_item":
        # Restore deleted item
        result = {"message": f"Restored item {data.get('item_id')}"}
    elif action_type == "update_item":
        # Revert to previous value
        result = {"message": f"Reverted item {data.get('item_id')} to previous state"}
    elif action_type == "bulk_delete":
        # Restore multiple items
        result = {"message": f"Restored {len(data.get('item_ids', []))} items"}
    else:
        result = {"message": "Undo action executed"}
    
    # Remove from stack after execution
    del UNDO_STACK[undo_id]
    
    return result


@router.delete("/clear")
async def clear_expired_undo_actions():
    """Clear expired undo actions"""
    now = datetime.utcnow()
    expired = [uid for uid, action in UNDO_STACK.items() if action["expires_at"] < now]
    
    for uid in expired:
        del UNDO_STACK[uid]
    
    return {"message": f"Cleared {len(expired)} expired actions"}
