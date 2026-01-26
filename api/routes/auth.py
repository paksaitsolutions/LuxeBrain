"""
Authentication Routes
Copyright © 2024 Paksa IT Solutions
"""

from fastapi import APIRouter, HTTPException, Depends, Request
from pydantic import BaseModel, EmailStr
from passlib.context import CryptContext
from datetime import datetime, timedelta
import jwt
import os
import httpx
from sqlalchemy.orm import Session
from config.database import get_db
from api.models.database_models import User, PasswordHistory, LoginAttempt, SecurityAuditLog, Session as SessionModel, UserActivity
from config.settings import settings
import hashlib

router = APIRouter(prefix="/api/v1/auth", tags=["Authentication"])

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
SECRET_KEY = settings.JWT_SECRET_KEY
ALGORITHM = "HS256"
LOCKOUT_THRESHOLD = 5
LOCKOUT_DURATION = 15  # minutes


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class SignupRequest(BaseModel):
    email: EmailStr
    password: str
    store_name: str
    honeypot: str = ''


class AuthResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    user_id: str
    tenant_id: str | None
    role: str
    email: str


def log_security_event(db: Session, event_type: str, user_id: int = None, tenant_id: str = None, ip: str = None, details: dict = None):
    log = SecurityAuditLog(
        event_type=event_type,
        user_id=user_id,
        tenant_id=tenant_id,
        ip_address=ip,
        details=details
    )
    db.add(log)
    db.commit()


@router.post("/login", response_model=AuthResponse)
async def login(request: LoginRequest, req: Request, db: Session = Depends(get_db)):
    ip = req.client.host if req.client else "unknown"
    user_agent = req.headers.get("user-agent", "unknown")
    
    user = db.query(User).filter(User.email == request.email).first()
    
    # Log attempt
    attempt = LoginAttempt(
        email=request.email,
        ip_address=ip,
        user_agent=user_agent,
        success=False
    )
    
    if not user:
        db.add(attempt)
        db.commit()
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    # Check if account is locked
    if user.locked_until and user.locked_until > datetime.utcnow():
        remaining = int((user.locked_until - datetime.utcnow()).total_seconds() / 60)
        raise HTTPException(status_code=423, detail=f"Account locked. Try again in {remaining} minutes")
    
    # Check if email is verified
    if not user.email_verified:
        raise HTTPException(status_code=403, detail="Email not verified. Check your inbox")
    
    # Verify password
    if not pwd_context.verify(request.password, user.password_hash):
        user.failed_login_attempts += 1
        
        if user.failed_login_attempts >= LOCKOUT_THRESHOLD:
            user.locked_until = datetime.utcnow() + timedelta(minutes=LOCKOUT_DURATION)
            db.commit()
            db.add(attempt)
            db.commit()
            log_security_event(db, "account_locked", user.id, user.tenant_id, ip, {"reason": "failed_attempts"})
            raise HTTPException(status_code=423, detail=f"Account locked for {LOCKOUT_DURATION} minutes due to failed login attempts")
        
        db.commit()
        db.add(attempt)
        db.commit()
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    # Reset failed attempts on successful login
    user.failed_login_attempts = 0
    user.locked_until = None
    user.last_login_at = datetime.utcnow()
    user.last_login_ip = ip
    attempt.success = True
    db.commit()
    db.add(attempt)
    
    # Create session
    token_data = {
        "sub": user.email,
        "user_id": str(user.id),
        "tenant_id": user.tenant_id,
        "role": user.role,
        "exp": datetime.utcnow() + timedelta(hours=1),
    }
    access_token = jwt.encode(token_data, SECRET_KEY, algorithm=ALGORITHM)
    token_hash = hashlib.sha256(access_token.encode()).hexdigest()
    
    session = SessionModel(
        user_id=user.id,
        token_hash=token_hash,
        ip_address=ip,
        user_agent=user_agent,
        device_info=user_agent.split('/')[0] if '/' in user_agent else 'Unknown',
        expires_at=datetime.utcnow() + timedelta(hours=1)
    )
    db.add(session)
    
    # Log activity
    activity = UserActivity(
        user_id=user.id,
        action="login",
        resource_type="session",
        resource_id=str(session.id) if session.id else None,
        details=f"User logged in from {ip}",
        ip_address=ip,
        user_agent=user_agent
    )
    db.add(activity)
    db.commit()
    
    refresh_token_data = {
        "sub": user.email,
        "type": "refresh",
        "exp": datetime.utcnow() + timedelta(days=7),
    }
    refresh_token = jwt.encode(refresh_token_data, SECRET_KEY, algorithm=ALGORITHM)
    
    log_security_event(db, "login", user.id, user.tenant_id, ip)
    
    return AuthResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        user_id=str(user.id),
        tenant_id=user.tenant_id,
        role=user.role,
        email=user.email,
    )


