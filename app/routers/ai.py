"""
AI-Powered Analysis and Suggestion Endpoints
"""

import time
from fastapi import APIRouter, HTTPException

try:
    from reputation_shield import full_shield_check
    SHIELD_AVAILABLE = True
except ImportError:
    SHIELD_AVAILABLE = False

from app.models import AnalyzeRequest, ValidateRequest, SuggestRequest, RefineRequest
from app.config import settings
from app.services.claude import call_claude
from app.services.reddit import fetch_subreddit_posts
from app.services.storage import (
    get_active_profile,
    get_profile_data_path,
    load_json_file,
    save_json_file,
)
from app.services.analysis import (
    analyze_items,
    load_framework,
    load_persona,
    load_subreddit_rules,
    format_subreddit_rules,
    classify_tone,
    classify_topics,
    process_post_for_storage,
)

router = APIRouter(prefix="/api", tags=["AI"])


@router.post("/analyze")
def analyze_subreddit(req: AnalyzeRequest):
    """
    Analyze a subreddit to understand what works there.
    Fetches top posts and analyzes patterns.
    """
    subreddit = req.subreddit.strip().replace("r/", "").replace("/", "")

    # Fetch top posts
    posts_data = fetch_subreddit_posts(subreddit, limit=req.limit, sort="top")

    if not posts_data:
        raise HTTPException(
            status_code=404,
            detail=f"No data found for r/{subreddit}",
        )

    # Process and analyze
    items = []
    for p in posts_data:
        item = process_post_for_storage(p)
        items.append(item)

    stats = analyze_items(items)

    # Save for offline analysis
    import os
    competitor_path = os.path.join(settings.BASE_DIR, f"competitor_{subreddit}.json")
    save_json_file(competitor_path, {"posts": items, **stats})

    # Generate AI analysis
    top_tones = sorted(
        stats["tone_stats"].items(),
        key=lambda x: x[1]["avg"],
        reverse=True
    )[:5]
    top_topics = sorted(
        stats["topic_stats"].items(),
        key=lambda x: x[1]["avg"],
        reverse=True
    )[:5]

    prompt = f"""Analyze r/{subreddit} based on this data:

Top performing tones: {top_tones}
Top performing topics: {top_topics}
Total posts analyzed: {len(items)}

Give 3-5 specific, actionable insights about:
1. What content style works best
2. Topics that get the most engagement
3. What to avoid
4. Best posting strategy for this subreddit

Be specific and practical. Focus on patterns in the data."""

    analysis = call_claude(prompt)

    return {
        "subreddit": subreddit,
        "posts_analyzed": len(items),
        "posts": items[:20],  # Return sample
        "tone_stats": stats["tone_stats"],
        "topic_stats": stats["topic_stats"],
        "analysis": analysis,
    }


@router.post("/community/culture")
def community_culture_guide(req: AnalyzeRequest):
    """
    Generate a culture guide for a subreddit — no active profile required.
    Designed for new users who want to understand a community before posting.
    """
    import json as _json

    subreddit = req.subreddit.strip().replace("r/", "").replace("/", "")

    posts_data = fetch_subreddit_posts(subreddit, limit=50, sort="top", time_filter="year")

    if not posts_data:
        raise HTTPException(
            status_code=404,
            detail=f"No data found for r/{subreddit}",
        )

    items = [process_post_for_storage(p) for p in posts_data]
    stats = analyze_items(items)

    top_titles = [i.get("title", i.get("content", ""))[:120] for i in items[:15] if i.get("title") or i.get("content")]

    top_tones = sorted(
        stats["tone_stats"].items(),
        key=lambda x: x[1]["avg"],
        reverse=True
    )[:5]
    top_topics = sorted(
        stats["topic_stats"].items(),
        key=lambda x: x[1]["avg"],
        reverse=True
    )[:5]

    prompt = f"""You are helping a brand-new Reddit user understand r/{subreddit} before they post.

Analyze these top posts from the past year:
{chr(10).join(f"- {t}" for t in top_titles)}

Top performing tones: {top_tones}
Top performing topics: {top_topics}
Total posts analyzed: {len(items)}

Return a JSON object with exactly these keys (no extra keys, no markdown fences):
{{
  "vibe": ["2-4 short adjectives describing community culture"],
  "what_gets_upvoted": ["3-5 specific content types or themes that perform well"],
  "removal_risks": ["3-4 things that commonly get posts removed or downvoted"],
  "unwritten_rules": ["3-4 cultural norms not found in the sidebar"],
  "how_to_start": ["2-3 concrete first post or comment ideas tailored to this community"],
  "karma_tip": "one sentence about any karma/account age requirements or tips"
}}

Be specific to r/{subreddit}. Return ONLY valid JSON."""

    raw = call_claude(prompt)

    try:
        json_start = raw.find("{")
        json_end = raw.rfind("}") + 1
        if json_start >= 0 and json_end > json_start:
            guide = _json.loads(raw[json_start:json_end])
        else:
            raise ValueError("No JSON found")
    except (ValueError, _json.JSONDecodeError):
        guide = {
            "vibe": [],
            "what_gets_upvoted": [],
            "removal_risks": [],
            "unwritten_rules": [],
            "how_to_start": [],
            "karma_tip": raw[:300] if raw else "Could not generate tip.",
        }

    return {
        "subreddit": subreddit,
        "posts_analyzed": len(items),
        **guide,
    }


