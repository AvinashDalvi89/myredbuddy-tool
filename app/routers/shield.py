"""
Reputation Shield Endpoints - Content Protection
"""

from fastapi import APIRouter, HTTPException

from app.models import ShieldCheckRequest, OpportunityRequest
from app.config import settings
from app.services.storage import (
    get_active_profile,
    get_profile_data_path,
    load_json_file,
)

# Import from existing reputation_shield module
try:
    from reputation_shield import (
        full_shield_check,
        preflight_check,
        analyze_history_for_cleanup,
        check_rate_limit_risk,
        extract_subreddit_constraints,
        find_unanswered_opportunities,
    )
    SHIELD_AVAILABLE = True
except ImportError:
    SHIELD_AVAILABLE = False
    print("⚠ reputation_shield module not found. Shield endpoints will be limited.")

router = APIRouter(prefix="/api/shield", tags=["Shield"])


def get_insights_for_shield():
    """Get removal insights to enhance shield checks."""
    import os
    from app.routers.insights import get_removal_history

    try:
        history = get_removal_history()
        removals = history.get("removals", [])

        if not removals:
            return None

        patterns = history.get("patterns", {})
        high_risk_subreddits = list(patterns.get("by_subreddit", {}).keys())

        return {
            "total_removals": len(removals),
            "high_risk_subreddits": high_risk_subreddits[:5],
            "checked": True,
        }
    except Exception:
        return None


@router.post("/check")
def shield_check(req: ShieldCheckRequest):
    """
    Full shield check - comprehensive content analysis.
    Checks rules, spam patterns, tone, and removal history.
    """
    if not SHIELD_AVAILABLE:
        raise HTTPException(
            status_code=501,
            detail="Shield module not available. Make sure reputation_shield.py exists.",
        )

    # Get user's history for context
    active_profile = get_active_profile()
    history_items = []
    if active_profile:
        extracted_path = get_profile_data_path(active_profile, "extracted_data.json")
        data = load_json_file(extracted_path)
        if data:
            history_items = data.get("posts", []) + data.get("comments", [])

    # Run shield check
    result = full_shield_check(
        text=req.text,
        subreddit=req.subreddit,
        content_type=req.content_type,
        history=history_items,
    )

    # Add removal insights
    insights = get_insights_for_shield()
    if insights:
        result["removal_history"] = insights

        # Add warning if posting to high-risk subreddit
        if req.subreddit.lower() in [s.lower() for s in insights.get("high_risk_subreddits", [])]:
            if "insights_warnings" not in result:
                result["insights_warnings"] = []
            result["insights_warnings"].append({
                "type": "high_risk_subreddit",
                "message": f"You have had content removed from r/{req.subreddit} before. Review carefully.",
            })

    return result


@router.post("/preflight")
def preflight(req: ShieldCheckRequest):
    """
    Quick preflight check - faster, lighter analysis.
    Good for real-time checking while typing.
    """
    if not SHIELD_AVAILABLE:
        return {
            "status": "unavailable",
            "message": "Shield module not available",
        }

    result = preflight_check(
        text=req.text,
        subreddit=req.subreddit,
    )

    return result


@router.post("/cleanup")
def analyze_cleanup():
    """
    Analyze user's posting history for potentially risky content.
    Helps identify old posts that might get reported.
    """
    if not SHIELD_AVAILABLE:
        raise HTTPException(
            status_code=501,
            detail="Shield module not available.",
        )

    active_profile = get_active_profile()
    if not active_profile:
        raise HTTPException(
            status_code=400,
            detail="No active profile. Import data first.",
        )

    extracted_path = get_profile_data_path(active_profile, "extracted_data.json")
    data = load_json_file(extracted_path)

    if not data:
        raise HTTPException(
            status_code=404,
            detail="No data found for analysis.",
        )

    history_items = data.get("posts", []) + data.get("comments", [])

    result = analyze_history_for_cleanup(history_items)

    return result


@router.get("/rate-limit")
def rate_limit_status():
    """
    Check rate limit risk based on recent posting activity.
    """
    if not SHIELD_AVAILABLE:
        return {
            "status": "unavailable",
            "message": "Shield module not available",
        }

    active_profile = get_active_profile()
    if not active_profile:
        return {
            "risk": "unknown",
            "message": "No profile data to analyze",
        }

    extracted_path = get_profile_data_path(active_profile, "extracted_data.json")
    data = load_json_file(extracted_path)

    if not data:
        return {
            "risk": "unknown",
            "message": "No data to analyze",
        }

    history_items = data.get("posts", []) + data.get("comments", [])

    result = check_rate_limit_risk(history_items)

    return result


@router.post("/opportunities")
def find_opportunities(req: OpportunityRequest):
    """
    Find unanswered questions/opportunities in a subreddit.
    Great for finding posts to engage with.
    """
    if not SHIELD_AVAILABLE:
        raise HTTPException(
            status_code=501,
            detail="Shield module not available.",
        )

    # Fetch posts from the subreddit first
    from app.services.reddit import fetch_subreddit_posts

    try:
        posts = fetch_subreddit_posts(req.subreddit, limit=req.limit)
    except Exception as e:
        raise HTTPException(
            status_code=502,
            detail=f"Failed to fetch posts from r/{req.subreddit}: {str(e)}",
        )

    opportunities = find_unanswered_opportunities(posts=posts)

    return {
        "subreddit": req.subreddit,
        "opportunities": opportunities,
        "count": len(opportunities),
    }


@router.post("/constraints")
def get_constraints(data: dict):
    """
    Extract posting constraints for a subreddit.
    Useful for understanding subreddit rules.
    """
    if not SHIELD_AVAILABLE:
        raise HTTPException(
            status_code=501,
            detail="Shield module not available.",
        )

    subreddit = data.get("subreddit", "")
    if not subreddit:
        raise HTTPException(
            status_code=400,
            detail="Subreddit is required",
        )

    # Fetch posts from the subreddit to analyze
    from app.services.reddit import fetch_subreddit_posts

    try:
        posts = fetch_subreddit_posts(subreddit, limit=50)
    except Exception as e:
        raise HTTPException(
            status_code=502,
            detail=f"Failed to fetch posts from r/{subreddit}: {str(e)}",
        )

    constraints = extract_subreddit_constraints(posts=posts)

    return {
        "subreddit": subreddit,
        "constraints": constraints,
    }
