"""
Role-Based Access Control (RBAC) System
Copyright © 2024 Paksa IT Solutions
"""

from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel
from sqlalchemy.orm import Session
from sqlalchemy import desc
from api.middleware.auth import verify_admin
from api.models.database_models import User, Role, Permission, UserActivity
from config.database import get_db
import bcrypt
from datetime import datetime
from typing import List, Optional

router = APIRouter(prefix="/api/admin/rbac", tags=["rbac"])


# ============ PERMISSIONS ============
SYSTEM_PERMISSIONS = {
    "tenants": ["view", "create", "edit", "delete", "suspend"],
    "billing": ["view", "create_invoice", "refund", "adjust"],
    "analytics": ["view", "export"],
    "users": ["view", "create", "edit", "delete", "manage_roles"],
    "support": ["view_tickets", "create_ticket", "respond", "close"],
    "system": ["view_logs", "backup", "restore", "settings"],
    "ml": ["view_models", "deploy", "rollback", "ab_test"],
    "security": ["view_logs", "block_ip", "manage_keys"]
}

ROLE_TEMPLATES = {
    "super_admin": {
        "display_name": "Super Administrator",
        "description": "Full system access",
        "permissions": ["*"]  # All permissions
    },
    "admin": {
        "display_name": "Administrator",
        "description": "Manage tenants and billing",
        "permissions": [
            "tenants.*", "billing.*", "analytics.view", "users.view",
            "support.*", "ml.view_models"
        ]
    },
    "support": {
        "display_name": "Support Team",
        "description": "Handle customer support",
        "permissions": [
            "tenants.view", "support.*", "analytics.view"
        ]
    },
    "technical": {
        "display_name": "Technical Team",
        "description": "Manage system and ML models",
        "permissions": [
            "system.*", "ml.*", "tenants.view", "analytics.view"
        ]
    },
    "sales": {
        "display_name": "Sales Team",
        "description": "Manage billing and plans",
        "permissions": [
            "tenants.view", "tenants.create", "billing.*", "analytics.view"
        ]
    }
}


def has_permission(user: dict, permission: str) -> bool:
    """Check if user has specific permission"""
    user_perms = user.get("permissions", [])
    
    # Super admin has all permissions
    if "*" in user_perms:
        return True
    
    # Check exact match
    if permission in user_perms:
        return True
    
    # Check wildcard match (e.g., tenants.* matches tenants.view)
    category = permission.split(".")[0]
    if f"{category}.*" in user_perms:
        return True
    
    return False


def require_permission(permission: str):
    """Decorator to require specific permission"""
    async def permission_checker(request: Request, admin=Depends(verify_admin)):
        if not has_permission(admin, permission):
            raise HTTPException(status_code=403, detail=f"Permission denied: {permission}")
        return admin
    return permission_checker


# ============ ROLES MANAGEMENT ============
@router.get("/roles")
async def get_roles(admin=Depends(verify_admin), db: Session = Depends(get_db)):
    """Get all roles"""
    roles = db.query(Role).all()
    return {"roles": [{
        "id": r.id,
        "name": r.name,
        "display_name": r.display_name,
        "description": r.description,
        "permissions": r.permissions,
        "is_system": r.is_system
    } for r in roles]}


class RoleRequest(BaseModel):
    name: str
    display_name: str
    description: str
    permissions: List[str]


@router.post("/roles")
async def create_role(req: RoleRequest, admin=Depends(require_permission("users.manage_roles")), db: Session = Depends(get_db)):
    """Create custom role"""
    existing = db.query(Role).filter(Role.name == req.name).first()
    if existing:
        raise HTTPException(status_code=400, detail="Role already exists")
    
    role = Role(
        name=req.name,
        display_name=req.display_name,
        description=req.description,
        permissions=req.permissions,
        is_system=False
    )
    db.add(role)
    db.commit()
    
    return {"message": "Role created", "role_id": role.id}