@router.post("/validate")
def validate_content(req: ValidateRequest):
    """
    Validate a draft post/comment using AI analysis.
    Checks against framework, persona, and subreddit rules.
    """
    framework = load_framework()
    persona = load_persona()
    rules = load_subreddit_rules(req.subreddit)
    rules_text = format_subreddit_rules(rules)

    # Build context from user's data
    active_profile = get_active_profile()
    user_context = ""
    if active_profile:
        extracted_path = get_profile_data_path(active_profile, "extracted_data.json")
        data = load_json_file(extracted_path)
        if data:
            # Get top performing examples
            all_items = data.get("posts", []) + data.get("comments", [])
            top_items = sorted(all_items, key=lambda x: x.get("ups", 0), reverse=True)[:5]
            user_context = f"\nUser's top performing content:\n" + "\n".join(
                [f"- ({i.get('ups')} ups) {i.get('content', '')[:100]}..." for i in top_items]
            )

    # Determine if this is a comment or post
    content_type = "comment" if req.original_post else "post"

    prompt = f"""You are a Reddit engagement expert. Analyze this {content_type} draft.

{f'ORIGINAL POST TO REPLY TO: {req.original_post}' if req.original_post else ''}

DRAFT TO VALIDATE:
{req.draft}

TARGET SUBREDDIT: r/{req.subreddit}
{rules_text}

{f'FRAMEWORK: {framework[:1000]}' if framework else ''}
{f'WRITER BACKGROUND (for context, NEVER quote in revised version): {persona}' if persona else ''}
{user_context}

Provide analysis in this format:
1. SCORE: X/10 - Overall quality score
2. STRENGTHS: What works well (2-3 points)
3. ISSUES: Problems to fix (2-3 points)
4. SUGGESTIONS: Specific improvements (2-3 actionable items)
5. REVISED VERSION: (optional) A better version if score < 7

IMPORTANT for REVISED VERSION:
- Use the persona naturally and organically - don't always start with credentials
- Only mention experience/role when contextually relevant to the comment
- Avoid formulaic patterns like "15 years in, currently Senior Staff Engineer working on X"
- Write naturally as the persona would, not as a structured bio
- Sometimes it's fine to just share insights without establishing credentials upfront
- Make it sound conversational, not like a resume introduction

Be direct and specific. Focus on Reddit engagement patterns."""

    analysis = call_claude(prompt)

    # Run shield check inline so the frontend gets both in one request
    shield = None
    if SHIELD_AVAILABLE:
        history_items = []
        if active_profile:
            extracted_path = get_profile_data_path(active_profile, "extracted_data.json")
            data = load_json_file(extracted_path)
            if data:
                history_items = data.get("posts", []) + data.get("comments", [])
        shield = full_shield_check(
            text=req.draft,
            subreddit=req.subreddit or "general",
            content_type=content_type,
            history=history_items,
        )

    return {
        "draft": req.draft,
        "subreddit": req.subreddit,
        "content_type": content_type,
        "analysis": analysis,
        "shield": shield,
    }


