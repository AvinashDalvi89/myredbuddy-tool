#!/usr/bin/env python3
"""
Reputation Shield - Defensive modules for Reddit engagement
Protects your account from bans, shadow-bans, and mod removals
"""

import re
import os
import json
import time
import urllib.request
import ssl
from typing import List, Dict, Optional, Tuple
from dataclasses import dataclass

# =============================================================================
# A. MOD-LOGIC PRE-FLIGHT CHECK
# =============================================================================

# AI/Bot-like phrases that trigger mod suspicion
AI_FLUFF_PATTERNS = [
    # Generic openers
    (r"\b(in today'?s? (fast-paced|digital|modern) world)\b", "Generic AI opener"),
    (r"\b(as (a|an) (ai|language model|assistant))\b", "AI self-reference"),
    (r"\b(i('?m| am) glad you asked)\b", "AI filler phrase"),
    (r"\b(great question!)\b", "Overly enthusiastic AI response"),
    (r"\b(that'?s? a (great|excellent|wonderful) (point|question))\b", "AI validation phrase"),

    # Fluff phrases
    (r"\b(it'?s? (worth|important to) (noting|mentioning|considering))\b", "Filler phrase"),
    (r"\b(at the end of the day)\b", "Cliché phrase"),
    (r"\b(when it comes to)\b", "Weak transition"),
    (r"\b(in (my|this) (humble )?opinion)\b", "Unnecessary qualifier"),
    (r"\b(needless to say)\b", "Contradictory filler"),
    (r"\b(it goes without saying)\b", "Contradictory filler"),

    # Over-polished structures
    (r"\b(firstly|secondly|thirdly|lastly)\b", "Over-structured response"),
    (r"\b(in conclusion|to summarize|in summary)\b", "Essay-style conclusion"),
    (r"\b(let me (explain|elaborate|break this down))\b", "AI explanation pattern"),

    # Marketing/hype speak
    (r"\b(game[- ]?changer)\b", "Marketing hype"),
    (r"\b(revolutionary|transformative|paradigm[- ]?shift)\b", "Buzzword"),
    (r"\b(leverage|utilize|synergy|optimize)\b", "Corporate speak"),
    (r"\b(robust|scalable|seamless|cutting[- ]?edge)\b", "Tech marketing"),

    # Agreement patterns that get removed
    (r"^(this!?|exactly!?|same!?|\+1|agreed!?)\.?$", "Low-effort agreement"),
    (r"^\bi (totally |completely |absolutely )?(agree|concur)\b", "Generic agreement opener"),
    (r"\b(couldn'?t (agree|have said it) (more|better))\b", "Generic agreement"),
    (r"\b(this (resonates|hits different|is so true))\b", "AI enthusiasm pattern"),

    # Parallel structures (AI signature)
    (r"(\w+ed,? \w+ed,? (and )?\w+ed)", "Parallel past tense structure"),
    (r"(the \w+ (is|was) \w+, the \w+ (is|was) \w+)", "Parallel sentence structure"),
]

# Link patterns for self-promotion detection
SELF_PROMO_PATTERNS = [
    (r"(youtube\.com|youtu\.be)/", "YouTube link"),
    (r"(medium\.com|dev\.to|hashnode\.(com|dev))/", "Blog platform link"),
    (r"(github\.com)/[\w-]+/[\w-]+(?!/(issues|pull|discussions))", "GitHub repo link (not issue)"),
    (r"(twitter\.com|x\.com)/\w+/status", "Tweet link"),
    (r"(linkedin\.com/posts?/)", "LinkedIn post"),
    (r"(my (blog|website|channel|newsletter))", "Self-reference to content"),
    (r"(check out|visit|subscribe to) my", "Call to action for own content"),
    (r"(i (wrote|made|created|built) (a|this))", "Self-promotion phrase"),
]