@router.post("/signup", response_model=AuthResponse)
async def signup(request: SignupRequest, req: Request, db: Session = Depends(get_db)):
    ip = req.client.host if req.client else "unknown"
    
    # Check honeypot
    if request.honeypot:
        # Log honeypot detection
        from api.models.database_models import HoneypotDetection
        detection = HoneypotDetection(
            ip_address=ip,
            user_agent=req.headers.get('user-agent', ''),
            email=request.email,
            honeypot_value=request.honeypot
        )
        db.add(detection)
        db.commit()
        
        # Return fake success to not alert bot
        raise HTTPException(status_code=400, detail="Invalid request")
    
    if db.query(User).filter(User.email == request.email).first():
        raise HTTPException(status_code=400, detail="Email already registered")
    
    tenant_id = f"tenant-{db.query(User).count() + 1:03d}"
    verification_token = jwt.encode({"email": request.email, "exp": datetime.utcnow() + timedelta(days=1)}, SECRET_KEY, algorithm=ALGORITHM)
    
    user = User(
        email=request.email,
        password_hash=pwd_context.hash(request.password),
        role="tenant",
        tenant_id=tenant_id,
        verification_token=verification_token,
        email_verified=False
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    
    # Store password in history
    pwd_history = PasswordHistory(user_id=user.id, password_hash=user.password_hash)
    db.add(pwd_history)
    db.commit()
    
    log_security_event(db, "signup", user.id, tenant_id, ip)
    
    # TODO: Send verification email
    print(f"Verification token for {request.email}: {verification_token}")
    
    # For demo, auto-verify
    user.email_verified = True
    db.commit()
    
    token_data = {
        "sub": request.email,
        "user_id": str(user.id),
        "tenant_id": tenant_id,
        "role": "tenant",
        "exp": datetime.utcnow() + timedelta(hours=1),
    }
    
    access_token = jwt.encode(token_data, SECRET_KEY, algorithm=ALGORITHM)
    
    refresh_token_data = {
        "sub": request.email,
        "type": "refresh",
        "exp": datetime.utcnow() + timedelta(days=7),
    }
    refresh_token = jwt.encode(refresh_token_data, SECRET_KEY, algorithm=ALGORITHM)
    
    return AuthResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        user_id=str(user.id),
        tenant_id=tenant_id,
        role="tenant",
        email=request.email,
    )


RESET_TOKENS = {}
MAGIC_LINKS = {}


class PasswordResetRequest(BaseModel):
    email: EmailStr


class PasswordResetConfirm(BaseModel):
    token: str
    new_password: str


class PasswordUpdateRequest(BaseModel):
    current_password: str
    new_password: str


async def check_password_breach(password: str) -> bool:
    """Check if password has been breached using Have I Been Pwned API"""
    import hashlib
    sha1_hash = hashlib.sha1(password.encode()).hexdigest().upper()
    prefix, suffix = sha1_hash[:5], sha1_hash[5:]
    
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(f"https://api.pwnedpasswords.com/range/{prefix}")
            if suffix in response.text:
                return True
    except:
        pass
    return False


@router.post("/password-reset")
async def request_password_reset(request: PasswordResetRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == request.email).first()
    
    if not user:
        return {"message": "If email exists, reset link sent"}
    
    reset_token = jwt.encode(
        {"email": request.email, "exp": datetime.utcnow() + timedelta(hours=1)},
        SECRET_KEY,
        algorithm=ALGORITHM
    )
    
    RESET_TOKENS[reset_token] = request.email
    
    # TODO: Send email with reset link
    print(f"Reset token for {request.email}: {reset_token}")
    
    return {"message": "If email exists, reset link sent"}