@router.put("/roles/{role_id}")
async def update_role(role_id: int, req: RoleRequest, admin=Depends(require_permission("users.manage_roles")), db: Session = Depends(get_db)):
    """Update role"""
    role = db.query(Role).filter(Role.id == role_id).first()
    if not role:
        raise HTTPException(status_code=404, detail="Role not found")
    
    if role.is_system:
        raise HTTPException(status_code=400, detail="Cannot modify system role")
    
    role.display_name = req.display_name
    role.description = req.description
    role.permissions = req.permissions
    role.updated_at = datetime.utcnow()
    
    db.commit()
    return {"message": "Role updated"}


@router.delete("/roles/{role_id}")
async def delete_role(role_id: int, admin=Depends(require_permission("users.manage_roles")), db: Session = Depends(get_db)):
    """Delete role"""
    role = db.query(Role).filter(Role.id == role_id).first()
    if not role:
        raise HTTPException(status_code=404, detail="Role not found")
    
    if role.is_system:
        raise HTTPException(status_code=400, detail="Cannot delete system role")
    
    # Check if any users have this role
    users_count = db.query(User).filter(User.role == role.name).count()
    if users_count > 0:
        raise HTTPException(status_code=400, detail=f"Cannot delete role: {users_count} users assigned")
    
    db.delete(role)
    db.commit()
    return {"message": "Role deleted"}


# ============ PERMISSIONS MANAGEMENT ============
@router.get("/permissions")
async def get_permissions(admin=Depends(verify_admin), db: Session = Depends(get_db)):
    """Get all available permissions"""
    permissions = []
    for category, actions in SYSTEM_PERMISSIONS.items():
        for action in actions:
            permissions.append({
                "name": f"{category}.{action}",
                "category": category,
                "action": action
            })
    
    return {"permissions": permissions}


# ============ USER MANAGEMENT ============
class UserCreateRequest(BaseModel):
    email: str
    password: str
    full_name: str
    role: str
    department: Optional[str] = None
    phone: Optional[str] = None
    avatar_url: Optional[str] = None
    permissions: Optional[List[str]] = None


class UserUpdateRequest(BaseModel):
    full_name: Optional[str] = None
    role: Optional[str] = None
    department: Optional[str] = None
    phone: Optional[str] = None
    permissions: Optional[List[str]] = None
    is_active: Optional[bool] = None


@router.get("/users")
async def get_users(role: str = None, department: str = None, admin=Depends(require_permission("users.view")), db: Session = Depends(get_db)):
    """Get all admin users"""
    query = db.query(User).filter(User.role.in_(["super_admin", "admin", "support", "technical", "sales"]))
    
    if role:
        query = query.filter(User.role == role)
    if department:
        query = query.filter(User.department == department)
    
    users = query.all()
    
    return {"users": [{
        "id": u.id,
        "email": u.email,
        "full_name": u.full_name,
        "role": u.role,
        "department": u.department,
        "phone": u.phone,
        "avatar_url": u.avatar_url,
        "permissions": u.permissions or [],
        "is_active": u.is_active,
        "email_verified": u.email_verified,
        "last_login_at": u.last_login_at.isoformat() if u.last_login_at else None,
        "created_at": u.created_at.isoformat()
    } for u in users]}


@router.get("/users/{user_id}")
async def get_user(user_id: int, admin=Depends(require_permission("users.view")), db: Session = Depends(get_db)):
    """Get user details"""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Get user activity
    activities = db.query(UserActivity).filter(UserActivity.user_id == user_id).order_by(desc(UserActivity.created_at)).limit(20).all()
    
    return {
        "user": {
            "id": user.id,
            "email": user.email,
            "full_name": user.full_name,
            "role": user.role,
            "department": user.department,
            "phone": user.phone,
            "avatar_url": user.avatar_url,
            "permissions": user.permissions or [],
            "is_active": user.is_active,
            "email_verified": user.email_verified,
            "last_login_at": user.last_login_at.isoformat() if user.last_login_at else None,
            "last_login_ip": user.last_login_ip,
            "created_at": user.created_at.isoformat(),
            "created_by": user.created_by
        },
        "activities": [{
            "action": a.action,
            "resource_type": a.resource_type,
            "resource_id": a.resource_id,
            "details": a.details,
            "created_at": a.created_at.isoformat()
        } for a in activities]
    }