# Technical evidence keywords for credibility
TECHNICAL_EVIDENCE_MARKERS = {
    "benchmarks": [
        r"\b(\d+\s*%)", r"\b(\d+\s*(ms|seconds?|minutes?|hours?))\b",
        r"\b(\d+x faster)\b", r"\b(reduced|improved|increased) by \d+",
        r"\b(\d+\s*(req|requests?|rps|qps)/s(ec)?)\b"
    ],
    "tradeoffs": [
        r"\b(tradeoff|trade-off)\b", r"\b(but|however|although|downside)\b",
        r"\b(pros? (and|&) cons?)\b", r"\b(the catch is)\b",
        r"\b(cost is|costs? more|cheaper but)\b",
        r"\b(curious (how|if|whether|about))\b",  # Shows critical thinking
        r"\b(wonder(ing)?s? (how|if|whether))\b",
    ],
    "specifics": [
        r"\b(we use|we used|i use|i used)\b",
        r"\b(at (my|our) (\w+ )?(company|team|job|work|org))\b",  # Allow words between
        r"\b((my|our) (previous|current|last|former) (company|team|job|employer))\b",
        r"\b(in production)\b", r"\b(after \d+ (months?|years?))\b",
        r"\b(version \d+)\b", r"\b(since 20\d\d)\b",
        r"\b(i('ve| have) (had to|been|worked))\b",  # Personal experience
        r"\b(we('d| had| would) often)\b",  # Team experience
        r"\b(in my experience)\b",
        r"\b(working on|worked on)\b",
    ],
    "patterns": [
        r"\b(pattern|architecture|design|pipeline|workflow|orchestration)\b",
        r"\b(microservice|monolith|distributed|async|parallel)\b",
        r"\b(caching|queue|pub[/-]?sub|messaging)\b",
        r"\b(rest|graphql|grpc|api)\b",
        r"\b(postgres|mysql|redis|mongo|dynamodb)\b",
        r"\b(aws|sqs|sns|lambda|step.?functions?|ecs|eks|s3)\b",  # AWS services
        r"\b(gcp|azure|kubernetes|k8s|docker)\b",  # Cloud/infra
        r"\b(ci[/-]?cd|terraform|ansible|jenkins)\b",  # DevOps
        r"\b(react|angular|vue|node|python|java|go|rust)\b",  # Languages/frameworks
        r"\b(error.?propagation|fault.?tolerance|retry|backoff)\b",  # Reliability patterns
    ]
}


@dataclass
class ShieldCheckResult:
    """Result of a shield check."""
    passed: bool
    score: int  # 0-100
    issues: List[Dict]
    warnings: List[Dict]
    suggestions: List[str]


def check_ai_tone(text: str) -> ShieldCheckResult:
    """
    Check for AI/bot-like phrases that trigger mod suspicion.
    Returns issues that should block posting.
    """
    issues = []
    warnings = []
    text_lower = text.lower()

    for pattern, description in AI_FLUFF_PATTERNS:
        matches = re.findall(pattern, text_lower, re.IGNORECASE)
        if matches:
            severity = "high" if "agreement" in description.lower() or "opener" in description.lower() else "medium"
            item = {
                "type": "ai_tone",
                "pattern": pattern,
                "description": description,
                "matches": matches[:3],  # Limit to 3 examples
                "severity": severity
            }
            if severity == "high":
                issues.append(item)
            else:
                warnings.append(item)

    # Calculate score (100 = clean, 0 = very bot-like)
    issue_penalty = len(issues) * 20
    warning_penalty = len(warnings) * 5
    score = max(0, 100 - issue_penalty - warning_penalty)

    suggestions = []
    if issues:
        suggestions.append("Remove or rephrase flagged phrases to avoid mod removal")
    if any("agreement" in i["description"].lower() for i in issues):
        suggestions.append("Add substance - explain WHY you agree with specific details")
    if any("opener" in i["description"].lower() for i in issues + warnings):
        suggestions.append("Start with your main point, not a generic opener")

    return ShieldCheckResult(
        passed=len(issues) == 0,
        score=score,
        issues=issues,
        warnings=warnings,
        suggestions=suggestions
    )


def check_self_promotion(text: str, subreddit: str = "") -> ShieldCheckResult:
    """
    Check for self-promotion patterns that violate Reddit's 10% rule.
    """
    issues = []
    warnings = []

    for pattern, description in SELF_PROMO_PATTERNS:
        matches = re.findall(pattern, text, re.IGNORECASE)
        if matches:
            # Links are higher severity in strict subreddits
            strict_subs = ["programming", "experienceddevs", "cscareerquestions"]
            severity = "high" if subreddit.lower() in strict_subs else "medium"

            item = {
                "type": "self_promotion",
                "pattern": pattern,
                "description": description,
                "matches": [str(m) if isinstance(m, tuple) else m for m in matches[:3]],
                "severity": severity
            }

            if "link" in description.lower():
                warnings.append(item)  # Links are warnings unless excessive
            else:
                issues.append(item)

    score = max(0, 100 - len(issues) * 25 - len(warnings) * 10)

    suggestions = []
    if issues or warnings:
        suggestions.append("Consider removing self-promotional content")
        suggestions.append("Most subreddits have a 10% self-promotion limit")
    if warnings:
        suggestions.append("If sharing a link, ensure you're adding substantial commentary")

    return ShieldCheckResult(
        passed=len(issues) == 0,
        score=score,
        issues=issues,
        warnings=warnings,
        suggestions=suggestions
    )


