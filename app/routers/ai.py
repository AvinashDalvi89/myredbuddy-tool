"""
AI-Powered Analysis and Suggestion Endpoints
"""

import time
from fastapi import APIRouter, HTTPException

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
{f'USER PERSONA: {persona}' if persona else ''}
{user_context}

Provide analysis in this format:
1. SCORE: X/10 - Overall quality score
2. STRENGTHS: What works well (2-3 points)
3. ISSUES: Problems to fix (2-3 points)
4. SUGGESTIONS: Specific improvements (2-3 actionable items)
5. REVISED VERSION: (optional) A better version if score < 7

Be direct and specific. Focus on Reddit engagement patterns."""

    analysis = call_claude(prompt)

    return {
        "draft": req.draft,
        "subreddit": req.subreddit,
        "content_type": content_type,
        "analysis": analysis,
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

{f'USER PERSONA: {persona}' if persona else ''}
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
- Appropriate length for Reddit (2-4 sentences typically)"""

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

{f'USER PERSONA: {persona}' if persona else ''}
{rules_text}

Provide the refined comment only, no explanation. Make it sound natural and human."""

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
