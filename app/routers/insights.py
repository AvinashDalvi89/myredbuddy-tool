"""
Removal Insights Endpoints - Removal Tracking and Analysis
"""

import time
from fastapi import APIRouter, HTTPException

from app.models import RemovalLogRequest
from app.config import settings
from app.services.claude import call_claude
from app.services.storage import (
    get_active_profile,
    get_profile_data_path,
    load_json_file,
    save_json_file,
)
from app.services.analysis import classify_tone, classify_topics

router = APIRouter(prefix="/api/insights", tags=["Removal Insights"])


def get_removal_history_path():
    """Get path to removal history file."""
    import os
    active = get_active_profile()
    if active:
        return get_profile_data_path(active, "removal_history.json")
    return os.path.join(settings.BASE_DIR, "removal_history.json")


def get_removal_history():
    """Load removal history."""
    return load_json_file(
        get_removal_history_path(),
        default={"removals": [], "patterns": {}, "last_updated": None}
    )


def save_removal_history(data):
    """Save removal history."""
    data["last_updated"] = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
    save_json_file(get_removal_history_path(), data)


@router.post("/removal")
def log_removal(req: RemovalLogRequest):
    """
    Log a content removal for pattern tracking.
    """
    history = get_removal_history()

    # Classify if not provided
    tones = req.topics if req.topics else classify_tone(req.content)
    topics = req.tones if req.tones else classify_topics(req.content)

    removal = {
        "subreddit": req.subreddit.lower(),
        "content_preview": req.content[:200],
        "content_type": req.content_type,
        "reason": req.reason,
        "removal_type": req.removal_type,
        "tones": tones,
        "topics": topics,
        "logged_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
    }

    history["removals"].append(removal)

    # Update patterns
    patterns = history.get("patterns", {})

    # By subreddit
    if "by_subreddit" not in patterns:
        patterns["by_subreddit"] = {}
    sub = req.subreddit.lower()
    patterns["by_subreddit"][sub] = patterns["by_subreddit"].get(sub, 0) + 1

    # By reason
    if "by_reason" not in patterns:
        patterns["by_reason"] = {}
    if req.reason:
        patterns["by_reason"][req.reason] = patterns["by_reason"].get(req.reason, 0) + 1

    # By type
    if "by_type" not in patterns:
        patterns["by_type"] = {"post": 0, "comment": 0}
    patterns["by_type"][req.content_type] = patterns["by_type"].get(req.content_type, 0) + 1

    # By removal type
    if "by_removal_type" not in patterns:
        patterns["by_removal_type"] = {}
    patterns["by_removal_type"][req.removal_type] = patterns["by_removal_type"].get(req.removal_type, 0) + 1

    history["patterns"] = patterns
    save_removal_history(history)

    return {
        "success": True,
        "message": "Removal logged successfully",
        "total_removals": len(history["removals"]),
    }