@router.post("/suggest")
def suggest_comments(req: SuggestRequest):
    """
    Generate comment suggestions for a post based on persona and data.
    """
    persona = load_persona()
    rules = load_subreddit_rules(req.subreddit)
    rules_text = format_subreddit_rules(rules)

    # Get user's successful comment patterns
    active_profile = get_active_profile()
    examples = ""
    if active_profile:
        extracted_path = get_profile_data_path(active_profile, "extracted_data.json")
        data = load_json_file(extracted_path)
        if data:
            comments = [c for c in data.get("comments", []) if c.get("ups", 0) >= 5]
            comments = sorted(comments, key=lambda x: x.get("ups", 0), reverse=True)[:5]
            if comments:
                examples = "\nUser's successful comment examples:\n" + "\n".join(
                    [f"- ({c.get('ups')} ups) {c.get('content', '')[:150]}..." for c in comments]
                )

    prompt = f"""Generate 3 authentic Reddit comment suggestions for this post.

POST TO COMMENT ON:
{req.post_text}

TARGET SUBREDDIT: r/{req.subreddit}
{rules_text}

{f'WRITER BACKGROUND (for context only, NEVER quote directly): {persona}' if persona else ''}
{examples}

Generate 3 different comment approaches:
**Comment 1:** (Personal experience style)
[Write a comment sharing relevant personal experience]

**Comment 2:** (Helpful/advisory style)
[Write a comment offering practical advice or insights]

**Comment 3:** (Engaging question or observation style)
[Write a comment that adds to the discussion]

Requirements:
- Sound natural, not AI-generated
- Match the persona's expertise and voice
- Be specific and add value
- Appropriate length for Reddit (2-4 sentences typically)
- Use persona naturally - don't always start with credentials like "15 years in, currently X role"
- Only mention experience/role when contextually relevant
- Write conversationally, not like a structured bio introduction"""

    result = call_claude(prompt)

    return {
        "post": req.post_text[:200],
        "subreddit": req.subreddit,
        "suggestions": result,
    }


@router.post("/refine")
def refine_comment(req: RefineRequest):
    """
    Refine a comment based on feedback.
    """
    persona = load_persona()
    rules = load_subreddit_rules(req.subreddit) if req.subreddit else {}
    rules_text = format_subreddit_rules(rules)

    feedback_context = {
        "ai_sounding": "The comment sounds too AI-generated, robotic, or overly polished. Make it more natural and human.",
        "wrong_persona": "The comment doesn't match my expertise or voice. Adjust to sound more like me.",
        "too_formal": "The comment is too formal for Reddit. Make it more casual and conversational.",
        "too_casual": "The comment is too casual. Add more substance and professionalism.",
        "custom": req.feedback,
    }

    feedback_detail = feedback_context.get(req.feedback_type, req.feedback)

    prompt = f"""Refine this Reddit comment based on the feedback.

ORIGINAL COMMENT:
{req.comment}

FEEDBACK: {feedback_detail}
{f'ADDITIONAL NOTES: {req.feedback}' if req.feedback and req.feedback_type != 'custom' else ''}

{f'WRITER BACKGROUND (for voice/style only, NEVER mention credentials): {persona}' if persona else ''}
{rules_text}

Provide the refined comment only, no explanation. Make it sound natural and human.
NEVER start with or include job titles, years of experience, or formal credentials.
- Use persona naturally - avoid formulaic credential introductions unless contextually relevant
- Write conversationally, not like a structured bio"""

    result = call_claude(prompt)

    return {
        "original": req.comment,
        "feedback_type": req.feedback_type,
        "refined": result,
    }