@router.post("/password-reset-confirm")
async def confirm_password_reset(request: PasswordResetConfirm, req: Request, db: Session = Depends(get_db)):
    ip = req.client.host if req.client else "unknown"
    
    try:
        payload = jwt.decode(request.token, SECRET_KEY, algorithms=[ALGORITHM])
        email = payload.get("email")
        
        user = db.query(User).filter(User.email == email).first()
        
        if not user or request.token not in RESET_TOKENS:
            raise HTTPException(status_code=400, detail="Invalid or expired token")
        
        # Check password strength
        if len(request.new_password) < 8:
            raise HTTPException(status_code=400, detail="Password must be at least 8 characters")
        
        # Check if password has been breached
        if await check_password_breach(request.new_password):
            raise HTTPException(status_code=400, detail="This password has been found in data breaches. Please choose a different password")
        
        # Check password history
        recent_passwords = db.query(PasswordHistory).filter(
            PasswordHistory.user_id == user.id
        ).order_by(PasswordHistory.created_at.desc()).limit(5).all()
        
        for pwd_hist in recent_passwords:
            if pwd_context.verify(request.new_password, pwd_hist.password_hash):
                raise HTTPException(status_code=400, detail="Cannot reuse recent passwords")
        
        user.password_hash = pwd_context.hash(request.new_password)
        db.commit()
        
        # Add to history
        pwd_history = PasswordHistory(user_id=user.id, password_hash=user.password_hash)
        db.add(pwd_history)
        db.commit()
        
        del RESET_TOKENS[request.token]
        
        log_security_event(db, "password_reset", user.id, user.tenant_id, ip)
        
        return {"message": "Password reset successful"}
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=400, detail="Invalid or expired token")


@router.post("/password-update")
async def update_password(request: PasswordUpdateRequest, req: Request, db: Session = Depends(get_db)):
    """Update password with security checks"""
    ip = req.client.host if req.client else "unknown"
    auth_header = req.headers.get("authorization", "")
    
    if not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    token = auth_header[7:]
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email = payload.get("sub")
        user = db.query(User).filter(User.email == email).first()
        
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Verify current password
        if not pwd_context.verify(request.current_password, user.password_hash):
            raise HTTPException(status_code=401, detail="Current password is incorrect")
        
        # Check password strength
        if len(request.new_password) < 8:
            raise HTTPException(status_code=400, detail="Password must be at least 8 characters")
        
        # Check if password has been breached
        if await check_password_breach(request.new_password):
            raise HTTPException(status_code=400, detail="This password has been found in data breaches. Please choose a different password")
        
        # Check password history (last 5 passwords)
        recent_passwords = db.query(PasswordHistory).filter(
            PasswordHistory.user_id == user.id
        ).order_by(PasswordHistory.created_at.desc()).limit(5).all()
        
        for pwd_hist in recent_passwords:
            if pwd_context.verify(request.new_password, pwd_hist.password_hash):
                raise HTTPException(status_code=400, detail="Cannot reuse any of your last 5 passwords")
        
        # Update password
        user.password_hash = pwd_context.hash(request.new_password)
        db.commit()
        
        # Add to password history
        pwd_history = PasswordHistory(user_id=user.id, password_hash=user.password_hash)
        db.add(pwd_history)
        db.commit()
        
        log_security_event(db, "password_change", user.id, user.tenant_id, ip)
        
        return {"message": "Password updated successfully"}
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")


class RefreshTokenRequest(BaseModel):
    refresh_token: str


@router.post("/refresh", response_model=AuthResponse)
async def refresh_token(request: RefreshTokenRequest, db: Session = Depends(get_db)):
    try:
        payload = jwt.decode(request.refresh_token, SECRET_KEY, algorithms=[ALGORITHM])
        
        if payload.get("type") != "refresh":
            raise HTTPException(status_code=401, detail="Invalid refresh token")
        
        email = payload.get("sub")
        user = db.query(User).filter(User.email == email).first()
        
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        
        token_data = {
            "sub": user.email,
            "user_id": str(user.id),
            "tenant_id": user.tenant_id,
            "role": user.role,
            "exp": datetime.utcnow() + timedelta(hours=1),
        }
        
        access_token = jwt.encode(token_data, SECRET_KEY, algorithm=ALGORITHM)
        
        return AuthResponse(
            access_token=access_token,
            refresh_token=request.refresh_token,
            user_id=str(user.id),
            tenant_id=user.tenant_id,
            role=user.role,
            email=user.email,
        )
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid refresh token")


