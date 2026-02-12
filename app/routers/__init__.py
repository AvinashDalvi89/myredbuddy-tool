"""
Routers Package - API Endpoint Handlers
"""

from app.routers.profiles import router as profiles_router
from app.routers.imports import router as imports_router
from app.routers.insights import router as insights_router
from app.routers.shield import router as shield_router
from app.routers.ai import router as ai_router
from app.routers.health import router as health_router
from app.routers.agent_skills import router as agent_skills_router

__all__ = [
    "profiles_router",
    "imports_router",
    "insights_router",
    "shield_router",
    "ai_router",
    "health_router",
    "agent_skills_router",
]
