"""
Preview API - Lightweight instant analysis for landing page
No AI required - fast, free, no API key needed
"""

import re
from collections import Counter
from fastapi import APIRouter, HTTPException

from app.services.reddit import fetch_user_posts, fetch_user_comments

router = APIRouter(prefix="/api/preview", tags=["Preview"])


# Simple tone detection patterns (no AI needed)
TONE_PATTERNS = {
    "personal_experience": [
        r"\b(i've|i have|i was|my experience|in my case|personally)\b",
        r"\b(we had|we used|at my company|at work)\b",
        r"\b(years ago|last year|recently i)\b",
    ],
    "helpful_advisory": [
        r"\b(you should|try|consider|i recommend|i suggest)\b",
        r"\b(the best way|one approach|what works)\b",
        r"\b(make sure|don't forget|be careful)\b",
    ],
    "technical_detailed": [
        r"\b(specifically|technically|the reason|because)\b",
        r"\b(here's how|step by step|first.*then)\b",
        r"\b(\d+%|\d+ms|\d+x faster)\b",
    ],
    "question_engaging": [
        r"\?$",
        r"\b(what do you|how do you|anyone else|thoughts\?)\b",
        r"\b(curious|wondering|interested to know)\b",
    ],
    "agreement_low_effort": [
        r"^(this|exactly|agreed|same|\+1|true)\.?!?$",
        r"\b(couldn't agree more|so true|this resonates)\b",
    ],
}

# Shield warning patterns (no AI needed)
SHIELD_PATTERNS = {
    "ai_tone": [
        (r"\b(in today's (fast-paced|digital|modern) world)\b", "Generic AI opener"),
        (r"\b(it's worth noting|it's important to)\b", "AI filler phrase"),
        (r"\b(firstly|secondly|thirdly|in conclusion)\b", "Over-structured"),
        (r"\b(leverage|utilize|synergy|optimize)\b", "Corporate buzzwords"),
    ],
    "self_promo": [
        (r"(youtube\.com|youtu\.be)/", "YouTube link"),
        (r"(my blog|my channel|check out my)", "Self-promotion"),
        (r"(i (wrote|made|created|built) (a|this))", "Self-promo phrase"),
    ],
    "low_effort": [
        (r"^.{0,30}$", "Very short content"),
    ],
}


def detect_tone(text: str) -> list:
    """Detect tones in text using regex patterns."""
    text_lower = text.lower()
    detected = []

    for tone, patterns in TONE_PATTERNS.items():
        for pattern in patterns:
            if re.search(pattern, text_lower, re.IGNORECASE):
                detected.append(tone)
                break

    return detected if detected else ["neutral"]


def detect_warnings(text: str) -> list:
    """Detect potential issues in text."""
    warnings = []
    text_lower = text.lower()

    for category, patterns in SHIELD_PATTERNS.items():
        for pattern, description in patterns:
            if re.search(pattern, text_lower, re.IGNORECASE):
                warnings.append({
                    "type": category,
                    "description": description
                })

    return warnings


def analyze_items(items: list) -> dict:
    """Analyze posts/comments without AI."""
    if not items:
        return {}

    # Subreddit stats
    subreddits = Counter()
    for item in items:
        sub = item.get("subreddit", "unknown")
        subreddits[sub] += 1

    # Upvote stats
    ups = [item.get("ups", 0) for item in items]
    avg_ups = sum(ups) / len(ups) if ups else 0
    high_performers = len([u for u in ups if u >= 3])

    # Tone analysis
    all_tones = []
    for item in items:
        content = item.get("body", "") or item.get("selftext", "") or item.get("title", "")
        tones = detect_tone(content)
        all_tones.extend(tones)

    tone_counts = Counter(all_tones)
    best_tone = tone_counts.most_common(1)[0][0] if tone_counts else "neutral"

    # Warning scan (sample first 20)
    sample_warnings = []
    for item in items[:20]:
        content = item.get("body", "") or item.get("selftext", "") or item.get("title", "")
        warnings = detect_warnings(content)
        if warnings:
            sample_warnings.extend(warnings)

    warning_counts = Counter([w["type"] for w in sample_warnings])

    return {
        "subreddits": dict(subreddits.most_common(5)),
        "top_subreddit": subreddits.most_common(1)[0][0] if subreddits else None,
        "avg_upvotes": round(avg_ups, 1),
        "high_performers": high_performers,
        "high_performer_rate": round((high_performers / len(items)) * 100) if items else 0,
        "best_tone": best_tone.replace("_", " ").title(),
        "tone_distribution": dict(tone_counts.most_common(4)),
        "warning_summary": dict(warning_counts),
        "total_warnings": len(sample_warnings),
    }