@router.get("/stats")
def get_insights_stats():
    """
    Get removal statistics and patterns with actionable hints.
    """
    history = get_removal_history()
    removals = history.get("removals", [])
    patterns = history.get("patterns", {})

    # Calculate high-risk items
    high_risk_subreddits = sorted(
        patterns.get("by_subreddit", {}).items(),
        key=lambda x: x[1],
        reverse=True
    )[:5]

    # Get tones and topics from removals
    tone_counts = {}
    topic_counts = {}
    for r in removals:
        for t in r.get("tones", []):
            tone_counts[t] = tone_counts.get(t, 0) + 1
        for t in r.get("topics", []):
            topic_counts[t] = topic_counts.get(t, 0) + 1

    high_risk_tones = sorted(tone_counts.items(), key=lambda x: x[1], reverse=True)[:5]
    high_risk_topics = sorted(topic_counts.items(), key=lambda x: x[1], reverse=True)[:5]

    # Categorize and analyze reasons
    mod_removals = []
    low_engagement = []
    other_removals = []

    for r in removals:
        reason = r.get("reason", "").lower()
        removal_type = r.get("removal_type", "")

        if removal_type == "mod" or "removed" in reason or "violation" in reason or "rule" in reason:
            mod_removals.append(r)
        elif "low engagement" in reason or removal_type == "low_performer":
            low_engagement.append(r)
        else:
            other_removals.append(r)

    # Generate actionable hints based on data
    hints = []

    # Hint: Low engagement pattern
    if len(low_engagement) > len(removals) * 0.5:
        low_eng_subs = {}
        for r in low_engagement:
            sub = r.get("subreddit", "unknown")
            low_eng_subs[sub] = low_eng_subs.get(sub, 0) + 1
        top_low_sub = max(low_eng_subs.items(), key=lambda x: x[1]) if low_eng_subs else None
        hints.append({
            "type": "engagement",
            "title": "Low Engagement Pattern",
            "description": f"{len(low_engagement)} of {len(removals)} removals are due to low engagement",
            "action": f"Focus on adding more value. Top affected: r/{top_low_sub[0]}" if top_low_sub else "Add more unique insights to your comments"
        })

    # Hint: Subreddit-specific issues
    if high_risk_subreddits and high_risk_subreddits[0][1] >= 3:
        top_sub = high_risk_subreddits[0]
        sub_removals = [r for r in removals if r.get("subreddit", "").lower() == top_sub[0].lower()]
        sub_reasons = [r.get("reason", "") for r in sub_removals if r.get("reason") and "low engagement" not in r.get("reason", "").lower()]
        hints.append({
            "type": "subreddit",
            "title": f"r/{top_sub[0]} Issues ({top_sub[1]} removals)",
            "description": sub_reasons[0][:100] if sub_reasons else "Multiple removals in this subreddit",
            "action": "Review this subreddit's rules before posting"
        })

    # Hint: Tone issues
    if high_risk_tones:
        top_tone = high_risk_tones[0]
        tone_hints = {
            "data_driven": "Data-heavy comments may lack personal connection",
            "personal_experience": "Personal stories may be off-topic in technical subs",
            "advisory": "Unsolicited advice can feel preachy",
            "positive_enthusiastic": "Over-enthusiasm can seem promotional",
            "neutral": "Neutral tone may lack engagement value",
            "pain_point": "Complaints without solutions get downvoted",
            "comparison": "Comparisons can start arguments"
        }
        if top_tone[0] in tone_hints:
            hints.append({
                "type": "tone",
                "title": f"Tone Pattern: {top_tone[0].replace('_', ' ').title()}",
                "description": tone_hints.get(top_tone[0], f"{top_tone[1]} removals with this tone"),
                "action": "Try varying your comment style"
            })

    # Hint: Content type
    by_type = patterns.get("by_type", {})
    if by_type.get("comment", 0) > by_type.get("post", 0) * 10:
        hints.append({
            "type": "content",
            "title": "Comment-Heavy Removals",
            "description": f"{by_type.get('comment', 0)} comments vs {by_type.get('post', 0)} posts removed",
            "action": "Focus on quality over quantity in comments"
        })

    # Filter common_reasons to exclude low engagement
    filtered_reasons = {}
    for reason, count in patterns.get("common_reasons", {}).items():
        if "low engagement" not in reason.lower():
            filtered_reasons[reason] = count

    return {
        "total_removals": len(removals),
        "last_updated": history.get("last_updated"),
        "high_risk_subreddits": [s[0] for s in high_risk_subreddits],
        "high_risk_topics": [t[0] for t in high_risk_topics],
        "high_risk_tones": [t[0] for t in high_risk_tones],
        "common_reasons": filtered_reasons if filtered_reasons else patterns.get("common_reasons", {}),
        "by_subreddit": patterns.get("by_subreddit", {}),
        "by_type": patterns.get("by_type", {"post": 0, "comment": 0}),
        "by_removal_type": patterns.get("by_removal_type", {}),
        "recent_removals": removals[-10:][::-1],
        "hints": hints,
        "breakdown": {
            "mod_removals": len(mod_removals),
            "low_engagement": len(low_engagement),
            "other": len(other_removals)
        }
    }


