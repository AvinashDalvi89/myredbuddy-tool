#!/usr/bin/env python3
"""
process_data.py - Extract and analyze Reddit posts and comments data.
Identifies tone/topic patterns that correlate with higher upvotes.
"""

import json
import re
from collections import Counter, defaultdict

DATA_DIR = "."


def load_data():
    with open(f"{DATA_DIR}/posts.json") as f:
        posts_raw = json.load(f)["data"]["children"]
    with open(f"{DATA_DIR}/comments.json") as f:
        comments_raw = json.load(f)["data"]["children"]

    posts = []
    for p in posts_raw:
        d = p["data"]
        posts.append({
            "type": "post",
            "subreddit": d["subreddit"],
            "title": d.get("title", ""),
            "content": d.get("selftext", ""),
            "ups": d.get("ups", 0),
        })

    comments = []
    for c in comments_raw:
        d = c["data"]
        comments.append({
            "type": "comment",
            "subreddit": d["subreddit"],
            "content": d.get("body", ""),
            "ups": d.get("ups", 0),
        })

    return posts, comments


def classify_tone(text):
    """Simple keyword-based tone classifier."""
    text_lower = text.lower()
    tones = []

    if any(w in text_lower for w in ["how i", "i built", "i fixed", "i stopped", "i was building"]):
        tones.append("personal_experience")
    if any(w in text_lower for w in ["what do you think", "anyone else", "do you", "how do you"]):
        tones.append("question_engaging")
    if any(w in text_lower for w in ["love it", "awesome", "great", "amazing", "wow", "spot on"]):
        tones.append("positive_enthusiastic")
    if any(w in text_lower for w in ["should", "need to", "must", "important"]):
        tones.append("advisory")
    if any(w in text_lower for w in ["data", "report", "benchmark", "tested", "compared"]):
        tones.append("data_driven")
    if any(w in text_lower for w in ["tip", "trick", "hack", "workflow", "approach"]):
        tones.append("practical_tip")
    if any(w in text_lower for w in ["vs", "difference", "better", "compare"]):
        tones.append("comparison")
    if any(w in text_lower for w in ["limit", "issue", "problem", "failing", "struggle", "hard"]):
        tones.append("pain_point")

    return tones if tones else ["neutral"]


def classify_topics(text):
    """Topic classifier based on keywords."""
    text_lower = text.lower()
    topics = []

    topic_map = {
        "ai_coding_tools": ["claude", "cursor", "kiro", "copilot", "gpt", "gemini", "ai tool", "agent mode"],
        "aws_cloud": ["aws", "ecs", "lambda", "amplify", "s3", "docker"],
        "dev_practices": ["code review", "pr ", "pull request", "design pattern", "best practice"],
        "career": ["resume", "interview", "switch", "manager", "engineer"],
        "limits_pricing": ["limit", "pro plan", "max plan", "pricing", "token", "$20"],
        "productivity": ["workflow", "speed", "productivity", "efficient"],
    }

    for topic, keywords in topic_map.items():
        if any(k in text_lower for k in keywords):
            topics.append(topic)

    return topics if topics else ["general"]