@router.get("/{username}")
async def get_preview(username: str):
    """
    Get instant preview analysis for a Reddit user.
    No AI, no signup, instant results.
    """
    # Clean username
    username = username.strip().replace("u/", "").replace("/", "")

    if not username or len(username) < 3:
        raise HTTPException(status_code=400, detail="Invalid username")

    try:
        # Fetch data (limited for preview)
        posts = fetch_user_posts(username, limit=25)
        comments = fetch_user_comments(username, limit=50)
    except Exception as e:
        raise HTTPException(
            status_code=404,
            detail=f"Could not fetch data for u/{username}. Profile may be private or doesn't exist."
        )

    if not posts and not comments:
        raise HTTPException(
            status_code=404,
            detail=f"No public content found for u/{username}"
        )

    # Analyze
    all_items = []
    for p in posts:
        all_items.append({**p, "type": "post"})
    for c in comments:
        all_items.append({**c, "type": "comment"})

    analysis = analyze_items(all_items)

    # Build insights (human-readable)
    insights = []

    if analysis.get("best_tone"):
        insights.append({
            "type": "success",
            "icon": "tone",
            "text": f"Your best tone is **{analysis['best_tone']}**",
            "detail": "This style tends to get more engagement for you"
        })

    if analysis.get("top_subreddit"):
        insights.append({
            "type": "success",
            "icon": "subreddit",
            "text": f"You perform best in **r/{analysis['top_subreddit']}**",
            "detail": f"Focus here for maximum impact"
        })

    if analysis.get("high_performer_rate", 0) > 50:
        insights.append({
            "type": "success",
            "icon": "trending",
            "text": f"**{analysis['high_performer_rate']}%** of your content performs well",
            "detail": "Above average engagement rate"
        })
    elif analysis.get("high_performer_rate", 0) < 30:
        insights.append({
            "type": "warning",
            "icon": "alert",
            "text": f"Only **{analysis['high_performer_rate']}%** of content gets 3+ upvotes",
            "detail": "RedBuddy can help improve this"
        })

    if analysis.get("total_warnings", 0) > 0:
        warning_types = list(analysis.get("warning_summary", {}).keys())
        insights.append({
            "type": "warning",
            "icon": "shield",
            "text": f"**{analysis['total_warnings']}** potential issues detected",
            "detail": f"Including: {', '.join(warning_types[:2])}"
        })

    return {
        "username": username,
        "stats": {
            "posts": len(posts),
            "comments": len(comments),
            "subreddits": len(analysis.get("subreddits", {})),
            "avg_upvotes": analysis.get("avg_upvotes", 0),
        },
        "top_subreddits": list(analysis.get("subreddits", {}).keys())[:3],
        "best_tone": analysis.get("best_tone"),
        "high_performer_rate": analysis.get("high_performer_rate", 0),
        "insights": insights,
        "warning_count": analysis.get("total_warnings", 0),
        "cta": {
            "text": "Get Full Dashboard",
            "subtext": "Free & open source. All features included.",
            "url": "https://github.com/AvinashDalvi89/myredbuddy-tool"
        }
    }


@router.get("/{username}/shield-preview")
async def get_shield_preview(username: str):
    """
    Quick shield scan of recent content.
    Shows potential issues without full analysis.
    """
    username = username.strip().replace("u/", "").replace("/", "")

    try:
        comments = fetch_user_comments(username, limit=20)
    except:
        raise HTTPException(status_code=404, detail="Could not fetch data")

    issues = []
    clean = 0

    for c in comments[:10]:
        content = c.get("body", "")
        warnings = detect_warnings(content)

        if warnings:
            issues.append({
                "preview": content[:100] + "..." if len(content) > 100 else content,
                "subreddit": c.get("subreddit", ""),
                "warnings": warnings[:2],
            })
        else:
            clean += 1

    return {
        "username": username,
        "scanned": min(10, len(comments)),
        "clean": clean,
        "issues_found": len(issues),
        "sample_issues": issues[:3],
        "recommendation": "Run full Shield check for detailed analysis" if issues else "Your recent content looks clean!"
    }
