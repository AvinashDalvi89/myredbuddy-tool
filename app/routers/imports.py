"""
Data Import Endpoints
"""

import asyncio
import time
from fastapi import APIRouter, HTTPException

from app.models import ImportUsernameRequest, ImportPasteRequest, PersonaRequest, OnboardingCheckRequest
from app.config import settings
from app.services.reddit import fetch_user_posts, fetch_user_comments, fetch_user_profile
from app.services.storage import (
    get_profile_index,
    save_profile_index,
    get_profile_dir,
    get_profile_data_path,
    ensure_profile_exists,
    set_active_profile,
    create_profile,
    update_profile_timestamp,
    sync_dashboard_data,
    load_json_file,
    save_json_file,
)
from app.services.analysis import (
    analyze_items,
    process_post_for_storage,
    process_comment_for_storage,
)

router = APIRouter(prefix="/api", tags=["Import"])


@router.post("/onboarding/check")
def onboarding_check(req: OnboardingCheckRequest):
    """
    Check a Reddit username and classify the user type for onboarding routing.
    Returns user_type: 'new' | 'experienced' | 'recovery' and a recommended_flow.
    """
    username = req.username.strip().replace("u/", "").replace("/", "")
    profile = fetch_user_profile(username)

    is_suspended = profile.get("is_suspended", False)
    is_banned = profile.get("is_banned", False)
    total_karma = profile.get("total_karma", 0)
    account_age_days = profile.get("account_age_days", 0)

    if is_suspended or is_banned:
        user_type = "recovery"
        recommended_flow = "shield_first"
        message = "Your account has been flagged. Let's help you understand what to avoid and rebuild safely."
    elif total_karma < 500 or account_age_days < 90:
        user_type = "new"
        recommended_flow = "build_persona"
        message = "You're starting fresh — let's build your voice and set up a strong persona before posting."
    else:
        user_type = "experienced"
        recommended_flow = "import_history"
        message = "You've got Reddit history to work with — let's import it and find what's working for you."

    return {
        "username": username,
        "account_age_days": account_age_days,
        "total_karma": total_karma,
        "user_type": user_type,
        "recommended_flow": recommended_flow,
        "message": message,
    }


