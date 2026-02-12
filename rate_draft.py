#!/usr/bin/env python3
"""
rate_draft.py - Reddit content toolkit.

Subcommands:
  rate     "draft text" --sub <subreddit>        Rate a draft 1-10
  suggest  "post text"  --sub <subreddit>        Suggest 3 comment variations
  analyze  --sub <subreddit>                     Fetch & analyze top posts from any subreddit
  --web                                          Launch web UI with all features

Examples:
  python3 rate_draft.py rate "How I fixed my ECS costs by 60%" --sub aws
  python3 rate_draft.py suggest "Claude Code keeps hitting limits" --sub ClaudeCode
  python3 rate_draft.py analyze --sub ClaudeCode
  python3 rate_draft.py --web
"""

import sys
import os
import re
import json
import urllib.request
import urllib.error
import ssl
from collections import defaultdict

# Import classifiers from process_data.py
from process_data import classify_tone, classify_topics

DATA_DIR = os.path.dirname(os.path.abspath(__file__))
HIGH_ROI_SUBS = ["programming", "engineeringmanagers", "aws", "experienceddevs"]

# ─────────────────────────────────────────────
# RATE
# ─────────────────────────────────────────────

def rate_draft(text, subreddit=""):
    text_lower = text.lower()
    breakdown = []
    score = 0

    checks = [
        (2, any(w in text_lower for w in ["how i", "i built", "i fixed", "i stopped", "i was", "my experience", "i found"]),
         "Personal experience angle detected", "Missing personal experience angle ('How I...', 'I built...')"),
        (2, bool(re.search(r'\d+[\.\d]*[x×%]|\d+ (times|percent|hours|days|tokens)', text_lower)) or
         any(w in text_lower for w in ["data", "benchmark", "report", "tested", "measured", "result", "compared"]),
         "Data/numbers/benchmarks included", "Add numbers, data, or benchmarks to strengthen the post"),
        (1, any(w in text_lower for w in [" vs ", "versus", "difference between", "compared to", "better than", "switch from"]),
         "Comparison/contrast present", "Consider adding a comparison (X vs Y)"),
        (1, any(w in text_lower for w in ["limit", "issue", "problem", "struggle", "frustrat", "pain", "hard", "difficult", "failing", "broke"]),
         "Addresses a real pain point", "Consider mentioning a pain point readers relate to"),
        (1, "?" in text,
         "Ends with or includes a question", "Add a question to drive discussion"),
        (1, subreddit and subreddit.lower() in HIGH_ROI_SUBS,
         f"Targeting high-ROI subreddit: r/{subreddit}", f"r/{subreddit} is not a top performer" if subreddit else "No subreddit specified"),
        (1, any(w in text_lower for w in ["claude", "cursor", "kiro", "aws", "ecs", "lambda", "gpt", "docker", "pr ", "pull request", "code review", "next.js", "react", "angular"]),
         "Specific tools/tech mentioned (concrete)", "Make it more concrete - mention specific tools or technologies"),
        (1, any(w in text_lower for w in ["tip", "trick", "step", "approach", "workflow", "try ", "use ", "switch to", "instead of"]),
         "Contains actionable advice", "Add actionable takeaway (a tip, step, or recommendation)"),
    ]

    for points, condition, yes_msg, no_msg in checks:
        if condition:
            score += points
            breakdown.append(f"[+{points}] {yes_msg}")
        else:
            breakdown.append(f"[+0] {no_msg}")

    score = max(1, min(10, score))
    return score, breakdown


def format_rating(text, subreddit, score, breakdown):
    lines = ["=" * 50, "DRAFT RATING", "=" * 50]
    lines.append(f"\nDraft preview: {text[:120]}...")
    if subreddit:
        lines.append(f"Target subreddit: r/{subreddit}")
    lines.append(f"\nSCORE: {score}/10\n")
    for b in breakdown:
        lines.append(f"  {b}")
    lines.append("")
    if score >= 7:
        lines.append("Verdict: Good to post.")
    elif score >= 5:
        lines.append("Verdict: Decent but could be stronger. Address the +0 items above.")
    else:
        lines.append("Verdict: Needs work. Focus on the +0 items before posting.")
    lines.append("=" * 50)
    return "\n".join(lines)


# ─────────────────────────────────────────────
# SUGGEST COMMENTS (OpenAI-powered)
# ─────────────────────────────────────────────