def check_technical_evidence(text: str, min_score: int = 40) -> ShieldCheckResult:
    """
    Check for technical evidence that adds credibility.
    Higher scores = more credible, senior-sounding content.
    """
    evidence_found = {}
    total_matches = 0

    for category, patterns in TECHNICAL_EVIDENCE_MARKERS.items():
        matches = []
        for pattern in patterns:
            found = re.findall(pattern, text, re.IGNORECASE)
            matches.extend(found)
        evidence_found[category] = matches
        total_matches += len(matches)

    # Calculate score based on evidence diversity and quantity
    categories_with_evidence = sum(1 for v in evidence_found.values() if v)

    # Score: 25 points per category with evidence, bonus for multiple matches
    base_score = categories_with_evidence * 25
    bonus = min(20, total_matches * 2)
    score = min(100, base_score + bonus)

    issues = []
    warnings = []
    suggestions = []

    if score < min_score:
        missing = [k for k, v in evidence_found.items() if not v]
        if "benchmarks" in missing:
            suggestions.append("Add specific numbers/metrics (e.g., '40% faster', '200ms latency')")
        if "tradeoffs" in missing:
            suggestions.append("Mention tradeoffs or downsides to show balanced thinking")
        if "specifics" in missing:
            suggestions.append("Reference your actual experience ('at my company', 'in production')")
        if "patterns" in missing:
            suggestions.append("Mention specific technologies or patterns")

        warnings.append({
            "type": "low_evidence",
            "description": f"Low technical evidence score ({score}/100)",
            "missing_categories": missing,
            "severity": "medium"
        })

    return ShieldCheckResult(
        passed=score >= min_score,
        score=score,
        issues=issues,
        warnings=warnings,
        suggestions=suggestions
    )


def preflight_check(text: str, subreddit: str = "", check_evidence: bool = True) -> Dict:
    """
    Run all pre-flight checks on content before posting.
    Returns combined results with pass/fail status.
    """
    results = {
        "ai_tone": check_ai_tone(text),
        "self_promotion": check_self_promotion(text, subreddit),
    }

    if check_evidence:
        results["technical_evidence"] = check_technical_evidence(text)

    # Overall pass/fail
    all_passed = all(r.passed for r in results.values())

    # Combine all issues and suggestions
    all_issues = []
    all_warnings = []
    all_suggestions = []

    for name, result in results.items():
        all_issues.extend(result.issues)
        all_warnings.extend(result.warnings)
        all_suggestions.extend(result.suggestions)

    # Calculate overall score
    scores = [r.score for r in results.values()]
    overall_score = sum(scores) // len(scores) if scores else 0

    # Determine if content should be blocked
    block_copy = len(all_issues) > 0 or overall_score < 30

    return {
        "passed": all_passed,
        "block_copy": block_copy,
        "overall_score": overall_score,
        "checks": {name: {
            "passed": r.passed,
            "score": r.score,
            "issues": r.issues,
            "warnings": r.warnings
        } for name, r in results.items()},
        "issues": all_issues,
        "warnings": all_warnings,
        "suggestions": list(set(all_suggestions)),  # Dedupe
        "summary": _generate_summary(all_passed, overall_score, all_issues, all_warnings)
    }


def _generate_summary(passed: bool, score: int, issues: List, warnings: List) -> str:
    """Generate a human-readable summary."""
    if passed and score >= 80:
        return "✓ Content looks good! Safe to post."
    elif passed and score >= 50:
        return "⚠ Content is acceptable but could be improved. Review warnings."
    elif not passed and issues:
        return f"✗ {len(issues)} issue(s) found that may cause removal. Fix before posting."
    else:
        return f"⚠ Low confidence score ({score}/100). Consider adding more substance."


# =============================================================================
# B. ACCOUNT INSURANCE
# =============================================================================