@router.get("/patterns")
def get_removal_patterns():
    """Get detailed removal patterns."""
    history = get_removal_history()
    return {
        "patterns": history.get("patterns", {}),
        "total_removals": len(history.get("removals", [])),
    }


@router.get("/removals")
def get_all_removals():
    """Get all logged removals."""
    history = get_removal_history()
    return {
        "removals": history.get("removals", []),
        "total": len(history.get("removals", [])),
    }


@router.delete("/removal/{index}")
def delete_removal(index: int):
    """Delete a removal by index."""
    history = get_removal_history()
    removals = history.get("removals", [])

    if index < 0 or index >= len(removals):
        raise HTTPException(status_code=404, detail="Removal not found")

    removed = removals.pop(index)
    history["removals"] = removals

    # Recalculate patterns
    patterns = {"by_subreddit": {}, "by_reason": {}, "by_type": {"post": 0, "comment": 0}, "by_removal_type": {}}
    for r in removals:
        sub = r.get("subreddit", "").lower()
        if sub:
            patterns["by_subreddit"][sub] = patterns["by_subreddit"].get(sub, 0) + 1
        reason = r.get("reason", "")
        if reason:
            patterns["by_reason"][reason] = patterns["by_reason"].get(reason, 0) + 1
        ctype = r.get("content_type", "comment")
        patterns["by_type"][ctype] = patterns["by_type"].get(ctype, 0) + 1
        rtype = r.get("removal_type", "mod")
        patterns["by_removal_type"][rtype] = patterns["by_removal_type"].get(rtype, 0) + 1

    history["patterns"] = patterns
    save_removal_history(history)

    return {
        "success": True,
        "message": "Removal deleted",
        "deleted": removed,
    }