def _load_your_top_comments():
    """Load your high-performing comments as style examples."""
    extracted_path = os.path.join(DATA_DIR, "extracted_data.json")
    if not os.path.exists(extracted_path):
        return []
    with open(extracted_path) as f:
        data = json.load(f)
    comments = sorted(data.get("comments", []), key=lambda x: x["ups"], reverse=True)
    return [c for c in comments if c["ups"] >= 2][:10]


def _load_env_key(key_name):
    """Load an API key from environment or .env file."""
    val = os.environ.get(key_name, "")
    if not val:
        config_path = os.path.join(DATA_DIR, ".env")
        if os.path.exists(config_path):
            with open(config_path) as f:
                for line in f:
                    line = line.strip()
                    if line.startswith(f"{key_name}="):
                        val = line.split("=", 1)[1].strip().strip('"').strip("'")
    return val


def _call_llm(messages):
    """Call Gemini API (falls back to OpenAI if no Gemini key)."""
    gemini_key = _load_env_key("GEMINI_API_KEY")
    openai_key = _load_env_key("OPENAI_API_KEY")

    ctx = ssl.create_default_context()
    ctx.check_hostname = False
    ctx.verify_mode = ssl.CERT_NONE

    if gemini_key:
        return _call_gemini(messages, gemini_key, ctx)
    elif openai_key:
        return _call_openai_api(messages, openai_key, ctx)
    else:
        return None, "No API key found. Add GEMINI_API_KEY or OPENAI_API_KEY to .env file."


def _call_gemini(messages, api_key, ctx):
    """Call Google Gemini API."""
    # Convert OpenAI-style messages to Gemini format
    system_text = ""
    contents = []
    for m in messages:
        if m["role"] == "system":
            system_text = m["content"]
        elif m["role"] == "user":
            contents.append({"role": "user", "parts": [{"text": m["content"]}]})
        elif m["role"] == "assistant":
            contents.append({"role": "model", "parts": [{"text": m["content"]}]})

    body = {"contents": contents, "generationConfig": {"temperature": 0.8}}
    if system_text:
        body["systemInstruction"] = {"parts": [{"text": system_text}]}

    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key={api_key}"
    payload = json.dumps(body).encode()
    req = urllib.request.Request(url, data=payload, headers={"Content-Type": "application/json"})

    try:
        with urllib.request.urlopen(req, timeout=45, context=ctx) as resp:
            result = json.loads(resp.read().decode())
        text = result["candidates"][0]["content"]["parts"][0]["text"]
        return text, None
    except urllib.error.HTTPError as e:
        error_body = e.read().decode() if hasattr(e, 'read') else ""
        return None, f"Gemini API error {e.code}: {error_body[:200]}"
    except Exception as e:
        return None, f"Gemini error: {str(e)}"


def _call_openai_api(messages, api_key, ctx):
    """Call OpenAI chat completions API."""
    payload = json.dumps({"model": "gpt-4o-mini", "messages": messages, "temperature": 0.8}).encode()
    req = urllib.request.Request(
        "https://api.openai.com/v1/chat/completions",
        data=payload,
        headers={"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"},
    )
    try:
        with urllib.request.urlopen(req, timeout=30, context=ctx) as resp:
            result = json.loads(resp.read().decode())
        return result["choices"][0]["message"]["content"], None
    except Exception as e:
        return None, str(e)