def analyze_history_for_cleanup(items: List[Dict], threshold_ups: int = 0) -> Dict:
    """
    Analyze comment/post history to find items that should be deleted.
    Returns items that might hurt your reputation.
    """
    risky_items = []

    for item in items:
        risks = []
        ups = item.get("ups", 0)
        content = item.get("content", "") or item.get("title", "")
        subreddit = item.get("subreddit", "")

        # Check 1: Very low performing
        if ups <= threshold_ups:
            risks.append({
                "type": "low_performance",
                "reason": f"Only {ups} upvotes - may indicate poor reception"
            })

        # Check 2: Contains AI patterns
        ai_check = check_ai_tone(content)
        if not ai_check.passed:
            risks.append({
                "type": "ai_patterns",
                "reason": "Contains patterns that mods flag as bot-like"
            })

        # Check 3: Very short (likely low-effort)
        if len(content) < 50:
            risks.append({
                "type": "too_short",
                "reason": "Very short content - often flagged as low-effort"
            })

        # Check 4: Controversial indicators
        # Note: We can't get downvote counts from public API, but low ups + lots of replies could indicate

        if risks:
            risky_items.append({
                "id": item.get("id", ""),
                "subreddit": subreddit,
                "content_preview": content[:100] + "..." if len(content) > 100 else content,
                "ups": ups,
                "risks": risks,
                "recommendation": "Consider deleting" if len(risks) >= 2 else "Review manually"
            })

    # Sort by risk level (more risks = higher priority)
    risky_items.sort(key=lambda x: -len(x["risks"]))

    return {
        "total_analyzed": len(items),
        "risky_count": len(risky_items),
        "risky_items": risky_items[:20],  # Top 20 most risky
        "cleanup_summary": f"Found {len(risky_items)} items that may need attention out of {len(items)} analyzed"
    }


def check_rate_limit_risk(recent_posts: List[Dict], window_minutes: int = 60) -> Dict:
    """
    Check if posting frequency might trigger rate limits or bot detection.
    """
    now = time.time()
    window_start = now - (window_minutes * 60)

    # Filter to posts within window
    recent = [p for p in recent_posts if p.get("created_utc", 0) > window_start]

    # Count by subreddit
    sub_counts = {}
    for p in recent:
        sub = p.get("subreddit", "unknown")
        sub_counts[sub] = sub_counts.get(sub, 0) + 1

    warnings = []

    # Check overall rate
    if len(recent) >= 10:
        warnings.append({
            "type": "high_frequency",
            "message": f"{len(recent)} posts in last {window_minutes} minutes - very high",
            "severity": "high"
        })
    elif len(recent) >= 5:
        warnings.append({
            "type": "moderate_frequency",
            "message": f"{len(recent)} posts in last {window_minutes} minutes - moderate",
            "severity": "medium"
        })

    # Check per-subreddit rate
    for sub, count in sub_counts.items():
        if count >= 5:
            warnings.append({
                "type": "sub_spam",
                "message": f"{count} posts to r/{sub} in last {window_minutes} minutes",
                "severity": "high"
            })

    safe_to_post = len([w for w in warnings if w["severity"] == "high"]) == 0

    # Calculate recommended wait time
    if not safe_to_post:
        wait_minutes = 30
    elif warnings:
        wait_minutes = 10
    else:
        wait_minutes = 0

    return {
        "safe_to_post": safe_to_post,
        "posts_in_window": len(recent),
        "posts_by_subreddit": sub_counts,
        "warnings": warnings,
        "recommended_wait_minutes": wait_minutes,
        "message": "Safe to post" if safe_to_post else f"Wait {wait_minutes} minutes before posting"
    }


# =============================================================================
# C. COMPETITOR GAP ANALYZER
# =============================================================================