@router.post("/import")
def import_removals_from_file():
    """
    Import removals from removed_data.json file.
    """
    import os

    removed_path = os.path.join(settings.BASE_DIR, "removed_data.json")
    if not os.path.exists(removed_path):
        raise HTTPException(status_code=404, detail="removed_data.json not found")

    removed_data = load_json_file(removed_path)
    history = get_removal_history()

    imported = 0
    for item in removed_data.get("items", []):
        removal = {
            "subreddit": item.get("subreddit", "").lower(),
            "content_preview": item.get("content", "")[:200],
            "content_type": item.get("type", "comment"),
            "reason": item.get("reason", "imported"),
            "removal_type": item.get("removal_type", "unknown"),
            "tones": item.get("tones", classify_tone(item.get("content", ""))),
            "topics": item.get("topics", classify_topics(item.get("content", ""))),
            "logged_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        }
        history["removals"].append(removal)
        imported += 1

    # Recalculate patterns
    patterns = {"by_subreddit": {}, "by_reason": {}, "by_type": {"post": 0, "comment": 0}, "by_removal_type": {}}
    for r in history["removals"]:
        sub = r.get("subreddit", "").lower()
        if sub:
            patterns["by_subreddit"][sub] = patterns["by_subreddit"].get(sub, 0) + 1
        reason = r.get("reason", "")
        if reason:
            patterns["by_reason"][reason] = patterns["by_reason"].get(reason, 0) + 1
        ctype = r.get("content_type", "comment")
        patterns["by_type"][ctype] = patterns["by_type"].get(ctype, 0) + 1
        rtype = r.get("removal_type", "mod")
        patterns["by_removal_type"][rtype] = patterns["by_removal_type"].get(rtype, 0) + 1

    history["patterns"] = patterns
    save_removal_history(history)

    return {
        "success": True,
        "imported": imported,
        "total_removals": len(history["removals"]),
    }


@router.get("/analysis")
def get_deep_analysis():
    """
    Get deep analysis of removal patterns with AI insights.
    """
    history = get_removal_history()
    removals = history.get("removals", [])

    if not removals:
        return {
            "total_analyzed": 0,
            "insights": [],
            "message": "No removal data to analyze",
        }

    # Aggregate data
    by_subreddit = {}
    for r in removals:
        sub = r.get("subreddit", "unknown")
        if sub not in by_subreddit:
            by_subreddit[sub] = {"count": 0, "reasons": []}
        by_subreddit[sub]["count"] += 1
        if r.get("reason"):
            by_subreddit[sub]["reasons"].append(r["reason"])

    # Problem subreddits (2+ removals)
    problem_subreddits = [
        {"subreddit": sub, "count": data["count"], "top_reason": max(set(data["reasons"]), key=data["reasons"].count) if data["reasons"] else "unknown"}
        for sub, data in by_subreddit.items()
        if data["count"] >= 2
    ]
    problem_subreddits.sort(key=lambda x: x["count"], reverse=True)

    # Generate insights
    insights = []

    if problem_subreddits:
        insights.append({
            "type": "warning",
            "title": "High-Risk Subreddits",
            "description": f"You have repeated removals in: {', '.join([p['subreddit'] for p in problem_subreddits[:3]])}",
            "action": "Consider reviewing the rules of these subreddits before posting",
        })

    # Check for patterns
    all_reasons = [r.get("reason", "") for r in removals if r.get("reason")]
    if all_reasons:
        common_reason = max(set(all_reasons), key=all_reasons.count)
        reason_count = all_reasons.count(common_reason)
        if reason_count >= 3:
            insights.append({
                "type": "pattern",
                "title": f"Common Removal Reason: {common_reason}",
                "description": f"'{common_reason}' has caused {reason_count} removals",
                "action": f"Address this pattern to reduce future removals",
            })

    return {
        "total_analyzed": len(removals),
        "by_subreddit": by_subreddit,
        "problem_subreddits": problem_subreddits,
        "insights": insights,
    }


@router.post("/migrate")
def migrate_legacy_data():
    """
    Migrate removal history from base directory to active profile.
    Use this if you had removal data before profiles were added.
    """
    import os

    active = get_active_profile()
    if not active:
        raise HTTPException(status_code=400, detail="No active profile set")

    base_path = os.path.join(settings.BASE_DIR, "removal_history.json")
    if not os.path.exists(base_path):
        return {
            "success": False,
            "message": "No legacy removal_history.json found in base directory",
        }

    legacy = load_json_file(base_path, default={})
    if not legacy.get("removals"):
        return {
            "success": False,
            "message": "Legacy file exists but has no removal data",
        }

    # Get current profile data
    profile_path = get_profile_data_path(active, "removal_history.json")
    current = load_json_file(profile_path, default={"removals": [], "patterns": {}})

    # Merge: add legacy removals that aren't already in profile
    existing_ids = {r.get("id") for r in current.get("removals", []) if r.get("id")}
    added = 0

    for removal in legacy.get("removals", []):
        removal_id = removal.get("id")
        if not removal_id or removal_id not in existing_ids:
            current["removals"].append(removal)
            added += 1

    # Merge patterns
    for key, value in legacy.get("patterns", {}).items():
        if key not in current.get("patterns", {}):
            current["patterns"][key] = value
        elif isinstance(value, dict):
            for k, v in value.items():
                current["patterns"][key][k] = current["patterns"][key].get(k, 0) + v

    current["last_updated"] = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
    save_json_file(profile_path, current)

    return {
        "success": True,
        "migrated": added,
        "total_removals": len(current["removals"]),
        "message": f"Migrated {added} removals from legacy file to profile '{active}'",
        "legacy_path": base_path,
        "profile_path": profile_path,
    }