def suggest_comments(post_text, subreddit):
    """Generate 3 specific, different comments using OpenAI based on your framework."""
    tones = classify_tone(post_text)
    topics = classify_topics(post_text)

    # Build example comments from your actual top performers
    top_comments = _load_your_top_comments()
    examples_block = ""
    if top_comments:
        examples_block = "HERE ARE MY ACTUAL HIGH-PERFORMING COMMENTS (study the style, tone, length):\n\n"
        for c in top_comments[:8]:
            examples_block += f"[{c['ups']} ups in r/{c['subreddit']}]: {c['content'][:300]}\n\n"

    # Load the framework file directly so LLM follows it as-is
    framework_text = ""
    fw_path = os.path.join(DATA_DIR, "reddit_framework.md")
    if os.path.exists(fw_path):
        with open(fw_path) as f:
            framework_text = f.read()

    system_prompt = f"""You are ghostwriting Reddit comments for a specific developer. You must follow their framework EXACTLY.

===== THE FRAMEWORK (follow this as strict rules, not suggestions) =====
{framework_text}
===== END FRAMEWORK =====

===== SCORING CHECKLIST (every comment you write MUST score 7+ on this) =====
+2 points: Personal experience / "How I..." / "I built..." / "At my project..."
+2 points: Includes real numbers, data, benchmarks, or measurable outcomes
+1 point: Compares tools or approaches ("X vs Y", "I switched from A to B")
+1 point: Addresses a shared pain point or frustration
+1 point: Specific tools/tech named (Claude, Cursor, ECS, Lambda, etc.)
+1 point: Actionable advice (a concrete step someone can take)
Target: 7+ out of 10
===== END SCORING =====

===== STYLE RULES FROM THEIR TOP COMMENTS =====
{examples_block}
From the examples above, notice:
- They write with direct, slightly informal English
- They reference their own real workflow and tool combinations
- They mention specific tool names, plan tiers, time durations
- They don't use filler phrases or generic closers
- They share honest limitations ("still figuring out", "not perfect but")
- Best comments are 2-5 sentences. Never write walls of text.
===== END STYLE =====

===== HARD RULES =====
- NEVER use these closers: "Would love to hear", "Happy to share more", "What's been your experience", "Curious what others think"
- NEVER use placeholder brackets like [your tool] or [specific example]
- NEVER write generic agreement ("Agree with you", "This is great", "Spot on")
- NEVER start two comments the same way
- NEVER be purely positive without substance
- Each comment MUST have a different tone AND a different angle on the post
- Write as this developer, not as an AI assistant
===== END HARD RULES ====="""

    user_prompt = f"""Write 3 Reddit comments for this post in r/{subreddit}:

---
{post_text[:1500]}
---

Requirements:
- Each comment must be SPECIFIC to this exact post (reference its content directly)
- Each comment must use a DIFFERENT tone from the framework (pick from: personal_experience, data_driven, comparison, advisory, practical_tip)
- Each comment must score 7+ on the framework checklist
- After each comment, show the score breakdown

Format EXACTLY like this:
COMMENT_1_TONE: (tone name)
COMMENT_1:
(the comment text)
SCORE_1: X/10 - (brief breakdown of which criteria it hits)

COMMENT_2_TONE: (different tone)
COMMENT_2:
(the comment text)
SCORE_2: X/10 - (breakdown)

COMMENT_3_TONE: (different tone)
COMMENT_3:
(the comment text)
SCORE_3: X/10 - (breakdown)"""

    response, error = _call_llm([
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": user_prompt},
    ])

    if error:
        return {
            "post_tones": tones, "post_topics": topics, "subreddit": subreddit,
            "suggestions": [], "anti_patterns": [],
            "error": error,
        }

    # Parse the 3 comments from response
    suggestions = []
    parts = re.split(r'COMMENT_(\d)_TONE:', response)
    for i in range(1, len(parts), 2):
        if i + 1 >= len(parts):
            break
        chunk = parts[i + 1].strip()
        # Extract tone (first line)
        tone_line, _, rest = chunk.partition("\n")
        tone_label = tone_line.strip()

        # Split out COMMENT_N: marker
        comment_match = re.split(r'COMMENT_\d:', rest, maxsplit=1)
        body = comment_match[1].strip() if len(comment_match) == 2 else rest.strip()

        # Split out SCORE_N: line if present
        score_match = re.split(r'SCORE_\d:', body, maxsplit=1)
        comment_text = score_match[0].strip()
        llm_score = score_match[1].strip() if len(score_match) == 2 else ""

        suggestions.append({
            "tone": tone_label.lower().replace(" ", "_"),
            "comment": comment_text,
            "llm_score": llm_score,
        })

    # Anti-patterns based on post type
    anti_patterns = []
    post_lower = post_text.lower()
    if any(w in post_lower for w in ["i built", "i made", "i created", "launched"]):
        anti_patterns.append("Don't just say 'Great work!' - add a specific observation")
    if any(w in post_lower for w in ["anyone else", "am i the only"]):
        anti_patterns.append("Don't just say 'Agree' - add YOUR angle")
    if any(w in post_lower for w in ["how do", "any tips", "advice", "what do you"]):
        anti_patterns.append("Don't give abstract advice - be specific about what YOU did")
    if not anti_patterns:
        anti_patterns.append("Don't restate the post without adding a new angle")

    return {
        "post_tones": tones,
        "post_topics": topics,
        "subreddit": subreddit,
        "suggestions": suggestions,
        "anti_patterns": anti_patterns,
    }


