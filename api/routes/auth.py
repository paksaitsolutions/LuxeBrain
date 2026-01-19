"""
Authentication Routes
Copyright © 2024 Paksa IT Solutions
"""

from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, EmailStr
from passlib.context import CryptContext
from datetime import datetime, timedelta
import jwt

router = APIRouter(prefix="/api/v1/auth", tags=["Authentication"])

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
SECRET_KEY = "your-secret-key-change-in-production"
ALGORITHM = "HS256"

# Mock user database (replace with real database)
USERS_DB = {
    "admin@luxebrain.ai": {
        "email": "admin@luxebrain.ai",
        "password": pwd_context.hash("admin123"),
        "role": "admin",
        "user_id": "admin-001",
        "tenant_id": None,
    },
    "demo@store.com": {
        "email": "demo@store.com",
        "password": pwd_context.hash("demo123"),
        "role": "tenant",
        "user_id": "user-001",
        "tenant_id": "tenant-001",
    },
}


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class SignupRequest(BaseModel):
    email: EmailStr
    password: str
    store_name: str


class AuthResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user_id: str
    tenant_id: str | None
    role: str
    email: str


@router.post("/login", response_model=AuthResponse)
async def login(request: LoginRequest):
    user = USERS_DB.get(request.email)
    
    if not user or not pwd_context.verify(request.password, user["password"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    token_data = {
        "sub": user["email"],
        "user_id": user["user_id"],
        "tenant_id": user["tenant_id"],
        "role": user["role"],
        "exp": datetime.utcnow() + timedelta(hours=24),
    }
    
    access_token = jwt.encode(token_data, SECRET_KEY, algorithm=ALGORITHM)
    
    return AuthResponse(
        access_token=access_token,
        user_id=user["user_id"],
        tenant_id=user["tenant_id"],
        role=user["role"],
        email=user["email"],
    )


@router.post("/signup", response_model=AuthResponse)
async def signup(request: SignupRequest):
    if request.email in USERS_DB:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    tenant_id = f"tenant-{len(USERS_DB) + 1:03d}"
    user_id = f"user-{len(USERS_DB) + 1:03d}"
    
    USERS_DB[request.email] = {
        "email": request.email,
        "password": pwd_context.hash(request.password),
        "role": "tenant",
        "user_id": user_id,
        "tenant_id": tenant_id,
    }
    
    token_data = {
        "sub": request.email,
        "user_id": user_id,
        "tenant_id": tenant_id,
        "role": "tenant",
        "exp": datetime.utcnow() + timedelta(hours=24),
    }
    
    access_token = jwt.encode(token_data, SECRET_KEY, algorithm=ALGORITHM)
    
    return AuthResponse(
        access_token=access_token,
        user_id=user_id,
        tenant_id=tenant_id,
        role="tenant",
        email=request.email,
    )