def extract_subreddit_constraints(posts: List[Dict], removed_titles: List[str] = None) -> Dict:
    """
    Extract what a subreddit hates/removes based on post patterns.
    """
    constraints = {
        "link_types_removed": [],
        "topics_removed": [],
        "patterns_removed": [],
        "self_promo_strict": False
    }

    # Analyze removed titles if provided
    if removed_titles:
        for title in removed_titles:
            title_lower = title.lower()

            # Check for link types
            if "youtube" in title_lower or "[video]" in title_lower:
                constraints["link_types_removed"].append("YouTube videos")
            if "blog" in title_lower or "medium" in title_lower:
                constraints["link_types_removed"].append("Blog posts")
            if "my project" in title_lower or "i made" in title_lower:
                constraints["link_types_removed"].append("Self-promotion")
                constraints["self_promo_strict"] = True

            # Check for removed topics
            if "job" in title_lower or "hiring" in title_lower:
                constraints["topics_removed"].append("Job posts")
            if "beginner" in title_lower or "newbie" in title_lower:
                constraints["topics_removed"].append("Beginner questions")

    # Analyze successful posts for patterns
    if posts:
        high_performers = [p for p in posts if p.get("ups", 0) > 50]

        # What successful posts have in common
        has_numbers = sum(1 for p in high_performers if re.search(r'\d+', p.get("title", "")))
        has_question = sum(1 for p in high_performers if "?" in p.get("title", ""))

        patterns = []
        if has_numbers > len(high_performers) * 0.3:
            patterns.append("Successful posts often include specific numbers")
        if has_question > len(high_performers) * 0.3:
            patterns.append("Questions tend to perform well")

        constraints["success_patterns"] = patterns

    # Dedupe
    constraints["link_types_removed"] = list(set(constraints["link_types_removed"]))
    constraints["topics_removed"] = list(set(constraints["topics_removed"]))

    return constraints


def find_unanswered_opportunities(posts: List[Dict], min_ups: int = 10) -> List[Dict]:
    """
    Find highly upvoted questions that lack senior-level answers.
    These are opportunities for valuable contributions.
    """
    opportunities = []

    for post in posts:
        title = post.get("title", "")
        ups = post.get("ups", 0)
        num_comments = post.get("num_comments", 0)

        # Skip if not enough upvotes
        if ups < min_ups:
            continue

        # Check if it's a question
        is_question = "?" in title or any(
            title.lower().startswith(w) for w in
            ["how", "what", "why", "when", "where", "which", "should", "can", "is", "are", "do", "does"]
        )

        if not is_question:
            continue

        # Low comment count relative to upvotes = underserved
        engagement_ratio = num_comments / max(ups, 1)

        if engagement_ratio < 0.5:  # Less than 0.5 comments per upvote
            opportunity_score = ups * (1 - engagement_ratio)

            # Categorize the question type
            question_type = "general"
            title_lower = title.lower()

            if any(w in title_lower for w in ["architecture", "design", "scale", "system"]):
                question_type = "architecture"
            elif any(w in title_lower for w in ["best practice", "recommend", "should i"]):
                question_type = "advice"
            elif any(w in title_lower for w in ["debug", "error", "issue", "problem", "fix"]):
                question_type = "troubleshooting"
            elif any(w in title_lower for w in ["compare", "vs", "versus", "difference"]):
                question_type = "comparison"

            opportunities.append({
                "title": title,
                "subreddit": post.get("subreddit", ""),
                "ups": ups,
                "num_comments": num_comments,
                "engagement_ratio": round(engagement_ratio, 2),
                "opportunity_score": round(opportunity_score, 1),
                "question_type": question_type,
                "permalink": post.get("permalink", ""),
                "why_opportunity": f"High interest ({ups} ups) but underserved ({num_comments} comments)"
            })

    # Sort by opportunity score
    opportunities.sort(key=lambda x: -x["opportunity_score"])

    return opportunities[:10]  # Top 10 opportunities


# =============================================================================
# MAIN EXPORT FUNCTIONS
# =============================================================================

def full_shield_check(
    text: str,
    subreddit: str = "",
    content_type: str = "comment",
    history: List[Dict] = None
) -> Dict:
    """
    Run complete shield analysis on content.
    This is the main function to call before posting.

    Args:
        text: The content to check
        subreddit: Target subreddit
        content_type: "post" or "comment"
        history: User's posting history for context
    """
    preflight = preflight_check(text, subreddit)

    result = {
        "status": "pass" if preflight["passed"] else "fail",
        "can_post": preflight["passed"],
        "block_copy": preflight["block_copy"],
        "overall_score": preflight["overall_score"],
        "summary": preflight["summary"],
        "checks": preflight["checks"],
        "issues": preflight["issues"],
        "warnings": preflight["warnings"],
        "suggestions": preflight["suggestions"],
        "content_type": content_type
    }

    # Add history-based insights if available
    if history:
        # Check if user has posted to this subreddit before
        sub_history = [h for h in history if h.get("subreddit", "").lower() == subreddit.lower()]
        if sub_history:
            avg_ups = sum(h.get("ups", 0) for h in sub_history) / len(sub_history)
            result["subreddit_history"] = {
                "posts_in_subreddit": len(sub_history),
                "average_ups": round(avg_ups, 1),
                "familiar": len(sub_history) >= 3
            }

    return result
