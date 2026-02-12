"""
Reddit Service - Fetches data from Reddit's public JSON endpoints
"""

import json
import ssl
import time
import urllib.request
from typing import Optional, List, Dict, Any

from fastapi import HTTPException

from app.config import settings

# SSL context for Reddit API (some systems have certificate issues)
ssl_ctx = ssl.create_default_context()
ssl_ctx.check_hostname = False
ssl_ctx.verify_mode = ssl.CERT_NONE


def fetch_reddit_json(url: str, retries: int = 2) -> dict:
    """
    Fetch JSON from Reddit URL with retries.

    Args:
        url: The Reddit JSON endpoint URL
        retries: Number of retry attempts

    Returns:
        Parsed JSON response

    Raises:
        HTTPException: If fetch fails after all retries
    """
    req = urllib.request.Request(url, headers={"User-Agent": settings.USER_AGENT})

    for attempt in range(retries + 1):
        try:
            with urllib.request.urlopen(req, timeout=15, context=ssl_ctx) as resp:
                return json.loads(resp.read().decode())
        except Exception as e:
            if attempt == retries:
                raise HTTPException(
                    status_code=500,
                    detail=f"Failed to fetch from Reddit: {str(e)}"
                )
            time.sleep(1)


def fetch_user_posts(
    username: str,
    limit: int = 50,
    sort: str = "new"
) -> List[Dict[str, Any]]:
    """
    Fetch user's posts from Reddit.

    Args:
        username: Reddit username (without u/)
        limit: Maximum number of posts to fetch
        sort: Sort order (new, top, hot)

    Returns:
        List of post data dictionaries
    """
    url = f"https://www.reddit.com/user/{username}/submitted.json?limit={limit}&sort={sort}&t=all"
    data = fetch_reddit_json(url)

    posts = []
    for child in data.get("data", {}).get("children", []):
        p = child["data"]
        posts.append({
            "id": p.get("id", ""),
            "subreddit": p.get("subreddit", ""),
            "title": p.get("title", ""),
            "selftext": p.get("selftext", ""),
            "ups": p.get("ups", 0),
            "created_utc": p.get("created_utc", 0),
            "permalink": p.get("permalink", ""),
            "num_comments": p.get("num_comments", 0),
        })

    return posts


def fetch_user_comments(
    username: str,
    limit: int = 100,
    sort: str = "new"
) -> List[Dict[str, Any]]:
    """
    Fetch user's comments from Reddit.

    Args:
        username: Reddit username (without u/)
        limit: Maximum number of comments to fetch
        sort: Sort order (new, top, hot)

    Returns:
        List of comment data dictionaries
    """
    url = f"https://www.reddit.com/user/{username}/comments.json?limit={limit}&sort={sort}&t=all"
    data = fetch_reddit_json(url)

    comments = []
    for child in data.get("data", {}).get("children", []):
        c = child["data"]
        comments.append({
            "id": c.get("id", ""),
            "subreddit": c.get("subreddit", ""),
            "body": c.get("body", ""),
            "ups": c.get("ups", 0),
            "created_utc": c.get("created_utc", 0),
            "permalink": c.get("permalink", ""),
            "link_title": c.get("link_title", ""),
        })

    return comments


def fetch_subreddit_posts(
    subreddit: str,
    limit: int = 100,
    sort: str = "top",
    time_filter: str = "all"
) -> List[Dict[str, Any]]:
    """
    Fetch posts from a subreddit.

    Args:
        subreddit: Subreddit name (without r/)
        limit: Maximum number of posts to fetch
        sort: Sort order (top, hot, new, rising)
        time_filter: Time filter for top (all, year, month, week, day)

    Returns:
        List of post data dictionaries
    """
    url = f"https://www.reddit.com/r/{subreddit}/{sort}.json?limit={limit}&t={time_filter}"
    data = fetch_reddit_json(url)

    posts = []
    for child in data.get("data", {}).get("children", []):
        p = child["data"]
        posts.append({
            "id": p.get("id", ""),
            "subreddit": p.get("subreddit", subreddit),
            "title": p.get("title", ""),
            "selftext": p.get("selftext", ""),
            "ups": p.get("ups", 0),
            "num_comments": p.get("num_comments", 0),
            "created_utc": p.get("created_utc", 0),
            "permalink": p.get("permalink", ""),
            "author": p.get("author", ""),
        })

    return posts


def fetch_subreddit_new_posts(
    subreddit: str,
    limit: int = 25
) -> List[Dict[str, Any]]:
    """
    Fetch new/recent posts from a subreddit for opportunity finding.

    Args:
        subreddit: Subreddit name (without r/)
        limit: Maximum number of posts to fetch

    Returns:
        List of post data dictionaries with question indicators
    """
    url = f"https://www.reddit.com/r/{subreddit}/new.json?limit={limit}"
    data = fetch_reddit_json(url)

    posts = []
    for child in data.get("data", {}).get("children", []):
        p = child["data"]

        # Detect question type
        title = p.get("title", "").lower()
        question_type = "none"
        if "?" in title:
            question_type = "direct"
        elif any(w in title for w in ["how to", "how do", "help", "advice", "recommend"]):
            question_type = "implicit"
        elif any(w in title for w in ["looking for", "need", "want to"]):
            question_type = "seeking"

        posts.append({
            "id": p.get("id", ""),
            "title": p.get("title", ""),
            "selftext": p.get("selftext", ""),
            "ups": p.get("ups", 0),
            "num_comments": p.get("num_comments", 0),
            "created_utc": p.get("created_utc", 0),
            "permalink": p.get("permalink", ""),
            "author": p.get("author", ""),
            "question_type": question_type,
        })

    return posts