@router.post("/data/merge-removed")
def merge_removed_data():
    """
    Merge removed_data.json into the main dashboard data.
    This adds removal data to the 'What Doesn't Work' section.
    """
    import os

    removed_path = os.path.join(settings.BASE_DIR, "removed_data.json")
    if not os.path.exists(removed_path):
        raise HTTPException(status_code=404, detail="removed_data.json not found")

    removed_data = load_json_file(removed_path)

    active_profile = get_active_profile()
    if active_profile:
        extracted_path = get_profile_data_path(active_profile, "extracted_data.json")
    else:
        extracted_path = os.path.join(settings.BASE_DIR, "extracted_data.json")

    existing = load_json_file(extracted_path, default={"posts": [], "comments": []})

    # Build index
    existing_posts_by_id = {p.get("id"): p for p in existing.get("posts", []) if p.get("id")}
    existing_comments_by_id = {c.get("id"): c for c in existing.get("comments", []) if c.get("id")}

    added = 0
    for item in removed_data.get("items", []):
        item_id = item.get("id")
        item_type = item.get("type", "comment")

        # Set ups to 0 for removed content
        item["ups"] = 0
        item["removed"] = True

        if "tones" not in item:
            item["tones"] = classify_tone(item.get("content", ""))
        if "topics" not in item:
            item["topics"] = classify_topics(item.get("content", ""))

        if item_type == "post":
            if item_id and item_id not in existing_posts_by_id:
                existing_posts_by_id[item_id or f"removed_{added}"] = item
                added += 1
        else:
            if item_id and item_id not in existing_comments_by_id:
                existing_comments_by_id[item_id or f"removed_{added}"] = item
                added += 1

    merged_posts = list(existing_posts_by_id.values())
    merged_comments = list(existing_comments_by_id.values())

    # Save
    extracted = {"posts": merged_posts, "comments": merged_comments}
    save_json_file(extracted_path, extracted)

    # Sync dashboard
    if active_profile:
        from app.services.storage import sync_dashboard_data
        sync_dashboard_data(active_profile)

    return {
        "success": True,
        "added": added,
        "total_posts": len(merged_posts),
        "total_comments": len(merged_comments),
        "message": f"Merged {added} removed items into dashboard data",
    }


