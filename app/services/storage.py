"""
Storage Service - Profile and File Management
"""

import json
import os
import shutil
import time
from typing import Optional, Dict, Any, List

from app.config import settings


# =============================================================================
# Generic File Operations
# =============================================================================

def load_json_file(filepath: str, default: Any = None) -> Any:
    """
    Load JSON from a file.

    Args:
        filepath: Path to the JSON file
        default: Default value if file doesn't exist

    Returns:
        Parsed JSON content or default value
    """
    if os.path.exists(filepath):
        with open(filepath, "r") as f:
            return json.load(f)
    return default if default is not None else {}


def save_json_file(filepath: str, data: Any, indent: int = 2) -> None:
    """
    Save data to a JSON file.

    Args:
        filepath: Path to the JSON file
        data: Data to save
        indent: JSON indentation level
    """
    os.makedirs(os.path.dirname(filepath), exist_ok=True)
    with open(filepath, "w") as f:
        json.dump(data, f, indent=indent)


# =============================================================================
# Profile Management
# =============================================================================

def get_profile_index() -> Dict[str, Any]:
    """Load or create the profile index."""
    return load_json_file(
        settings.PROFILE_INDEX_FILE,
        default={"active_profile": None, "profiles": []}
    )


def save_profile_index(index: Dict[str, Any]) -> None:
    """Save the profile index."""
    save_json_file(settings.PROFILE_INDEX_FILE, index)


def get_active_profile() -> Optional[str]:
    """Get the currently active profile username."""
    index = get_profile_index()
    return index.get("active_profile")


def get_profile_dir(username: str) -> str:
    """Get the directory path for a profile."""
    return os.path.join(settings.PROFILES_DIR, username.lower())


def get_profile_data_path(username: str, filename: str) -> str:
    """Get the full path for a file in a profile."""
    return os.path.join(get_profile_dir(username), filename)


def ensure_profile_exists(username: str) -> str:
    """
    Ensure a profile directory exists and return its path.

    Args:
        username: Reddit username

    Returns:
        Path to the profile directory
    """
    profile_dir = get_profile_dir(username)
    os.makedirs(profile_dir, exist_ok=True)
    return profile_dir


def get_active_data_path(filename: str) -> str:
    """
    Get the path for a data file, using active profile if set.
    Falls back to BASE_DIR for backward compatibility.

    Args:
        filename: Name of the file

    Returns:
        Full path to the file
    """
    active = get_active_profile()
    if active:
        profile_path = get_profile_data_path(active, filename)
        profile_dir = os.path.dirname(profile_path)
        if os.path.exists(profile_dir):
            return profile_path
    return os.path.join(settings.BASE_DIR, filename)


def create_profile(username: str) -> Dict[str, Any]:
    """
    Create a new profile.

    Args:
        username: Reddit username

    Returns:
        Profile metadata dict
    """
    username = username.lower()
    ensure_profile_exists(username)

    now = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
    profile = {
        "username": username,
        "created_at": now,
        "last_updated": now,
    }

    index = get_profile_index()
    existing = [p for p in index.get("profiles", []) if p.get("username") == username]

    if not existing:
        index["profiles"].append(profile)
        save_profile_index(index)

    return profile


def update_profile_timestamp(username: str) -> None:
    """Update the last_updated timestamp for a profile."""
    username = username.lower()
    index = get_profile_index()

    for p in index.get("profiles", []):
        if p.get("username") == username:
            p["last_updated"] = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
            break

    save_profile_index(index)


def set_active_profile(username: str) -> None:
    """Set the active profile."""
    username = username.lower()
    index = get_profile_index()
    index["active_profile"] = username
    save_profile_index(index)


def get_profile_stats(username: str) -> Dict[str, int]:
    """Get stats for a profile (post/comment counts)."""
    extracted_path = get_profile_data_path(username, "extracted_data.json")
    data = load_json_file(extracted_path, default={"posts": [], "comments": []})

    return {
        "posts": len(data.get("posts", [])),
        "comments": len(data.get("comments", [])),
    }


def list_profiles() -> List[Dict[str, Any]]:
    """List all profiles with their stats."""
    index = get_profile_index()
    profiles = []

    for profile in index.get("profiles", []):
        username = profile.get("username")
        stats = get_profile_stats(username)

        profiles.append({
            "username": username,
            "created_at": profile.get("created_at"),
            "last_updated": profile.get("last_updated"),
            "stats": stats,
            "is_active": username == index.get("active_profile"),
        })

    return profiles


def delete_profile(username: str) -> bool:
    """
    Remove a profile from the index (data files preserved).

    Args:
        username: Reddit username

    Returns:
        True if profile was found and removed
    """
    username = username.lower()
    index = get_profile_index()
    original_len = len(index.get("profiles", []))

    index["profiles"] = [
        p for p in index.get("profiles", [])
        if p.get("username") != username
    ]

    if index.get("active_profile") == username:
        index["active_profile"] = (
            index["profiles"][0]["username"] if index["profiles"] else None
        )

    save_profile_index(index)
    return len(index["profiles"]) < original_len


def export_profile(username: str) -> Dict[str, Any]:
    """
    Export all data for a profile as a single JSON bundle.

    Args:
        username: Reddit username

    Returns:
        Export data dict with all profile data
    """
    username = username.lower()
    profile_dir = get_profile_dir(username)

    export_data = {
        "username": username,
        "exported_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "data": {},
    }

    for filename in ["extracted_data.json", "removal_history.json", "persona.json", "recommendations.json"]:
        filepath = os.path.join(profile_dir, filename)
        if os.path.exists(filepath):
            key = filename.replace(".json", "")
            export_data["data"][key] = load_json_file(filepath)

    return export_data


def import_profile_backup(data: Dict[str, Any]) -> str:
    """
    Import a previously exported profile backup.

    Args:
        data: Export data dict

    Returns:
        Username of imported profile
    """
    username = data.get("username", "").lower()
    profile_dir = ensure_profile_exists(username)

    for key, content in data.get("data", {}).items():
        filepath = os.path.join(profile_dir, f"{key}.json")
        save_json_file(filepath, content)

    # Add to index if not exists
    create_profile(username)

    return username


# =============================================================================
# Dashboard Sync
# =============================================================================

def sync_dashboard_data(username: str) -> None:
    """
    Sync profile data to dashboard/public for the Next.js frontend.
    Generates data.json with analyzed items.

    Args:
        username: Reddit username
    """
    from app.services.analysis import analyze_items

    profile_dir = get_profile_dir(username)
    dashboard_public = settings.DASHBOARD_PUBLIC_DIR

    if not os.path.exists(dashboard_public):
        return

    # Load and process extracted data
    extracted_path = os.path.join(profile_dir, "extracted_data.json")
    if os.path.exists(extracted_path):
        extracted = load_json_file(extracted_path)

        all_items = extracted.get("posts", []) + extracted.get("comments", [])
        stats = analyze_items(all_items)
        dashboard_data = {"items": all_items, **stats}

        save_json_file(
            os.path.join(dashboard_public, "data.json"),
            dashboard_data
        )

    # Copy recommendations if exists
    recs_path = os.path.join(profile_dir, "recommendations.json")
    if os.path.exists(recs_path):
        shutil.copy(recs_path, os.path.join(dashboard_public, "recommendations.json"))