def analyze():
    posts, comments = load_data()
    all_items = posts + comments

    print("=" * 60)
    print("REDDIT DATA ANALYSIS REPORT")
    print("=" * 60)

    # --- Basic stats ---
    print(f"\nTotal posts: {len(posts)}  |  Total comments: {len(comments)}")
    post_ups = [p["ups"] for p in posts]
    comment_ups = [c["ups"] for c in comments]
    print(f"Post upvotes   - min: {min(post_ups)}, max: {max(post_ups)}, avg: {sum(post_ups)/len(post_ups):.1f}")
    print(f"Comment upvotes - min: {min(comment_ups)}, max: {max(comment_ups)}, avg: {sum(comment_ups)/len(comment_ups):.1f}")

    # --- Subreddit performance ---
    print("\n--- UPVOTES BY SUBREDDIT ---")
    sub_stats = defaultdict(lambda: {"total_ups": 0, "count": 0})
    for item in all_items:
        sub_stats[item["subreddit"]]["total_ups"] += item["ups"]
        sub_stats[item["subreddit"]]["count"] += 1

    for sub, stats in sorted(sub_stats.items(), key=lambda x: x[1]["total_ups"], reverse=True):
        avg = stats["total_ups"] / stats["count"]
        print(f"  r/{sub:<25} items: {stats['count']:>3}  total_ups: {stats['total_ups']:>4}  avg: {avg:.1f}")

    # --- Tone analysis ---
    print("\n--- TONE vs UPVOTES ---")
    tone_stats = defaultdict(lambda: {"total_ups": 0, "count": 0})
    for item in all_items:
        text = item.get("title", "") + " " + item["content"]
        for tone in classify_tone(text):
            tone_stats[tone]["total_ups"] += item["ups"]
            tone_stats[tone]["count"] += 1

    for tone, stats in sorted(tone_stats.items(), key=lambda x: x[1]["total_ups"] / max(x[1]["count"], 1), reverse=True):
        avg = stats["total_ups"] / stats["count"]
        print(f"  {tone:<25} count: {stats['count']:>3}  total_ups: {stats['total_ups']:>4}  avg: {avg:.1f}")

    # --- Topic analysis ---
    print("\n--- TOPIC vs UPVOTES ---")
    topic_stats = defaultdict(lambda: {"total_ups": 0, "count": 0})
    for item in all_items:
        text = item.get("title", "") + " " + item["content"]
        for topic in classify_topics(text):
            topic_stats[topic]["total_ups"] += item["ups"]
            topic_stats[topic]["count"] += 1

    for topic, stats in sorted(topic_stats.items(), key=lambda x: x[1]["total_ups"] / max(x[1]["count"], 1), reverse=True):
        avg = stats["total_ups"] / stats["count"]
        print(f"  {topic:<25} count: {stats['count']:>3}  total_ups: {stats['total_ups']:>4}  avg: {avg:.1f}")

    # --- Top performing content patterns ---
    print("\n--- TOP POSTS (by upvotes) ---")
    for p in sorted(posts, key=lambda x: x["ups"], reverse=True)[:5]:
        text = p.get("title", "") + " " + p["content"]
        tones = classify_tone(text)
        topics = classify_topics(text)
        print(f"  [{p['ups']:>3} ups] r/{p['subreddit']} - {p['title'][:65]}")
        print(f"          tones: {tones}  topics: {topics}")

    print("\n--- TOP COMMENTS (by upvotes) ---")
    for c in sorted(comments, key=lambda x: x["ups"], reverse=True)[:5]:
        tones = classify_tone(c["content"])
        topics = classify_topics(c["content"])
        print(f"  [{c['ups']:>3} ups] r/{c['subreddit']} - {c['content'][:65]}")
        print(f"          tones: {tones}  topics: {topics}")

    # --- Key insights ---
    print("\n" + "=" * 60)
    print("KEY INSIGHTS")
    print("=" * 60)

    best_tone = max(tone_stats.items(), key=lambda x: x[1]["total_ups"] / max(x[1]["count"], 1))
    best_topic = max(topic_stats.items(), key=lambda x: x[1]["total_ups"] / max(x[1]["count"], 1))
    best_sub = max(sub_stats.items(), key=lambda x: x[1]["total_ups"] / max(x[1]["count"], 1))

    print(f"  Best tone:      {best_tone[0]} (avg {best_tone[1]['total_ups']/best_tone[1]['count']:.1f} ups)")
    print(f"  Best topic:     {best_topic[0]} (avg {best_topic[1]['total_ups']/best_topic[1]['count']:.1f} ups)")
    print(f"  Best subreddit: r/{best_sub[0]} (avg {best_sub[1]['total_ups']/best_sub[1]['count']:.1f} ups)")

    # Save extracted data for other scripts
    extracted = {"posts": posts, "comments": comments}
    with open(f"{DATA_DIR}/extracted_data.json", "w") as f:
        json.dump(extracted, f, indent=2)
    print(f"\nExtracted data saved to extracted_data.json")


if __name__ == "__main__":
    analyze()