def format_suggestions(result):
    lines = ["=" * 55, "COMMENT SUGGESTIONS", "=" * 55]
    if result.get("error"):
        lines.append(f"\nError: {result['error']}")
        lines.append("=" * 55)
        return "\n".join(lines)

    lines.append(f"\nPost tones: {result['post_tones']}")
    lines.append(f"Post topics: {result['post_topics']}")
    lines.append(f"Subreddit: r/{result['subreddit']}")

    for i, s in enumerate(result["suggestions"], 1):
        lines.append(f"\n{'─' * 55}")
        lines.append(f"Option {i} [{s['tone']}]")
        if s.get("llm_score"):
            lines.append(f"Framework score: {s['llm_score']}")
        lines.append(f"{'─' * 55}")
        for line in s["comment"].split("\n"):
            lines.append(f"  {line}")

    lines.append(f"\n{'─' * 55}")
    lines.append("AVOID THESE (0-ups patterns from your data):")
    for ap in result["anti_patterns"]:
        lines.append(f"  - {ap}")

    lines.append("=" * 55)
    return "\n".join(lines)


# ─────────────────────────────────────────────
# COMPETITOR ANALYSIS
# ─────────────────────────────────────────────

def fetch_subreddit_top(subreddit, limit=100):
    """Fetch top posts from a subreddit using Reddit's public JSON API."""
    url = f"https://www.reddit.com/r/{subreddit}/top.json?sort=top&t=all&limit={limit}"
    ctx = ssl.create_default_context()
    ctx.check_hostname = False
    ctx.verify_mode = ssl.CERT_NONE
    req = urllib.request.Request(url, headers={"User-Agent": "reddit-buddy-analyzer/1.0"})
    try:
        with urllib.request.urlopen(req, timeout=15, context=ctx) as resp:
            data = json.loads(resp.read().decode())
    except urllib.error.HTTPError as e:
        return None, f"HTTP error {e.code} fetching r/{subreddit}"
    except Exception as e:
        return None, str(e)

    save_path = os.path.join(DATA_DIR, f"competitor_{subreddit}.json")
    with open(save_path, "w") as f:
        json.dump(data, f, indent=2)

    posts = []
    for p in data.get("data", {}).get("children", []):
        d = p["data"]
        posts.append({
            "subreddit": d.get("subreddit", subreddit),
            "title": d.get("title", ""),
            "content": d.get("selftext", ""),
            "ups": d.get("ups", 0),
            "num_comments": d.get("num_comments", 0),
            "author": d.get("author", ""),
        })

    return posts, save_path


def analyze_competitor(subreddit):
    """Fetch and analyze a subreddit's top posts."""
    posts, info = fetch_subreddit_top(subreddit)
    if posts is None:
        return {"error": info}

    # Tone analysis
    tone_stats = defaultdict(lambda: {"total_ups": 0, "count": 0})
    topic_stats = defaultdict(lambda: {"total_ups": 0, "count": 0})

    for p in posts:
        text = p["title"] + " " + p["content"]
        for tone in classify_tone(text):
            tone_stats[tone]["total_ups"] += p["ups"]
            tone_stats[tone]["count"] += 1
        for topic in classify_topics(text):
            topic_stats[topic]["total_ups"] += p["ups"]
            topic_stats[topic]["count"] += 1

    ups_list = [p["ups"] for p in posts]
    comments_list = [p["num_comments"] for p in posts]

    tone_ranked = sorted(tone_stats.items(), key=lambda x: x[1]["total_ups"] / max(x[1]["count"], 1), reverse=True)
    topic_ranked = sorted(topic_stats.items(), key=lambda x: x[1]["total_ups"] / max(x[1]["count"], 1), reverse=True)

    # Load your own data for comparison if available
    own_data = None
    extracted_path = os.path.join(DATA_DIR, "extracted_data.json")
    if os.path.exists(extracted_path):
        with open(extracted_path) as f:
            own_data = json.load(f)

    return {
        "subreddit": subreddit,
        "save_path": info,
        "post_count": len(posts),
        "ups_min": min(ups_list) if ups_list else 0,
        "ups_max": max(ups_list) if ups_list else 0,
        "ups_avg": sum(ups_list) / len(ups_list) if ups_list else 0,
        "comments_avg": sum(comments_list) / len(comments_list) if comments_list else 0,
        "tone_ranked": tone_ranked,
        "topic_ranked": topic_ranked,
        "top_posts": sorted(posts, key=lambda x: x["ups"], reverse=True)[:10],
        "own_data": own_data,
    }


