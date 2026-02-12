"""
Prompt Management for RedBuddy (Open Source)

This file contains TEMPLATE prompts that you can customize for better results.
The templates work out of the box, but you'll get better results by:
1. Adding your own examples
2. Tuning for your specific subreddits
3. Adding your persona context

Customize prompts via:
- Environment variables: REDBUDDY_PROMPT_SUGGEST, etc.
- Files in /prompts/ directory: suggest.txt, etc.

See /prompts/README.md for detailed customization guide.
"""

import os
from pathlib import Path

# Base directory for prompt files
PROMPTS_DIR = Path(__file__).parent.parent / "prompts"


def load_prompt_file(filename: str) -> str:
    """Load a prompt from the prompts directory."""
    filepath = PROMPTS_DIR / filename
    if filepath.exists():
        return filepath.read_text().strip()
    return ""


# =============================================================================
# Template Prompts (Open Source)
# These are starting templates - customize them for better results!
# =============================================================================

TEMPLATE_SUGGEST_PROMPT = """You are helping write a Reddit comment.

Subreddit: r/{subreddit}
Post content: {post_text}

User context (if available):
{patterns}

Generate 3 different comment approaches:
1. Personal experience - Share a relevant story or opinion
2. Helpful response - Provide useful information or advice
3. Engaging question - Ask something that adds to the discussion

Requirements:
- Sound like a real person, not AI
- Be specific to the post topic
- Match the subreddit's tone
- Keep each comment 2-4 sentences

Return as JSON:
{{
  "comments": [
    {{"style": "personal", "text": "your comment", "confidence": 0.8}},
    {{"style": "helpful", "text": "your comment", "confidence": 0.7}},
    {{"style": "question", "text": "your comment", "confidence": 0.6}}
  ]
}}

TIP: Customize this prompt with examples of YOUR successful comments for better results."""

TEMPLATE_VALIDATE_PROMPT = """Review this Reddit draft for potential issues.

Draft: {draft}
Target subreddit: r/{subreddit}
Post being replied to: {original_post}

Check for:
1. AI-sounding phrases (overly formal, generic openers)
2. Self-promotion (links, "check out my...")
3. Low effort (too short, no substance)
4. Tone mismatch with subreddit culture

Provide feedback:
{{
  "score": 0-100,
  "issues": ["list of problems found"],
  "suggestions": ["how to improve"],
  "revised": "improved version if score < 70"
}}

TIP: Add your subreddit-specific rules to improve validation accuracy."""

TEMPLATE_SHIELD_PROMPT = """Pre-flight safety check for Reddit content.

Content: {text}
Subreddit: r/{subreddit}
Type: {content_type}

Scan for risks:
1. Patterns that trigger spam filters
2. AI-detection red flags
3. Self-promotion violations
4. Community rule violations
5. Low-effort content markers

Return assessment:
{{
  "safe": true/false,
  "risk_level": "low/medium/high",
  "issues": [
    {{"type": "issue_type", "detail": "explanation", "fix": "how to fix"}}
  ],
  "recommendation": "post as-is / revise first / do not post"
}}

TIP: Add patterns from your past removed content to improve detection."""

TEMPLATE_ANALYZE_PROMPT = """Analyze top posts from r/{subreddit}.

Data:
{posts_data}

Identify patterns:
1. What topics get most engagement?
2. What tone/style works best?
3. Common elements in successful posts
4. What to avoid

Provide actionable insights for someone wanting to engage in this subreddit.

Format with clear sections and specific examples from the data."""

TEMPLATE_REFINE_PROMPT = """Improve this Reddit comment based on feedback.

Original: {comment}
Feedback: {feedback}
Type of change needed: {feedback_type}
Subreddit: r/{subreddit}

Revise the comment to address the feedback while:
- Keeping the core message
- Sounding natural and authentic
- Matching subreddit expectations

Return the improved version with a brief note on what changed."""


# =============================================================================
# Prompt Loader
# =============================================================================

# Map prompt types to their templates
PROMPT_TEMPLATES = {
    "SUGGEST": TEMPLATE_SUGGEST_PROMPT,
    "VALIDATE": TEMPLATE_VALIDATE_PROMPT,
    "SHIELD": TEMPLATE_SHIELD_PROMPT,
    "ANALYZE": TEMPLATE_ANALYZE_PROMPT,
    "REFINE": TEMPLATE_REFINE_PROMPT,
}


def get_prompt(prompt_type: str, **kwargs) -> str:
    """
    Get a prompt by type, with variable substitution.

    Priority:
    1. Environment variable (REDBUDDY_PROMPT_{TYPE})
    2. Custom file in /prompts/ directory ({type}.txt)
    3. Example file in /prompts/ directory ({type}.example.txt)
    4. Template prompt (built-in)

    Args:
        prompt_type: One of 'suggest', 'validate', 'shield', 'analyze', 'refine'
        **kwargs: Variables to substitute in the prompt

    Returns:
        Formatted prompt string
    """
    prompt_type_upper = prompt_type.upper()

    # 1. Check environment variable (highest priority - your custom prompts)
    env_key = f"REDBUDDY_PROMPT_{prompt_type_upper}"
    prompt = os.getenv(env_key, "")

    # 2. Check prompts directory (user customization)
    if not prompt:
        prompt = load_prompt_file(f"{prompt_type.lower()}.txt")

    # 3. Check example file (ships with repo, works out of box)
    if not prompt:
        prompt = load_prompt_file(f"{prompt_type.lower()}.example.txt")

    # 4. Fall back to template
    if not prompt:
        prompt = PROMPT_TEMPLATES.get(prompt_type_upper, "")

    # Substitute variables
    if prompt and kwargs:
        try:
            # Handle missing keys gracefully
            for key, value in kwargs.items():
                prompt = prompt.replace(f"{{{key}}}", str(value) if value else "")
        except Exception:
            pass

    return prompt


def list_available_prompts() -> dict:
    """List all prompts and their sources."""
    prompt_types = ["suggest", "validate", "shield", "analyze", "refine"]
    result = {}

    for pt in prompt_types:
        env_key = f"REDBUDDY_PROMPT_{pt.upper()}"

        if os.getenv(env_key):
            source = "environment (custom)"
        elif (PROMPTS_DIR / f"{pt}.txt").exists():
            source = "file (custom)"
        elif (PROMPTS_DIR / f"{pt}.example.txt").exists():
            source = "example (default)"
        else:
            source = "template (built-in)"

        result[pt] = source

    return result


def get_customization_tips() -> dict:
    """Return tips for customizing prompts."""
    return {
        "suggest": [
            "Add examples of YOUR successful comments",
            "Include your persona/expertise for authenticity",
            "Add subreddit-specific context you know works",
        ],
        "validate": [
            "Add rules specific to subreddits you frequent",
            "Include patterns that got you downvoted before",
            "Add your writing style preferences",
        ],
        "shield": [
            "Add patterns from content that was removed",
            "Include AutoMod triggers you've discovered",
            "Add self-promotion rules for your target subs",
        ],
        "analyze": [
            "Focus on metrics that matter to you",
            "Add comparison with your own performance",
            "Include engagement patterns you want to replicate",
        ],
        "refine": [
            "Add examples of good vs bad revisions",
            "Include your voice/tone preferences",
            "Add context about your expertise level",
        ],
    }
