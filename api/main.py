"""
LuxeBrain AI - Main API Application
Copyright © 2024 Paksa IT Solutions. All Rights Reserved.
"""

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager
import time

from api.routes import recommendations, forecasting, segmentation, pricing, visual_search, webhooks, auth, pool_monitoring, usage_monitoring, plan_limits, feature_gates, stripe_webhooks, billing, admin_billing, metering, admin_features, logs, model_versions, anomalies, db_monitoring, batch, undo, bot_detection, rate_limit, api_logs, slow_queries, deprecated_apis, analytics, security_logs
from api.middleware.rate_limiter import RateLimitMiddleware
from api.middleware.auth import AuthMiddleware
from api.middleware.validation import InputValidationMiddleware
from api.middleware.logging import RequestLoggingMiddleware
from api.middleware.error_tracking import ErrorTrackingMiddleware
from api.middleware.tenant_context import TenantContextMiddleware
from api.middleware.tenant_isolation import TenantIsolationMiddleware
from api.middleware.csrf import CSRFMiddleware
from api.middleware.usage_tracking import UsageTrackingMiddleware
from api.middleware.plan_limits import PlanLimitsMiddleware
from api.middleware.request_id import RequestIDMiddleware
from api.middleware.deprecation import DeprecationMiddleware
from config.settings import settings
import os


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan events"""
    print("🚀 LuxeBrain AI starting up...")
    
    # Create required directories
    os.makedirs("logs", exist_ok=True)
    os.makedirs("models/tenant_models", exist_ok=True)
    
    # Start usage metering scheduler
    from api.utils.usage_scheduler import start_scheduler, stop_scheduler
    start_scheduler()
    
    yield
    
    # Graceful shutdown
    print("🛑 LuxeBrain AI shutting down...")
    
    # Stop scheduler
    stop_scheduler()
    
    # Close database connections
    from config.database import engine
    engine.dispose()
    print("✅ Database connections closed")
    
    # Wait for pending requests (handled by uvicorn timeout)
    print("✅ Graceful shutdown complete")


app = FastAPI(
    title="LuxeBrain AI",
    description="AI-Driven Automation System for Women's Fashion eCommerce",
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs" if settings.DEBUG else None,
    redoc_url="/redoc" if settings.DEBUG else None
)

# CORS Middleware
allowed_origins = [
    "http://localhost:3000",
    "http://localhost:3001",
    "http://localhost:3002",
]

if settings.APP_ENV == "production":
    allowed_origins = [
        "https://app.luxebrain.ai",
        "https://admin.luxebrain.ai",
        "https://luxebrain.ai",
    ]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Security Headers Middleware
@app.middleware("http")
async def add_security_headers(request: Request, call_next):
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
    response.headers["Content-Security-Policy"] = "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'"
    return response

# GZip Compression Middleware
from fastapi.middleware.gzip import GZipMiddleware
app.add_middleware(GZipMiddleware, minimum_size=1000)

# Custom Middleware
app.add_middleware(DeprecationMiddleware)
app.add_middleware(PerformanceMiddleware, slow_threshold=1.0)
app.add_middleware(BotDetectionMiddleware)
app.add_middleware(RequestIDMiddleware)
app.add_middleware(UsageTrackingMiddleware)
app.add_middleware(PlanLimitsMiddleware)
app.add_middleware(ErrorTrackingMiddleware)
app.add_middleware(TenantIsolationMiddleware)
app.add_middleware(CSRFMiddleware)
app.add_middleware(RequestLoggingMiddleware)
app.add_middleware(TenantContextMiddleware)
app.add_middleware(InputValidationMiddleware)
app.add_middleware(RateLimitMiddleware)
app.add_middleware(AuthMiddleware)


@app.middleware("http")
async def add_process_time_header(request: Request, call_next):
    """Add processing time to response headers"""
    start_time = time.time()
    response = await call_next(request)
    process_time = time.time() - start_time
    response.headers["X-Process-Time"] = str(process_time)
    return response


@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "name": "LuxeBrain AI",
        "version": "1.0.0",
        "copyright": "© 2024 Paksa IT Solutions",
        "status": "operational"
    }


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "timestamp": time.time()}


@app.get("/health/db")
async def database_health_check():
    """Database health check endpoint"""
    from config.database import get_db_health
    return get_db_health()


@app.get("/ready")
async def readiness_probe():
    """Readiness probe for Kubernetes"""
    from config.database import get_db_health
    import redis
    
    checks = {
        "database": get_db_health(),
        "redis": {"status": "healthy"},
        "ml_models": {"status": "healthy"}
    }
    
    try:
        redis_client = redis.from_url("redis://localhost:6379/0")
        redis_client.ping()
    except:
        checks["redis"] = {"status": "unhealthy"}
    
    all_healthy = all(c["status"] == "healthy" for c in checks.values())
    status_code = 200 if all_healthy else 503
    
    return JSONResponse(status_code=status_code, content=checks)


@app.get("/alive")
async def liveness_probe():
    """Liveness probe for Kubernetes"""
    return {"status": "alive"}


@app.get("/startup")
async def startup_probe():
    """Startup probe for Kubernetes"""
    return {"status": "ready"}


# Include routers
app.include_router(auth.router)
app.include_router(batch.router)
app.include_router(undo.router)
app.include_router(bot_detection.router)
app.include_router(rate_limit.router)
app.include_router(api_logs.router)
app.include_router(slow_queries.router)
app.include_router(deprecated_apis.router)
app.include_router(analytics.router)
app.include_router(security_logs.router)
app.include_router(stripe_webhooks.router)
app.include_router(billing.router)
app.include_router(admin_billing.router)
app.include_router(admin_features.router)
app.include_router(logs.router)
app.include_router(metering.router)
app.include_router(pool_monitoring.router)
app.include_router(usage_monitoring.router)
app.include_router(plan_limits.router)
app.include_router(feature_gates.router)
app.include_router(db_monitoring.router)
app.include_router(model_versions.router, prefix="/api/admin/models", tags=["Model Versions"])
app.include_router(anomalies.router, tags=["Anomalies"])
app.include_router(recommendations.router, prefix="/api/v1/recommendations", tags=["Recommendations"])
app.include_router(forecasting.router, prefix="/api/v1/forecasting", tags=["Forecasting"])
app.include_router(segmentation.router, prefix="/api/v1/segmentation", tags=["Segmentation"])
app.include_router(pricing.router, prefix="/api/v1/pricing", tags=["Pricing"])
app.include_router(visual_search.router, prefix="/api/v1/visual-search", tags=["Visual Search"])
app.include_router(webhooks.router, prefix="/api/v1/webhooks", tags=["Webhooks"])


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """Global exception handler"""
    return JSONResponse(
        status_code=500,
        content={"error": "Internal server error", "detail": str(exc)}
    )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host=settings.API_HOST,
        port=settings.API_PORT,
        reload=settings.DEBUG,
        timeout_graceful_shutdown=30
    )