class VerifyEmailRequest(BaseModel):
    token: str


@router.post("/verify-email")
async def verify_email(request: VerifyEmailRequest, db: Session = Depends(get_db)):
    try:
        payload = jwt.decode(request.token, SECRET_KEY, algorithms=[ALGORITHM])
        email = payload.get("email")
        
        user = db.query(User).filter(User.email == email, User.verification_token == request.token).first()
        
        if not user:
            raise HTTPException(status_code=400, detail="Invalid or expired token")
        
        user.email_verified = True
        user.verification_token = None
        db.commit()
        
        log_security_event(db, "email_verified", user.id, user.tenant_id, None)
        
        return {"message": "Email verified successfully"}
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=400, detail="Invalid or expired token")


@router.post("/logout")
async def logout(req: Request, db: Session = Depends(get_db)):
    ip = req.client.host if req.client else "unknown"
    auth_header = req.headers.get("authorization", "")
    
    if auth_header.startswith("Bearer "):
        token = auth_header[7:]
        try:
            payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
            user_id = payload.get("user_id")
            tenant_id = payload.get("tenant_id")
            
            # Delete session
            token_hash = hashlib.sha256(token.encode()).hexdigest()
            session = db.query(SessionModel).filter(
                SessionModel.user_id == int(user_id),
                SessionModel.token_hash == token_hash
            ).first()
            
            if session:
                db.delete(session)
            
            # Log activity
            activity = UserActivity(
                user_id=int(user_id) if user_id else None,
                action="logout",
                resource_type="session",
                resource_id=str(session.id) if session else None,
                details=f"User logged out from {ip}",
                ip_address=ip,
                user_agent=req.headers.get("user-agent", "unknown")
            )
            db.add(activity)
            db.commit()
            
            log_security_event(db, "logout", int(user_id) if user_id else None, tenant_id, ip)
        except:
            pass
    
    return {"message": "Logged out successfully"}


class MagicLinkRequest(BaseModel):
    email: EmailStr


class MagicLinkVerify(BaseModel):
    token: str


@router.post("/magic-link")
async def request_magic_link(request: MagicLinkRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == request.email).first()
    
    if not user:
        return {"message": "If email exists, magic link sent"}
    
    magic_token = jwt.encode(
        {"email": request.email, "exp": datetime.utcnow() + timedelta(minutes=15)},
        SECRET_KEY,
        algorithm=ALGORITHM
    )
    
    MAGIC_LINKS[magic_token] = request.email
    
    # TODO: Send email with magic link
    print(f"Magic link for {request.email}: http://localhost:3000/magic-login?token={magic_token}")
    
    return {"message": "If email exists, magic link sent"}


@router.post("/magic-link-verify", response_model=AuthResponse)
async def verify_magic_link(request: MagicLinkVerify, req: Request, db: Session = Depends(get_db)):
    ip = req.client.host if req.client else "unknown"
    
    try:
        payload = jwt.decode(request.token, SECRET_KEY, algorithms=[ALGORITHM])
        email = payload.get("email")
        
        if request.token not in MAGIC_LINKS:
            raise HTTPException(status_code=400, detail="Invalid or expired magic link")
        
        user = db.query(User).filter(User.email == email).first()
        
        if not user:
            raise HTTPException(status_code=400, detail="User not found")
        
        del MAGIC_LINKS[request.token]
        
        log_security_event(db, "magic_link_login", user.id, user.tenant_id, ip)
        
        token_data = {
            "sub": user.email,
            "user_id": str(user.id),
            "tenant_id": user.tenant_id,
            "role": user.role,
            "exp": datetime.utcnow() + timedelta(hours=1),
        }
        
        access_token = jwt.encode(token_data, SECRET_KEY, algorithm=ALGORITHM)
        
        refresh_token_data = {
            "sub": user.email,
            "type": "refresh",
            "exp": datetime.utcnow() + timedelta(days=7),
        }
        refresh_token = jwt.encode(refresh_token_data, SECRET_KEY, algorithm=ALGORITHM)
        
        return AuthResponse(
            access_token=access_token,
            refresh_token=refresh_token,
            user_id=str(user.id),
            tenant_id=user.tenant_id,
            role=user.role,
            email=user.email,
        )
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=400, detail="Invalid or expired magic link")


