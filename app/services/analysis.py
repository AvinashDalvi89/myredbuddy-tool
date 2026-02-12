"""
Analysis Service - Data Processing and Classification
"""

import os
import re
from typing import Dict, List, Any, Optional

from app.config import settings


# =============================================================================
# Tone and Topic Classification
# =============================================================================

# Import from existing process_data.py for compatibility
try:
    from process_data import classify_tone, classify_topics
except ImportError:
    # Fallback implementations if process_data not available
    def classify_tone(text: str) -> List[str]:
        """Classify the tone of text."""
        text_lower = text.lower()
        tones = []

        if any(w in text_lower for w in ["i think", "in my opinion", "personally", "i believe"]):
            tones.append("opinion")
        if any(w in text_lower for w in ["actually", "technically", "specifically"]):
            tones.append("technical")
        if any(w in text_lower for w in ["thanks", "thank you", "appreciate", "helpful"]):
            tones.append("grateful")
        if any(w in text_lower for w in ["question", "how", "what", "why", "?"]):
            tones.append("curious")
        if any(w in text_lower for w in ["agree", "exactly", "yes", "right"]):
            tones.append("agreeable")
        if any(w in text_lower for w in ["disagree", "wrong", "no", "incorrect"]):
            tones.append("disagreeable")
        if any(w in text_lower for w in ["try", "suggest", "recommend", "consider"]):
            tones.append("advisory")
        if any(w in text_lower for w in ["i did", "i used", "i found", "my experience"]):
            tones.append("experiential")

        return tones if tones else ["neutral"]

    def classify_topics(text: str) -> List[str]:
        """Classify topics in text."""
        text_lower = text.lower()
        topics = []

        topic_keywords = {
            "programming": ["code", "programming", "developer", "software", "api", "function"],
            "cloud": ["aws", "azure", "gcp", "cloud", "serverless", "lambda"],
            "devops": ["docker", "kubernetes", "ci/cd", "deployment", "jenkins"],
            "database": ["sql", "database", "postgres", "mongodb", "redis"],
            "ai": ["ai", "machine learning", "gpt", "claude", "llm", "neural"],
            "career": ["job", "interview", "career", "salary", "hiring", "resume"],
            "help": ["help", "issue", "problem", "error", "bug", "fix"],
        }

        for topic, keywords in topic_keywords.items():
            if any(kw in text_lower for kw in keywords):
                topics.append(topic)

        return topics if topics else ["general"]


# =============================================================================
# Item Analysis
# =============================================================================

def analyze_items(items: List[Dict[str, Any]]) -> Dict[str, Any]:
    """
    Analyze items and calculate statistics.

    Args:
        items: List of post/comment items

    Returns:
        Dict with tone_stats, topic_stats, and sub_stats
    """
    tone_stats = {}
    topic_stats = {}
    sub_stats = {}

    for item in items:
        ups = item.get("ups", 0)
        sub = item.get("subreddit", "unknown")

        # Subreddit stats
        if sub not in sub_stats:
            sub_stats[sub] = {"total_ups": 0, "count": 0}
        sub_stats[sub]["total_ups"] += ups
        sub_stats[sub]["count"] += 1

        # Tone stats
        for tone in item.get("tones", []):
            if tone not in tone_stats:
                tone_stats[tone] = {"total_ups": 0, "count": 0}
            tone_stats[tone]["total_ups"] += ups
            tone_stats[tone]["count"] += 1

        # Topic stats
        for topic in item.get("topics", []):
            if topic not in topic_stats:
                topic_stats[topic] = {"total_ups": 0, "count": 0}
            topic_stats[topic]["total_ups"] += ups
            topic_stats[topic]["count"] += 1

    # Calculate averages
    for stats in [tone_stats, topic_stats, sub_stats]:
        for key in stats:
            count = stats[key]["count"]
            stats[key]["avg"] = round(stats[key]["total_ups"] / count, 1) if count > 0 else 0

    return {
        "tone_stats": tone_stats,
        "topic_stats": topic_stats,
        "sub_stats": sub_stats,
    }


# =============================================================================
# Framework and Persona Loading
# =============================================================================

def load_framework() -> str:
    """Load the reddit framework markdown file."""
    fw_path = os.path.join(settings.BASE_DIR, "reddit_framework.md")
    if os.path.exists(fw_path):
        with open(fw_path) as f:
            return f.read()
    return ""