@router.post("/users")
async def create_user(req: UserCreateRequest, request: Request, admin=Depends(require_permission("users.create")), db: Session = Depends(get_db)):
    """Create new admin user"""
    existing = db.query(User).filter(User.email == req.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already exists")
    
    # Get role permissions
    role = db.query(Role).filter(Role.name == req.role).first()
    if not role:
        raise HTTPException(status_code=400, detail="Invalid role")
    
    password_hash = bcrypt.hashpw(req.password.encode(), bcrypt.gensalt()).decode()
    
    user = User(
        email=req.email,
        password_hash=password_hash,
        full_name=req.full_name,
        role=req.role,
        department=req.department,
        phone=req.phone,
        avatar_url=req.avatar_url,
        permissions=req.permissions or role.permissions,
        email_verified=True,
        is_active=True,
        created_by=admin.get("user_id")
    )
    db.add(user)
    db.commit()
    
    # Log activity
    activity = UserActivity(
        user_id=admin.get("user_id"),
        action="create_user",
        resource_type="user",
        resource_id=str(user.id),
        details={"email": req.email, "role": req.role},
        ip_address=request.client.host,
        user_agent=request.headers.get("user-agent", "")
    )
    db.add(activity)
    db.commit()
    
    return {"message": "User created", "user_id": user.id}


@router.put("/users/{user_id}")
async def update_user(user_id: int, req: UserUpdateRequest, request: Request, admin=Depends(require_permission("users.edit")), db: Session = Depends(get_db)):
    """Update user"""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if req.full_name is not None:
        user.full_name = req.full_name
    if req.role is not None:
        user.role = req.role
    if req.department is not None:
        user.department = req.department
    if req.phone is not None:
        user.phone = req.phone
    if req.permissions is not None:
        user.permissions = req.permissions
    if req.is_active is not None:
        user.is_active = req.is_active
    
    user.updated_at = datetime.utcnow()
    db.commit()
    
    # Log activity
    activity = UserActivity(
        user_id=admin.get("user_id"),
        action="update_user",
        resource_type="user",
        resource_id=str(user_id),
        details=req.dict(exclude_none=True),
        ip_address=request.client.host,
        user_agent=request.headers.get("user-agent", "")
    )
    db.add(activity)
    db.commit()
    
    return {"message": "User updated"}


@router.delete("/users/{user_id}")
async def delete_user(user_id: int, request: Request, admin=Depends(require_permission("users.delete")), db: Session = Depends(get_db)):
    """Delete user"""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if user.role == "super_admin":
        raise HTTPException(status_code=400, detail="Cannot delete super admin")
    
    # Log activity before deletion
    activity = UserActivity(
        user_id=admin.get("user_id"),
        action="delete_user",
        resource_type="user",
        resource_id=str(user_id),
        details={"email": user.email, "role": user.role},
        ip_address=request.client.host,
        user_agent=request.headers.get("user-agent", "")
    )
    db.add(activity)
    
    db.delete(user)
    db.commit()
    
    return {"message": "User deleted"}


# ============ INITIALIZE SYSTEM ROLES ============
@router.post("/initialize")
async def initialize_rbac(admin=Depends(verify_admin), db: Session = Depends(get_db)):
    """Initialize system roles and permissions"""
    for role_name, role_data in ROLE_TEMPLATES.items():
        existing = db.query(Role).filter(Role.name == role_name).first()
        if not existing:
            role = Role(
                name=role_name,
                display_name=role_data["display_name"],
                description=role_data["description"],
                permissions=role_data["permissions"],
                is_system=True
            )
            db.add(role)
    
    db.commit()
    return {"message": "RBAC system initialized"}