def format_analysis(result):
    if "error" in result:
        return f"Error: {result['error']}"

    lines = ["=" * 60, f"COMPETITOR ANALYSIS: r/{result['subreddit']}", "=" * 60]
    lines.append(f"Saved to: {result['save_path']}")
    lines.append(f"Posts fetched: {result['post_count']}")
    lines.append(f"Upvotes - min: {result['ups_min']}, max: {result['ups_max']}, avg: {result['ups_avg']:.0f}")
    lines.append(f"Avg comments per post: {result['comments_avg']:.0f}")

    lines.append("\n--- WHAT TONE WORKS (ranked by avg ups) ---")
    for tone, stats in result["tone_ranked"]:
        avg = stats["total_ups"] / stats["count"]
        lines.append(f"  {tone:<25} count: {stats['count']:>3}  avg_ups: {avg:.1f}")

    lines.append("\n--- WHAT TOPICS WORK (ranked by avg ups) ---")
    for topic, stats in result["topic_ranked"]:
        avg = stats["total_ups"] / stats["count"]
        lines.append(f"  {topic:<25} count: {stats['count']:>3}  avg_ups: {avg:.1f}")

    lines.append("\n--- TOP 10 POSTS ---")
    for p in result["top_posts"]:
        text = p["title"][:70]
        lines.append(f"  [{p['ups']:>5} ups, {p['num_comments']:>3} comments] {text}")

    # Hybrid comparison with your data
    if result["own_data"]:
        lines.append("\n--- HYBRID: YOUR DATA vs COMPETITOR ---")
        own_items = result["own_data"].get("posts", []) + result["own_data"].get("comments", [])
        own_sub_items = [i for i in own_items if i["subreddit"].lower() == result["subreddit"].lower()]
        if own_sub_items:
            own_avg = sum(i["ups"] for i in own_sub_items) / len(own_sub_items)
            lines.append(f"  Your avg ups in r/{result['subreddit']}: {own_avg:.1f}")
            lines.append(f"  Top posts avg ups in r/{result['subreddit']}: {result['ups_avg']:.0f}")
            if own_avg < result["ups_avg"]:
                lines.append(f"  Gap: ~{result['ups_avg'] - own_avg:.0f} ups below top performers")
                lines.append(f"  Recommendation: Study the top tones/topics above and adapt your style")
            else:
                lines.append(f"  You're performing at or above the subreddit average")
        else:
            lines.append(f"  No existing data for r/{result['subreddit']} in your history")
            lines.append(f"  Use the tone/topic insights above to craft your first posts")

    lines.append("=" * 60)
    return "\n".join(lines)


# ─────────────────────────────────────────────
# WEB UI
# ─────────────────────────────────────────────

