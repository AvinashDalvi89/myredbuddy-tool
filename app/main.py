"""
RedBuddy API - Main Application

A modular FastAPI application for Reddit engagement analysis.

Usage:
    uvicorn app.main:app --reload --port 8000

Or run via api.py entry point:
    python api.py
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.routers import (
    health_router,
    profiles_router,
    imports_router,
    insights_router,
    shield_router,
    ai_router,
    agent_skills_router,
)
from app.routers.preview import router as preview_router

# =============================================================================
# Create FastAPI Application
# =============================================================================

app = FastAPI(
    title=settings.API_TITLE,
    description=settings.API_DESCRIPTION,
    version=settings.API_VERSION,
    docs_url="/docs",
    redoc_url="/redoc",
)

# =============================================================================
# CORS Middleware
# =============================================================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# =============================================================================
# Include Routers
# =============================================================================

# Health and status endpoints (no prefix)
app.include_router(health_router)

# Profile management
app.include_router(profiles_router)

# Data import and configuration
app.include_router(imports_router)

# AI-powered analysis and suggestions
app.include_router(ai_router)

# Insights and removal tracking
app.include_router(insights_router)

# Reputation shield
app.include_router(shield_router)

# Agent skills (for AI agent integration)
app.include_router(agent_skills_router)

# Preview API (for landing page - no AI, instant results)
app.include_router(preview_router)


# =============================================================================
# Startup Event
# =============================================================================

@app.on_event("startup")
async def startup_event():
    """Run on application startup."""
    print(f"""
╔══════════════════════════════════════════════════════════════╗
║                    RedBuddy API v{settings.API_VERSION}                    ║
╠══════════════════════════════════════════════════════════════╣
║  Docs:     http://localhost:8000/docs                        ║
║  Status:   http://localhost:8000/api/status                  ║
║  Health:   http://localhost:8000/health                      ║
╚══════════════════════════════════════════════════════════════╝
    """)


# =============================================================================
# Root Endpoint
# =============================================================================

@app.get("/", tags=["Root"])
def root():
    """Root endpoint with API information."""
    return {
        "name": settings.API_TITLE,
        "version": settings.API_VERSION,
        "description": settings.API_DESCRIPTION,
        "docs": "/docs",
        "status": "/api/status",
        "health": "/health",
    }