@router.post("/import/username")
async def import_by_username(req: ImportUsernameRequest):
    """
    Import Reddit data by username using public JSON endpoint.
    No authentication required - fetches public data only.
    MERGES with existing data - updates matching items, adds new ones.
    Auto-creates/switches to a profile for the username.
    """
    username = req.username.strip().replace("u/", "").replace("/", "")
    username_lower = username.lower()

    # Auto-create profile if it doesn't exist
    create_profile(username_lower)
    set_active_profile(username_lower)

    # Use profile-specific path
    profile_dir = get_profile_dir(username_lower)
    extracted_path = get_profile_data_path(username_lower, "extracted_data.json")

    # Load existing data from profile
    existing = load_json_file(extracted_path, default={"posts": [], "comments": []})

    # Build index of existing items by ID
    existing_posts_by_id = {p.get("id"): p for p in existing.get("posts", []) if p.get("id")}
    existing_comments_by_id = {c.get("id"): c for c in existing.get("comments", []) if c.get("id")}

    new_posts = []
    updated_posts = 0
    new_comments = []
    updated_comments = 0

    # Fetch posts and comments in parallel
    posts_data, comments_data = await asyncio.gather(
        asyncio.to_thread(fetch_user_posts, username, req.posts_limit, "new"),
        asyncio.to_thread(fetch_user_comments, username, req.comments_limit, "new"),
        return_exceptions=True,
    )

    # Process posts
    if not isinstance(posts_data, Exception):
        for p in posts_data:
            post_item = process_post_for_storage(p)
            post_id = post_item.get("id")
            if post_id and post_id in existing_posts_by_id:
                existing_posts_by_id[post_id].update(post_item)
                updated_posts += 1
            else:
                new_posts.append(post_item)

    # Process comments
    if not isinstance(comments_data, Exception):
        for c in comments_data:
            comment_item = process_comment_for_storage(c)
            comment_id = comment_item.get("id")
            if comment_id and comment_id in existing_comments_by_id:
                existing_comments_by_id[comment_id].update(comment_item)
                updated_comments += 1
            else:
                new_comments.append(comment_item)

    if not new_posts and not new_comments and not updated_posts and not updated_comments:
        raise HTTPException(
            status_code=404,
            detail=f"No data found for u/{username}. Profile may be private.",
        )

    # Merge: existing + new
    merged_posts = list(existing_posts_by_id.values()) + new_posts
    merged_comments = list(existing_comments_by_id.values()) + new_comments

    # Keep existing items without IDs
    for p in existing.get("posts", []):
        if not p.get("id"):
            merged_posts.append(p)
    for c in existing.get("comments", []):
        if not c.get("id"):
            merged_comments.append(c)

    # Analyze
    all_items = merged_posts + merged_comments
    stats = analyze_items(all_items)

    # Save extracted data to profile
    extracted = {"posts": merged_posts, "comments": merged_comments}
    save_json_file(extracted_path, extracted)

    # Update profile timestamp
    update_profile_timestamp(username_lower)

    # Sync to dashboard
    sync_dashboard_data(username_lower)

    return {
        "success": True,
        "username": username,
        "profile": username_lower,
        "new_posts": len(new_posts),
        "updated_posts": updated_posts,
        "new_comments": len(new_comments),
        "updated_comments": updated_comments,
        "total_posts": len(merged_posts),
        "total_comments": len(merged_comments),
        "subreddits": list(stats["sub_stats"].keys()),
        "profile_location": profile_dir,
        "message": f"Merged data for u/{username}: {len(new_posts)} new posts, {updated_posts} updated posts, {len(new_comments)} new comments, {updated_comments} updated comments",
    }