WEB_HTML = """<!DOCTYPE html>
<html>
<head>
<title>RedBuddy</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: -apple-system, system-ui, sans-serif; background: #1a1a2e; color: #e0e0e0; min-height: 100vh; padding: 2rem; display: flex; justify-content: center; }
  .container { max-width: 780px; width: 100%; }
  h1 { color: #ff6b35; margin-bottom: 0.5rem; font-size: 1.8rem; }
  .tabs { display: flex; gap: 0; margin: 1.5rem 0 1rem; border-bottom: 2px solid #333; }
  .tab { padding: 0.6rem 1.4rem; cursor: pointer; color: #a0a0c0; font-weight: 600; border-bottom: 2px solid transparent; margin-bottom: -2px; }
  .tab.active { color: #ff6b35; border-bottom-color: #ff6b35; }
  .tab:hover { color: #ff6b35; }
  .panel { display: none; }
  .panel.active { display: block; }
  label { display: block; margin-bottom: 0.3rem; font-weight: 600; color: #a0a0c0; margin-top: 0.8rem; }
  textarea { width: 100%; height: 140px; padding: 0.8rem; border: 1px solid #333; border-radius: 8px; background: #16213e; color: #e0e0e0; font-size: 1rem; resize: vertical; }
  input[type=text] { width: 100%; padding: 0.6rem 0.8rem; border: 1px solid #333; border-radius: 8px; background: #16213e; color: #e0e0e0; font-size: 1rem; }
  button { background: #ff6b35; color: white; border: none; padding: 0.7rem 2rem; border-radius: 8px; font-size: 1rem; cursor: pointer; font-weight: 600; margin-top: 1rem; }
  button:hover { background: #e55a2b; }
  .result { margin-top: 1.2rem; padding: 1.2rem; background: #16213e; border-radius: 8px; border: 1px solid #333; }
  .score { font-size: 2.5rem; font-weight: 800; margin: 0.3rem 0; }
  .score.high { color: #46d160; } .score.mid { color: #ffb347; } .score.low { color: #ea0027; }
  .breakdown { list-style: none; margin-top: 0.5rem; }
  .breakdown li { padding: 0.2rem 0; font-family: monospace; font-size: 0.85rem; }
  .verdict { margin-top: 0.8rem; padding: 0.5rem; border-radius: 6px; font-weight: 600; text-align: center; }
  .verdict.high { background: #1a3a1a; color: #46d160; }
  .verdict.mid { background: #3a3a1a; color: #ffb347; }
  .verdict.low { background: #3a1a1a; color: #ea0027; }
  .comment-card { background: #0f1a30; border: 1px solid #2a3a5a; border-radius: 8px; padding: 1rem; margin-top: 0.8rem; }
  .comment-card h3 { color: #ff6b35; font-size: 0.95rem; margin-bottom: 0.4rem; }
  .comment-card p { font-size: 0.95rem; line-height: 1.5; }
  .comment-card .meta { font-size: 0.8rem; color: #666; margin-top: 0.4rem; }
  .analysis-table { width: 100%; border-collapse: collapse; margin-top: 0.6rem; }
  .analysis-table th, .analysis-table td { text-align: left; padding: 0.4rem 0.6rem; border-bottom: 1px solid #2a2a4a; font-size: 0.85rem; }
  .analysis-table th { color: #a0a0c0; }
  .top-post { padding: 0.3rem 0; font-size: 0.85rem; border-bottom: 1px solid #1a1a3e; }
  .top-post .ups { color: #ff6b35; font-weight: 700; }
  .tags { display: flex; gap: 0.3rem; margin-top: 0.3rem; }
  .tag { background: #2a2a4a; padding: 0.15rem 0.5rem; border-radius: 4px; font-size: 0.75rem; color: #a0a0c0; }
  .loading { display: none; color: #ff6b35; margin-top: 0.5rem; }
</style>
</head>
<body>
<div class="container">
  <h1>RedBuddy</h1>
  <p style="color:#666">Rate drafts, get comment suggestions, analyze competitors.</p>

  <div class="tabs">
    <div class="tab active" onclick="switchTab('rate')">Rate Draft</div>
    <div class="tab" onclick="switchTab('suggest')">Suggest Comments</div>
    <div class="tab" onclick="switchTab('analyze')">Analyze Competitors</div>
  </div>

  <!-- RATE TAB -->
  <div id="panel-rate" class="panel active">
    <form method="POST" action="/rate">
      <label>Your draft</label>
      <textarea name="draft" placeholder="Paste your Reddit post or comment draft...">{{ rate_draft or '' }}</textarea>
      <label>Target subreddit</label>
      <input type="text" name="subreddit" placeholder="e.g. programming" value="{{ rate_sub or '' }}">
      <button type="submit">Rate Draft</button>
    </form>
    {% if rate_score is not none %}
    <div class="result">
      <div>Score</div>
      <div class="score {{ 'high' if rate_score >= 7 else ('mid' if rate_score >= 5 else 'low') }}">{{ rate_score }}/10</div>
      <ul class="breakdown">{% for b in rate_breakdown %}<li>{{ b }}</li>{% endfor %}</ul>
      <div class="verdict {{ 'high' if rate_score >= 7 else ('mid' if rate_score >= 5 else 'low') }}">
        {% if rate_score >= 7 %}Good to post.{% elif rate_score >= 5 %}Decent but could be stronger.{% else %}Needs work before posting.{% endif %}
      </div>
    </div>
    {% endif %}
  </div>

  <!-- SUGGEST TAB -->
  <div id="panel-suggest" class="panel">
    <form method="POST" action="/suggest">
      <label>Post you want to comment on</label>
      <textarea name="post_text" placeholder="Paste the Reddit post text you want to respond to...">{{ suggest_text or '' }}</textarea>
      <label>Subreddit</label>
      <input type="text" name="subreddit" placeholder="e.g. ClaudeCode" value="{{ suggest_sub or '' }}">
      <button type="submit">Suggest Comments</button>
    </form>
    {% if suggest_error %}
    <div class="result"><p style="color:#ea0027;">Error: {{ suggest_error }}</p></div>
    {% elif suggestions %}
    <div class="result">
      <div class="tags" style="margin-bottom:0.5rem;">
        {% for t in suggest_tones %}<span class="tag">{{ t }}</span>{% endfor %}
        {% for t in suggest_topics %}<span class="tag">{{ t }}</span>{% endfor %}
      </div>
      {% for s in suggestions %}
      <div class="comment-card">
        <h3>Option {{ loop.index }} <span style="font-weight:400;font-size:0.8rem;color:#666;">{{ s.tone }}</span></h3>
        {% if s.llm_score %}<div style="font-size:0.8rem;color:#46d160;margin-bottom:0.4rem;">Framework score: {{ s.llm_score }}</div>{% endif %}
        <p style="white-space:pre-line;">{{ s.comment }}</p>
      </div>
      {% endfor %}
      {% if suggest_anti %}
      <div style="margin-top:1rem;padding:0.8rem;background:#2a1a1a;border-radius:6px;border:1px solid #4a2a2a;">
        <div style="color:#ea0027;font-weight:600;margin-bottom:0.3rem;">Avoid (0-ups patterns):</div>
        {% for ap in suggest_anti %}<div style="font-size:0.85rem;padding:0.2rem 0;">- {{ ap }}</div>{% endfor %}
      </div>
      {% endif %}
    </div>
    {% endif %}
  </div>

  <!-- ANALYZE TAB -->
  <div id="panel-analyze" class="panel">
    <form method="POST" action="/analyze">
      <label>Subreddit to analyze</label>
      <input type="text" name="subreddit" placeholder="e.g. ClaudeCode" value="{{ analyze_sub or '' }}">
      <button type="submit">Fetch &amp; Analyze</button>
    </form>
    {% if analysis %}
    <div class="result">
      <p>Posts fetched: {{ analysis.post_count }} &nbsp;|&nbsp; Avg ups: {{ '%.0f' | format(analysis.ups_avg) }} &nbsp;|&nbsp; Max ups: {{ analysis.ups_max }}</p>

      <h3 style="margin-top:1rem;color:#ff6b35;">Winning Tones</h3>
      <table class="analysis-table">
        <tr><th>Tone</th><th>Count</th><th>Avg Ups</th></tr>
        {% for tone, stats in analysis.tone_ranked %}
        <tr><td>{{ tone }}</td><td>{{ stats.count }}</td><td>{{ '%.1f' | format(stats.total_ups / stats.count) }}</td></tr>
        {% endfor %}
      </table>

      <h3 style="margin-top:1rem;color:#ff6b35;">Winning Topics</h3>
      <table class="analysis-table">
        <tr><th>Topic</th><th>Count</th><th>Avg Ups</th></tr>
        {% for topic, stats in analysis.topic_ranked %}
        <tr><td>{{ topic }}</td><td>{{ stats.count }}</td><td>{{ '%.1f' | format(stats.total_ups / stats.count) }}</td></tr>
        {% endfor %}
      </table>

      <h3 style="margin-top:1rem;color:#ff6b35;">Top 10 Posts</h3>
      {% for p in analysis.top_posts %}
      <div class="top-post"><span class="ups">{{ p.ups }} ups</span> &nbsp; {{ p.title[:80] }}</div>
      {% endfor %}

      {% if analysis.hybrid %}
      <h3 style="margin-top:1rem;color:#ff6b35;">Your Data vs Competitor</h3>
      <p style="font-size:0.9rem;">{{ analysis.hybrid }}</p>
      {% endif %}
    </div>
    {% endif %}
  </div>
</div>

<script>
function switchTab(name) {
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
  event.target.classList.add('active');
  document.getElementById('panel-' + name).classList.add('active');
}
// Auto-switch to the tab that has results
{% if suggestions %}switchTab('suggest');document.querySelectorAll('.tab')[1].classList.add('active');document.querySelectorAll('.tab')[0].classList.remove('active');{% endif %}
{% if analysis %}switchTab('analyze');document.querySelectorAll('.tab')[2].classList.add('active');document.querySelectorAll('.tab')[0].classList.remove('active');{% endif %}
</script>
</body>
</html>"""


