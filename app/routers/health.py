"""
Health and Status Endpoints
"""

from fastapi import APIRouter

from app.config import settings, get_ai_mode, get_ai_model
from app.services.claude import get_ai_status
from app.services.storage import (
    get_profile_index,
    get_active_profile,
    get_profile_dir,
    get_profile_data_path,
    load_json_file,
)

router = APIRouter(tags=["Health"])


@router.get("/health")
def health():
    """Health check endpoint."""
    return {
        "status": "ok",
        "version": settings.API_VERSION,
        "ai_mode": get_ai_mode(),
        "ai_model": get_ai_model(),
    }


@router.get("/api/status")
def api_status():
    """Check what data is loaded, including active profile info."""
    active_profile = get_active_profile()
    profile_index = get_profile_index()

    # Check data in active profile (or fallback to root)
    if active_profile:
        extracted_path = get_profile_data_path(active_profile, "extracted_data.json")
        persona_path = get_profile_data_path(active_profile, "persona.json")
    else:
        import os
        extracted_path = os.path.join(settings.BASE_DIR, "extracted_data.json")
        persona_path = os.path.join(settings.BASE_DIR, "persona.json")

    import os
    has_data = os.path.exists(extracted_path)
    has_persona = os.path.exists(persona_path)
    has_framework = os.path.exists(os.path.join(settings.BASE_DIR, "reddit_framework.md"))

    data_stats = {"posts": 0, "comments": 0}
    if has_data:
        data = load_json_file(extracted_path)
        data_stats = {
            "posts": len(data.get("posts", [])),
            "comments": len(data.get("comments", [])),
        }

    return {
        "has_data": has_data,
        "has_persona": has_persona,
        "has_framework": has_framework,
        "data_stats": data_stats,
        "active_profile": active_profile,
        "total_profiles": len(profile_index.get("profiles", [])),
        "data_location": get_profile_dir(active_profile) if active_profile else settings.BASE_DIR,
        "ai_mode": get_ai_mode(),
        "ai_model": get_ai_model(),
    }


@router.get("/api/ai-config")
def ai_config():
    """Check AI configuration status with setup instructions."""
    return get_ai_status()


@router.get("/api/data-location")
def get_data_location():
    """Show where data is stored so users know their data is safe."""
    active = get_active_profile()
    return {
        "profiles_directory": settings.PROFILES_DIR,
        "active_profile": active,
        "active_profile_location": get_profile_dir(active) if active else None,
        "root_data_directory": settings.BASE_DIR,
        "note": "Your data is stored locally on your machine. Back up the profiles folder to preserve all data.",
    }


@router.get("/api/prompts/status")
def prompts_status():
    """Check which prompts are active and their sources."""
    from app.prompts import list_available_prompts

    prompts = list_available_prompts()

    return {
        "prompts": prompts,
        "customization_guide": "See /prompts/README.md for how to customize prompts",
        "note": "Prompts can be customized via environment variables or files in /prompts/ directory"
    }