@router.post("/refresh")
async def refresh_data():
    """
    Refresh data for the active profile.
    Fetches latest posts/comments from Reddit, updates stats,
    and auto-detects removed content.
    """
    from app.services.storage import get_active_profile

    active_profile = get_active_profile()

    if not active_profile:
        raise HTTPException(
            status_code=400,
            detail="No active profile. Import data first using /api/import/username"
        )

    # Load existing data before refresh
    extracted_path = get_profile_data_path(active_profile, "extracted_data.json")
    existing = load_json_file(extracted_path, default={"posts": [], "comments": []})
    existing_post_ids = {p.get("id") for p in existing.get("posts", []) if p.get("id")}
    existing_comment_ids = {c.get("id") for c in existing.get("comments", []) if c.get("id")}

    # Fetch current data from Reddit
    fetched_post_ids = set()
    fetched_comment_ids = set()
    removals_detected = []

    # Fetch posts and comments in parallel
    posts_result, comments_result = await asyncio.gather(
        asyncio.to_thread(fetch_user_posts, active_profile, 100, "new"),
        asyncio.to_thread(fetch_user_comments, active_profile, 100, "new"),
        return_exceptions=True,
    )

    if not isinstance(posts_result, Exception):
        for p in posts_result:
            fetched_post_ids.add(p.get("id"))
            if p.get("selftext") in ["[removed]", "[deleted]"]:
                removals_detected.append({
                    "id": p.get("id"),
                    "type": "post",
                    "subreddit": p.get("subreddit", ""),
                    "title": p.get("title", ""),
                    "reason": "content_removed"
                })

    if not isinstance(comments_result, Exception):
        for c in comments_result:
            fetched_comment_ids.add(c.get("id"))
            if c.get("body") in ["[removed]", "[deleted]"]:
                removals_detected.append({
                    "id": c.get("id"),
                    "type": "comment",
                    "subreddit": c.get("subreddit", ""),
                    "content": c.get("link_title", ""),
                    "reason": "content_removed"
                })

    # Detect items that disappeared from profile (might be removed/deleted)
    # Only flag if we fetched enough items (Reddit limits to 100)
    missing_posts = existing_post_ids - fetched_post_ids
    missing_comments = existing_comment_ids - fetched_comment_ids

    # Look up details for missing items from saved data
    for p in existing.get("posts", []):
        if p.get("id") in missing_posts:
            removals_detected.append({
                "id": p.get("id"),
                "type": "post",
                "subreddit": p.get("subreddit", ""),
                "title": p.get("title", ""),
                "content": p.get("content", "")[:200],
                "reason": "not_in_profile"
            })

    for c in existing.get("comments", []):
        if c.get("id") in missing_comments:
            removals_detected.append({
                "id": c.get("id"),
                "type": "comment",
                "subreddit": c.get("subreddit", ""),
                "content": c.get("content", "")[:200],
                "reason": "not_in_profile"
            })

    # Log removals to removal history
    if removals_detected:
        from app.services.analysis import classify_tone, classify_topics
        removal_history_path = get_profile_data_path(active_profile, "removal_history.json")
        history = load_json_file(removal_history_path, default={"removals": [], "patterns": {}})

        existing_removal_ids = {r.get("id") for r in history.get("removals", []) if r.get("id")}

        for removal in removals_detected:
            if removal.get("id") not in existing_removal_ids:
                content = removal.get("content", removal.get("title", ""))
                history["removals"].append({
                    "id": removal.get("id"),
                    "subreddit": removal.get("subreddit", "").lower(),
                    "content_preview": content[:200],
                    "content_type": removal.get("type"),
                    "reason": removal.get("reason"),
                    "removal_type": "auto_detected",
                    "tones": classify_tone(content),
                    "topics": classify_topics(content),
                    "logged_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
                })

        history["last_updated"] = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
        save_json_file(removal_history_path, history)

    # Now do the regular import/merge
    from app.models import ImportUsernameRequest
    req = ImportUsernameRequest(username=active_profile)
    result = await import_by_username(req)

    # Add removal detection info to result
    result["removals_detected"] = len(removals_detected)
    if removals_detected:
        result["removal_message"] = f"Auto-detected {len(removals_detected)} removed/missing items"

    return result


@router.post("/import/paste")
def import_by_paste(req: ImportPasteRequest):
    """
    Import Reddit data by pasting JSON.
    Accepts posts and comments arrays.
    MERGES with existing data - updates matching items, adds new ones.
    """
    from app.services.storage import get_active_profile, get_active_data_path
    from app.services.analysis import classify_tone, classify_topics

    new_posts = req.posts or []
    new_comments = req.comments or []

    if not new_posts and not new_comments:
        raise HTTPException(status_code=400, detail="No data provided")

    # Get active profile path or fallback
    active_profile = get_active_profile()
    if active_profile:
        extracted_path = get_profile_data_path(active_profile, "extracted_data.json")
    else:
        import os
        extracted_path = os.path.join(settings.BASE_DIR, "extracted_data.json")

    existing = load_json_file(extracted_path, default={"posts": [], "comments": []})

    # Build index
    existing_posts_by_id = {p.get("id"): p for p in existing.get("posts", []) if p.get("id")}
    existing_comments_by_id = {c.get("id"): c for c in existing.get("comments", []) if c.get("id")}

    added_posts = 0
    updated_posts = 0
    added_comments = 0
    updated_comments = 0

    # Process posts
    for p in new_posts:
        if "tones" not in p:
            text = f"{p.get('title', '')} {p.get('content', '')}"
            p["tones"] = classify_tone(text)
            p["topics"] = classify_topics(text)
        p["type"] = "post"

        post_id = p.get("id")
        if post_id and post_id in existing_posts_by_id:
            existing_posts_by_id[post_id].update(p)
            updated_posts += 1
        else:
            existing_posts_by_id[post_id or f"paste_{len(existing_posts_by_id)}"] = p
            added_posts += 1

    # Process comments
    for c in new_comments:
        if "tones" not in c:
            c["tones"] = classify_tone(c.get("content", ""))
            c["topics"] = classify_topics(c.get("content", ""))
        c["type"] = "comment"

        comment_id = c.get("id")
        if comment_id and comment_id in existing_comments_by_id:
            existing_comments_by_id[comment_id].update(c)
            updated_comments += 1
        else:
            existing_comments_by_id[comment_id or f"paste_{len(existing_comments_by_id)}"] = c
            added_comments += 1

    # Merge
    merged_posts = list(existing_posts_by_id.values())
    merged_comments = list(existing_comments_by_id.values())

    all_items = merged_posts + merged_comments
    stats = analyze_items(all_items)

    # Save
    extracted = {"posts": merged_posts, "comments": merged_comments}
    save_json_file(extracted_path, extracted)

    # Sync dashboard
    if active_profile:
        sync_dashboard_data(active_profile)
    else:
        dashboard_path = os.path.join(settings.DASHBOARD_PUBLIC_DIR, "data.json")
        dashboard_data = {"items": all_items, **stats}
        save_json_file(dashboard_path, dashboard_data)

    return {
        "success": True,
        "added_posts": added_posts,
        "updated_posts": updated_posts,
        "added_comments": added_comments,
        "updated_comments": updated_comments,
        "total_posts": len(merged_posts),
        "total_comments": len(merged_comments),
        "subreddits": list(stats["sub_stats"].keys()),
        "message": f"Merged: {added_posts} new posts, {updated_posts} updated, {added_comments} new comments, {updated_comments} updated",
    }