def load_persona(profile: Optional[str] = None) -> Optional[Dict[str, Any]]:
    """
    Load user persona for authentic comments.

    Args:
        profile: Optional profile name to load persona from

    Returns:
        Persona dict or None if not found
    """
    from app.services.storage import get_profile_data_path, get_active_profile

    # Try profile-specific persona first
    if profile:
        persona_path = get_profile_data_path(profile, "persona.json")
    else:
        active = get_active_profile()
        if active:
            persona_path = get_profile_data_path(active, "persona.json")
        else:
            persona_path = os.path.join(settings.BASE_DIR, "persona.json")

    if os.path.exists(persona_path):
        with open(persona_path) as f:
            return json.load(f)

    # Fallback to root persona
    root_persona = os.path.join(settings.BASE_DIR, "persona.json")
    if os.path.exists(root_persona):
        with open(root_persona) as f:
            return json.load(f)

    return None


# Need to import json for load_persona
import json


# =============================================================================
# Subreddit Rules
# =============================================================================

def load_subreddit_rules(subreddit: Optional[str] = None) -> Dict[str, Any]:
    """
    Load rules for a specific subreddit or all rules.

    Args:
        subreddit: Optional subreddit name

    Returns:
        Rules dict for the subreddit or all rules
    """
    rules_path = os.path.join(settings.BASE_DIR, "subreddit_rules.json")

    if not os.path.exists(rules_path):
        return {}

    with open(rules_path) as f:
        data = json.load(f)

    if subreddit:
        subs = data.get("subreddits", {})
        return subs.get(subreddit, subs.get(subreddit.lower(), data.get("default", {})))

    return data


def format_subreddit_rules(rules: Dict[str, Any]) -> str:
    """
    Format subreddit rules for prompt inclusion.

    Args:
        rules: Rules dict for a subreddit

    Returns:
        Formatted string for prompts
    """
    if not rules:
        return ""

    parts = []

    if rules.get("name"):
        parts.append(f"SUBREDDIT: {rules['name']}")
    if rules.get("focus"):
        parts.append(f"FOCUS: {rules['focus']}")
    if rules.get("rules"):
        parts.append("RULES:\n- " + "\n- ".join(rules["rules"][:4]))
    if rules.get("what_works"):
        parts.append("WHAT WORKS:\n- " + "\n- ".join(rules["what_works"][:3]))
    if rules.get("what_fails"):
        parts.append("WHAT FAILS:\n- " + "\n- ".join(rules["what_fails"][:3]))
    if rules.get("tone"):
        parts.append(f"TONE: {rules['tone']}")
    if rules.get("typical_audience"):
        parts.append(f"AUDIENCE: {rules['typical_audience']}")

    return "\n".join(parts)


def save_subreddit_rules(subreddit: str, rules: Dict[str, Any]) -> None:
    """
    Save rules for a subreddit.

    Args:
        subreddit: Subreddit name
        rules: Rules dict to save
    """
    rules_path = os.path.join(settings.BASE_DIR, "subreddit_rules.json")

    data = load_subreddit_rules() or {"subreddits": {}}

    if "subreddits" not in data:
        data["subreddits"] = {}

    data["subreddits"][subreddit] = rules

    with open(rules_path, "w") as f:
        json.dump(data, f, indent=2)


# =============================================================================
# Content Processing
# =============================================================================

def process_post_for_storage(post_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Process a raw Reddit post for storage.

    Args:
        post_data: Raw post data from Reddit API

    Returns:
        Processed post dict with tones and topics
    """
    text = f"{post_data.get('title', '')} {post_data.get('selftext', '')}"

    return {
        "type": "post",
        "id": post_data.get("id", ""),
        "subreddit": post_data.get("subreddit", ""),
        "title": post_data.get("title", ""),
        "content": post_data.get("selftext", "")[:500],
        "ups": post_data.get("ups", 0),
        "tones": classify_tone(text),
        "topics": classify_topics(text),
    }


def process_comment_for_storage(comment_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Process a raw Reddit comment for storage.

    Args:
        comment_data: Raw comment data from Reddit API

    Returns:
        Processed comment dict with tones and topics
    """
    body = comment_data.get("body", "")

    return {
        "type": "comment",
        "id": comment_data.get("id", ""),
        "subreddit": comment_data.get("subreddit", ""),
        "content": body[:500],
        "ups": comment_data.get("ups", 0),
        "tones": classify_tone(body),
        "topics": classify_topics(body),
    }