@router.post("/recommendations/refresh")
def refresh_recommendations(subreddit: str = None):
    """
    Regenerate AI recommendations based on your performance data.
    Optionally focus on a specific subreddit for targeted recommendations.
    """
    import os
    import json

    active_profile = get_active_profile()
    if not active_profile:
        raise HTTPException(status_code=400, detail="No active profile")

    # Load user's data
    extracted_path = get_profile_data_path(active_profile, "extracted_data.json")
    data = load_json_file(extracted_path)
    if not data:
        raise HTTPException(status_code=400, detail="No data found. Import your Reddit data first.")

    posts = data.get("posts", [])
    comments = data.get("comments", [])
    all_items = posts + comments

    if not all_items:
        raise HTTPException(status_code=400, detail="No posts or comments found in your data")

    # Analyze performance
    stats = analyze_items(all_items)

    # Get top performing content
    top_items = sorted(all_items, key=lambda x: x.get("ups", 0), reverse=True)[:10]
    low_items = sorted(all_items, key=lambda x: x.get("ups", 0))[:5]

    # Get subreddit performance
    sub_perf = {}
    for item in all_items:
        sub = item.get("subreddit", "unknown")
        if sub not in sub_perf:
            sub_perf[sub] = {"count": 0, "total_ups": 0, "items": []}
        sub_perf[sub]["count"] += 1
        sub_perf[sub]["total_ups"] += item.get("ups", 0)
        sub_perf[sub]["items"].append(item)

    for sub in sub_perf:
        sub_perf[sub]["avg"] = sub_perf[sub]["total_ups"] / sub_perf[sub]["count"] if sub_perf[sub]["count"] > 0 else 0

    top_subs = sorted(sub_perf.items(), key=lambda x: x[1]["avg"], reverse=True)[:5]

    # If specific subreddit requested, fetch fresh data from it
    subreddit_context = ""
    if subreddit:
        try:
            fresh_posts = fetch_subreddit_posts(subreddit.strip(), limit=25, sort="top")
            if fresh_posts:
                subreddit_context = f"\n\nFRESH DATA FROM r/{subreddit} (top posts):\n"
                for p in fresh_posts[:10]:
                    subreddit_context += f"- ({p.get('ups', 0)} ups) {p.get('title', '')[:80]}\n"
        except Exception:
            pass

    # Build prompt for AI
    prompt = f"""Based on this Reddit user's performance data, generate personalized recommendations.

USER'S TOP PERFORMING CONTENT (what works):
{json.dumps([{"ups": i.get("ups"), "subreddit": i.get("subreddit"), "content": i.get("content", i.get("title", ""))[:150], "tones": i.get("tones", []), "topics": i.get("topics", [])} for i in top_items], indent=2)}

USER'S LOW PERFORMING CONTENT (what to avoid):
{json.dumps([{"ups": i.get("ups"), "subreddit": i.get("subreddit"), "content": i.get("content", i.get("title", ""))[:100]} for i in low_items], indent=2)}

TOP SUBREDDITS BY PERFORMANCE:
{json.dumps([(s[0], {"avg_ups": round(s[1]["avg"], 1), "count": s[1]["count"]}) for s in top_subs], indent=2)}

TONE STATS: {json.dumps({k: {"avg": round(v["avg"], 1), "count": v["count"]} for k, v in list(stats["tone_stats"].items())[:5]}, indent=2)}
TOPIC STATS: {json.dumps({k: {"avg": round(v["avg"], 1), "count": v["count"]} for k, v in list(stats["topic_stats"].items())[:5]}, indent=2)}
{subreddit_context}

Generate recommendations in this JSON format:
{{
  "post_ideas": [
    {{"title": "...", "subreddit": "...", "predicted_ups": "X-Y", "confidence": "high/medium", "why": "..."}}
  ],
  "comment_strategies": [
    {{"strategy": "...", "example_from_data": "...", "when_to_use": "...", "predicted_impact": "X-Y ups", "key_ingredients": "..."}}
  ],
  "avoid": [
    {{"pattern": "...", "example_from_data": "...", "why_fails": "...", "fix": "..."}}
  ],
  "subreddit_playbook": [
    {{"subreddit": "...", "avg_ups": X, "winning_formula": "...", "ideal_tone": ["..."]}}
  ]
}}

Generate 5 post ideas, 3 comment strategies, 3 things to avoid, and playbooks for top 3 subreddits.
{"Focus especially on r/" + subreddit + " since the user wants recommendations for that subreddit." if subreddit else ""}
Be specific and reference their actual data. Return ONLY valid JSON."""

    result = call_claude(prompt)

    # Parse JSON from response
    try:
        # Try to extract JSON from response
        json_start = result.find("{")
        json_end = result.rfind("}") + 1
        if json_start >= 0 and json_end > json_start:
            recommendations = json.loads(result[json_start:json_end])
        else:
            raise ValueError("No JSON found")
    except (json.JSONDecodeError, ValueError):
        # Return raw result if JSON parsing fails
        return {
            "success": False,
            "message": "Failed to parse AI response",
            "raw_response": result[:500]
        }

    # Save to profile
    recs_path = get_profile_data_path(active_profile, "recommendations.json")
    save_json_file(recs_path, recommendations)

    # Also save to dashboard public for frontend
    dashboard_recs_path = os.path.join(settings.DASHBOARD_PUBLIC_DIR, "recommendations.json")
    save_json_file(dashboard_recs_path, recommendations)

    return {
        "success": True,
        "message": f"Recommendations refreshed" + (f" with focus on r/{subreddit}" if subreddit else ""),
        "recommendations": recommendations
    }


@router.get("/recommendations")
def get_recommendations():
    """Get current recommendations."""
    import os

    active_profile = get_active_profile()
    if active_profile:
        recs_path = get_profile_data_path(active_profile, "recommendations.json")
        recs = load_json_file(recs_path)
        if recs:
            return {"success": True, "recommendations": recs}

    # Fallback to dashboard public
    dashboard_recs_path = os.path.join(settings.DASHBOARD_PUBLIC_DIR, "recommendations.json")
    recs = load_json_file(dashboard_recs_path)
    if recs:
        return {"success": True, "recommendations": recs}

    return {"success": False, "message": "No recommendations found. Use /api/recommendations/refresh to generate."}