@router.post("/persona")
def save_persona(req: PersonaRequest):
    """Save user persona for authentic comment generation."""
    import os
    from app.services.storage import get_active_profile, get_profile_data_path

    persona = {
        "name": req.name,
        "experience_years": req.experience_years,
        "current_role": req.current_role,
        "expertise": {"main": req.expertise},
        "domains": req.domains,
        "real_experiences": req.real_experiences,
        "personality": {
            "native_english": False,
            "writing_style": "simple, direct, practical",
            "goal": req.goal or "",
        },
    }

    active_profile = get_active_profile()
    if active_profile:
        persona_path = get_profile_data_path(active_profile, "persona.json")
    else:
        persona_path = os.path.join(settings.BASE_DIR, "persona.json")

    save_json_file(persona_path, persona)

    return {"success": True, "message": "Persona saved successfully"}


@router.get("/persona")
def get_persona():
    """Get current user persona."""
    from app.services.analysis import load_persona

    persona = load_persona()
    if not persona:
        return {"exists": False, "message": "No persona configured"}

    return {"exists": True, "persona": persona}


@router.get("/rules")
def get_all_rules():
    """Get all configured subreddit rules."""
    from app.services.analysis import load_subreddit_rules

    data = load_subreddit_rules()
    if not data:
        return {"subreddits": [], "rules": {}}

    return {
        "subreddits": list(data.get("subreddits", {}).keys()),
        "rules": data.get("subreddits", {}),
    }


@router.get("/rules/{subreddit}")
def get_subreddit_rules(subreddit: str):
    """Get rules for a specific subreddit."""
    from app.services.analysis import load_subreddit_rules

    rules = load_subreddit_rules(subreddit)
    if not rules:
        return {"subreddit": subreddit, "rules": None, "message": "No rules configured"}

    return {"subreddit": subreddit, "rules": rules}


@router.post("/rules")
def save_rules(data: dict):
    """Save rules for a subreddit."""
    from app.services.analysis import save_subreddit_rules

    subreddit = data.get("subreddit", "").strip()
    rules = data.get("rules", {})

    if not subreddit:
        raise HTTPException(status_code=400, detail="Subreddit name is required")

    save_subreddit_rules(subreddit, rules)

    return {"success": True, "message": f"Rules saved for r/{subreddit}"}