def run_web():
    try:
        from flask import Flask, request as freq, render_template_string, redirect
    except ImportError:
        print("Flask not installed. Run: pip install flask")
        sys.exit(1)

    app = Flask(__name__)

    @app.route("/", methods=["GET"])
    def index():
        return render_template_string(WEB_HTML,
            rate_score=None, rate_breakdown=[], rate_draft="", rate_sub="",
            suggestions=None, suggest_text="", suggest_sub="", suggest_tones=[], suggest_topics=[], suggest_anti=[], suggest_error="",
            analysis=None, analyze_sub="")

    @app.route("/rate", methods=["POST"])
    def web_rate():
        draft = freq.form.get("draft", "")
        sub = freq.form.get("subreddit", "")
        score, breakdown = rate_draft(draft, sub)
        return render_template_string(WEB_HTML,
            rate_score=score, rate_breakdown=breakdown, rate_draft=draft, rate_sub=sub,
            suggestions=None, suggest_text="", suggest_sub="", suggest_tones=[], suggest_topics=[], suggest_anti=[], suggest_error="",
            analysis=None, analyze_sub="")

    @app.route("/suggest", methods=["POST"])
    def web_suggest():
        post_text = freq.form.get("post_text", "")
        sub = freq.form.get("subreddit", "")
        result = suggest_comments(post_text, sub)
        return render_template_string(WEB_HTML,
            rate_score=None, rate_breakdown=[], rate_draft="", rate_sub="",
            suggestions=result["suggestions"], suggest_text=post_text, suggest_sub=sub,
            suggest_tones=result["post_tones"], suggest_topics=result["post_topics"],
            suggest_anti=result["anti_patterns"], suggest_error=result.get("error", ""),
            analysis=None, analyze_sub="")

    @app.route("/analyze", methods=["POST"])
    def web_analyze():
        sub = freq.form.get("subreddit", "")
        result = analyze_competitor(sub)
        # Add hybrid text for template
        if result.get("own_data"):
            own_items = result["own_data"].get("posts", []) + result["own_data"].get("comments", [])
            own_sub = [i for i in own_items if i["subreddit"].lower() == sub.lower()]
            if own_sub:
                own_avg = sum(i["ups"] for i in own_sub) / len(own_sub)
                result["hybrid"] = f"Your avg in r/{sub}: {own_avg:.1f} ups | Top posts avg: {result['ups_avg']:.0f} ups"
            else:
                result["hybrid"] = f"No history in r/{sub}. Use tone/topic insights above for your first posts."
        else:
            result["hybrid"] = None

        return render_template_string(WEB_HTML,
            rate_score=None, rate_breakdown=[], rate_draft="", rate_sub="",
            suggestions=None, suggest_text="", suggest_sub="", suggest_tones=[], suggest_topics=[], suggest_anti=[], suggest_error="",
            analysis=result, analyze_sub=sub)

    print("Starting RedBuddy at http://localhost:5050")
    app.run(port=5050, debug=False)


