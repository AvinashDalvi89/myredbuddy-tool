"""
Services Package - Business Logic Layer
"""

from app.services.claude import call_claude, get_ai_status
from app.services.reddit import fetch_reddit_json, fetch_user_posts, fetch_user_comments
from app.services.storage import (
    get_profile_index,
    save_profile_index,
    get_active_profile,
    get_profile_dir,
    get_profile_data_path,
    ensure_profile_exists,
    sync_dashboard_data,
    load_json_file,
    save_json_file
)
from app.services.analysis import (
    analyze_items,
    classify_tone,
    classify_topics,
    load_framework,
    load_persona,
    load_subreddit_rules,
    format_subreddit_rules
)

__all__ = [
    # Claude
    "call_claude",
    "get_ai_status",
    # Reddit
    "fetch_reddit_json",
    "fetch_user_posts",
    "fetch_user_comments",
    # Storage
    "get_profile_index",
    "save_profile_index",
    "get_active_profile",
    "get_profile_dir",
    "get_profile_data_path",
    "ensure_profile_exists",
    "sync_dashboard_data",
    "load_json_file",
    "save_json_file",
    # Analysis
    "analyze_items",
    "classify_tone",
    "classify_topics",
    "load_framework",
    "load_persona",
    "load_subreddit_rules",
    "format_subreddit_rules",
]
