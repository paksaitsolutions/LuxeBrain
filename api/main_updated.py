"""
LuxeBrain AI - Main API Application (Updated)
Copyright © 2024 Paksa IT Solutions. All Rights Reserved.
"""

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager
import time

from api.routes import (
    recommendations, forecasting, segmentation, 
    pricing, visual_search, webhooks, chatbot, metrics
)
from api.middleware.rate_limiter import RateLimitMiddleware
from api.middleware.auth import AuthMiddleware
from config.settings import settings


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan events"""
    print("🚀 LuxeBrain AI starting up...")
    print("💰 Revenue optimization engine active")
    yield
    print("🛑 LuxeBrain AI shutting down...")


app = FastAPI(
    title="LuxeBrain AI - Revenue Optimizer",
    description="AI-Driven eCommerce Automation for Maximum Revenue",
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Custom Middleware
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
        "name": "LuxeBrain AI - Revenue Optimizer",
        "version": "1.0.0",
        "copyright": "© 2024 Paksa IT Solutions",
        "status": "operational",
        "features": [
            "Product Recommendations",
            "Dynamic Pricing",
            "Customer Segmentation",
            "Demand Forecasting",
            "Visual Search",
            "AI Chatbot",
            "Marketing Automation"
        ]
    }


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "timestamp": time.time()}


# Include routers
app.include_router(recommendations.router, prefix="/api/v1/recommendations", tags=["Recommendations"])
app.include_router(forecasting.router, prefix="/api/v1/forecasting", tags=["Forecasting"])
app.include_router(segmentation.router, prefix="/api/v1/segmentation", tags=["Segmentation"])
app.include_router(pricing.router, prefix="/api/v1/pricing", tags=["Pricing"])
app.include_router(visual_search.router, prefix="/api/v1/visual-search", tags=["Visual Search"])
app.include_router(webhooks.router, prefix="/api/v1/webhooks", tags=["Webhooks"])
app.include_router(chatbot.router, prefix="/api/v1", tags=["Chatbot"])
app.include_router(metrics.router, prefix="/api/v1", tags=["Metrics"])


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
        reload=settings.DEBUG
    )