class OAuthCallbackRequest(BaseModel):
    code: str
    provider: str


@router.get("/oauth/{provider}")
async def oauth_login(provider: str):
    if provider == "google":
        if not settings.GOOGLE_CLIENT_ID:
            raise HTTPException(status_code=501, detail="Google OAuth not configured")
        auth_url = f"https://accounts.google.com/o/oauth2/v2/auth?client_id={settings.GOOGLE_CLIENT_ID}&redirect_uri={settings.OAUTH_REDIRECT_URI}&response_type=code&scope=openid email profile"
        return {"auth_url": auth_url}
    elif provider == "github":
        if not settings.GITHUB_CLIENT_ID:
            raise HTTPException(status_code=501, detail="GitHub OAuth not configured")
        auth_url = f"https://github.com/login/oauth/authorize?client_id={settings.GITHUB_CLIENT_ID}&redirect_uri={settings.OAUTH_REDIRECT_URI}&scope=user:email"
        return {"auth_url": auth_url}
    else:
        raise HTTPException(status_code=400, detail="Unsupported provider")


@router.post("/oauth/callback", response_model=AuthResponse)
async def oauth_callback(request: OAuthCallbackRequest, req: Request, db: Session = Depends(get_db)):
    ip = req.client.host if req.client else "unknown"
    
    async with httpx.AsyncClient() as client:
        if request.provider == "google":
            token_response = await client.post(
                "https://oauth2.googleapis.com/token",
                data={
                    "code": request.code,
                    "client_id": settings.GOOGLE_CLIENT_ID,
                    "client_secret": settings.GOOGLE_CLIENT_SECRET,
                    "redirect_uri": settings.OAUTH_REDIRECT_URI,
                    "grant_type": "authorization_code"
                }
            )
            token_data = token_response.json()
            user_response = await client.get(
                "https://www.googleapis.com/oauth2/v2/userinfo",
                headers={"Authorization": f"Bearer {token_data['access_token']}"}
            )
            user_info = user_response.json()
            email = user_info["email"]
            
        elif request.provider == "github":
            token_response = await client.post(
                "https://github.com/login/oauth/access_token",
                data={
                    "code": request.code,
                    "client_id": settings.GITHUB_CLIENT_ID,
                    "client_secret": settings.GITHUB_CLIENT_SECRET,
                    "redirect_uri": settings.OAUTH_REDIRECT_URI
                },
                headers={"Accept": "application/json"}
            )
            token_data = token_response.json()
            user_response = await client.get(
                "https://api.github.com/user",
                headers={"Authorization": f"Bearer {token_data['access_token']}"}
            )
            user_info = user_response.json()
            
            # Get primary email
            email_response = await client.get(
                "https://api.github.com/user/emails",
                headers={"Authorization": f"Bearer {token_data['access_token']}"}
            )
            emails = email_response.json()
            email = next((e["email"] for e in emails if e["primary"]), emails[0]["email"])
        else:
            raise HTTPException(status_code=400, detail="Unsupported provider")
    
    # Find or create user
    user = db.query(User).filter(User.email == email).first()
    
    if not user:
        tenant_id = f"tenant-{db.query(User).count() + 1:03d}"
        user = User(
            email=email,
            password_hash=pwd_context.hash(os.urandom(32).hex()),  # Random password
            role="tenant",
            tenant_id=tenant_id,
            email_verified=True,
            oauth_provider=request.provider
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        log_security_event(db, "oauth_signup", user.id, tenant_id, ip, {"provider": request.provider})
    else:
        log_security_event(db, "oauth_login", user.id, user.tenant_id, ip, {"provider": request.provider})
    
    token_data = {
        "sub": user.email,
        "user_id": str(user.id),
        "tenant_id": user.tenant_id,
        "role": user.role,
        "exp": datetime.utcnow() + timedelta(hours=1),
    }
    
    access_token = jwt.encode(token_data, SECRET_KEY, algorithm=ALGORITHM)
    
    refresh_token_data = {
        "sub": user.email,
        "type": "refresh",
        "exp": datetime.utcnow() + timedelta(days=7),
    }
    refresh_token = jwt.encode(refresh_token_data, SECRET_KEY, algorithm=ALGORITHM)
    
    return AuthResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        user_id=str(user.id),
        tenant_id=user.tenant_id,
        role=user.role,
        email=user.email,
    )
