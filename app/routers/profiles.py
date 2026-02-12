"""
Profile Management Endpoints
"""

from fastapi import APIRouter, HTTPException

from app.models import ProfileCreateRequest, ProfileSwitchRequest
from app.config import settings
from app.services.storage import (
    get_profile_index,
    save_profile_index,
    get_profile_dir,
    ensure_profile_exists,
    list_profiles,
    delete_profile,
    export_profile,
    import_profile_backup,
    sync_dashboard_data,
    set_active_profile,
    create_profile,
)

router = APIRouter(prefix="/api/profiles", tags=["Profiles"])


@router.get("")
def get_profiles():
    """
    List all profiles and show the active one.
    Also shows data storage location for user reference.
    """
    index = get_profile_index()
    profiles = list_profiles()

    return {
        "active_profile": index.get("active_profile"),
        "profiles": profiles,
        "data_location": settings.PROFILES_DIR,
        "total_profiles": len(profiles),
    }


@router.post("")
def create_new_profile(req: ProfileCreateRequest):
    """
    Create a new profile for a Reddit account.
    Requires user to confirm it's their own account.
    """
    if not req.confirm_own_account:
        raise HTTPException(
            status_code=400,
            detail="Please confirm this is your own Reddit account. This tool is designed for self-analysis only.",
        )

    username = req.username.strip().replace("u/", "").replace("/", "").lower()
    if not username:
        raise HTTPException(status_code=400, detail="Username is required")

    index = get_profile_index()
    existing = [p for p in index.get("profiles", []) if p.get("username") == username]

    if existing:
        # Just switch to it
        set_active_profile(username)
        sync_dashboard_data(username)
        return {
            "success": True,
            "message": f"Switched to existing profile: {username}",
            "username": username,
            "is_new": False,
        }

    # Create new profile
    create_profile(username)
    set_active_profile(username)

    return {
        "success": True,
        "message": f"Created new profile: {username}",
        "username": username,
        "is_new": True,
        "profile_location": get_profile_dir(username),
    }


@router.put("/active")
def switch_active_profile(req: ProfileSwitchRequest):
    """Switch to a different profile."""
    username = req.username.strip().lower()
    index = get_profile_index()

    existing = [p for p in index.get("profiles", []) if p.get("username") == username]
    if not existing:
        raise HTTPException(status_code=404, detail=f"Profile not found: {username}")

    set_active_profile(username)
    sync_dashboard_data(username)

    return {
        "success": True,
        "message": f"Switched to profile: {username}",
        "active_profile": username,
    }


@router.delete("/{username}")
def remove_profile(username: str):
    """
    Delete a profile. Requires confirmation.
    Does NOT delete data files - user can manually delete from disk.
    """
    username = username.strip().lower()

    if not delete_profile(username):
        raise HTTPException(status_code=404, detail=f"Profile not found: {username}")

    return {
        "success": True,
        "message": f"Profile removed from list: {username}. Data files preserved at: {get_profile_dir(username)}",
        "data_location": get_profile_dir(username),
        "note": "Data files are NOT deleted. Delete manually if needed.",
    }


@router.get("/export/{username}")
def export_profile_data(username: str):
    """
    Export all data for a profile as a single JSON bundle.
    User can save this for backup.
    """
    import os

    username = username.strip().lower()
    profile_dir = get_profile_dir(username)

    if not os.path.exists(profile_dir):
        raise HTTPException(status_code=404, detail=f"Profile not found: {username}")

    return export_profile(username)


@router.post("/import")
def import_profile_data(data: dict):
    """Import a previously exported profile backup."""
    username = data.get("username", "").strip().lower()

    if not username:
        raise HTTPException(status_code=400, detail="Username is required in export data")

    imported_username = import_profile_backup(data)

    return {
        "success": True,
        "message": f"Imported profile: {imported_username}",
        "username": imported_username,
        "profile_location": get_profile_dir(imported_username),
    }