# ─────────────────────────────────────────────
# CLI
# ─────────────────────────────────────────────

def get_arg(flag):
    if flag in sys.argv:
        idx = sys.argv.index(flag)
        if idx + 1 < len(sys.argv):
            return sys.argv[idx + 1]
    return ""


def main():
    if "--web" in sys.argv:
        run_web()
        return

    if len(sys.argv) < 2:
        print(__doc__)
        sys.exit(1)

    cmd = sys.argv[1]
    sub = get_arg("--sub")

    if cmd == "rate":
        if len(sys.argv) < 3:
            print('Usage: python3 rate_draft.py rate "draft text" --sub <subreddit>')
            sys.exit(1)
        text = sys.argv[2]
        score, breakdown = rate_draft(text, sub)
        print(format_rating(text, sub, score, breakdown))

    elif cmd == "suggest":
        if len(sys.argv) < 3 or not sub:
            print('Usage: python3 rate_draft.py suggest "post text" --sub <subreddit>')
            sys.exit(1)
        post_text = sys.argv[2]
        result = suggest_comments(post_text, sub)
        print(format_suggestions(result))

    elif cmd == "analyze":
        if not sub:
            print('Usage: python3 rate_draft.py analyze --sub <subreddit>')
            sys.exit(1)
        result = analyze_competitor(sub)
        print(format_analysis(result))

    else:
        # Backward compat: treat first arg as draft text
        text = cmd
        score, breakdown = rate_draft(text, sub)
        print(format_rating(text, sub, score, breakdown))


if __name__ == "__main__":
    main()
