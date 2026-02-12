"""
Agent Skills Router - Wraps RedBuddy capabilities for AI agent consumption

This module exposes RedBuddy features as agent-friendly skills that can be
discovered and invoked by AI agents (Claude, ChatGPT, LangChain, etc.)
"""

from fastapi import APIRouter, HTTPException
from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field

from app.services.storage import get_active_profile, load_json_file
from app.config import settings

# Note: Agent skills will call existing endpoints via HTTP or extract business logic
# This is a proof-of-concept structure that can be expanded

router = APIRouter(prefix="/api/agent", tags=["Agent Skills"])


# =============================================================================
# Skill Schemas (for agent discovery)
# =============================================================================

class SkillParameter(BaseModel):
    """Parameter definition for an agent skill"""
    name: str
    type: str
    description: str
    required: bool = False
    default: Any = None


class AgentSkill(BaseModel):
    """Definition of an agent skill"""
    name: str
    description: str
    parameters: List[SkillParameter]
    returns: Dict[str, str]  # Description of return values
    examples: List[str] = []


# =============================================================================
# Skill Discovery Endpoint
# =============================================================================

@router.get("/skills", response_model=List[AgentSkill])
def list_available_skills():
    """
    Returns a list of all available agent skills.
    Agents can call this to discover what capabilities are available.
    """
    return [
        AgentSkill(
            name="analyze_subreddit",
            description="Analyzes a subreddit to identify successful content patterns, top-performing tones, and topics",
            parameters=[
                SkillParameter(
                    name="subreddit",
                    type="string",
                    description="The subreddit to analyze (e.g., 'programming' or 'ExperiencedDevs')",
                    required=True
                ),
                SkillParameter(
                    name="limit",
                    type="integer",
                    description="Number of posts to analyze (default: 50)",
                    required=False,
                    default=50
                )
            ],
            returns={
                "top_tones": "Array of tone statistics with average upvotes",
                "top_topics": "Array of topic statistics with average upvotes",
                "recommendations": "Actionable insights for engaging in this subreddit"
            },
            examples=[
                "Analyze what works in r/programming",
                "What topics get the most upvotes in r/ExperiencedDevs?",
                "Show me the tone patterns in successful posts in r/aws"
            ]
        ),
        AgentSkill(
            name="suggest_comment",
            description="Generates a Reddit comment suggestion based on post context, subreddit rules, and user persona",
            parameters=[
                SkillParameter(
                    name="post_text",
                    type="string",
                    description="The text of the Reddit post to respond to",
                    required=True
                ),
                SkillParameter(
                    name="subreddit",
                    type="string",
                    description="The subreddit where the post is located",
                    required=True
                ),
                SkillParameter(
                    name="tone",
                    type="string",
                    description="Desired tone: 'professional', 'casual', 'helpful', or 'match_subreddit'",
                    required=False,
                    default="match_subreddit"
                )
            ],
            returns={
                "comment": "The suggested comment text",
                "reasoning": "Explanation of why this comment works for this subreddit",
                "confidence": "Confidence score (0-100)"
            },
            examples=[
                "Write a comment for this post in r/programming",
                "Suggest a response that matches my experience level",
                "Help me reply to this question about AWS"
            ]
        ),
        AgentSkill(
            name="validate_content",
            description="Validates Reddit content against subreddit rules and best practices before posting",
            parameters=[
                SkillParameter(
                    name="draft",
                    type="string",
                    description="The content to validate (comment or post text)",
                    required=True
                ),
                SkillParameter(
                    name="subreddit",
                    type="string",
                    description="The target subreddit",
                    required=True
                ),
                SkillParameter(
                    name="content_type",
                    type="string",
                    description="Type of content: 'comment' or 'post'",
                    required=False,
                    default="comment"
                )
            ],
            returns={
                "is_valid": "Whether the content passes validation",
                "issues": "Array of validation issues found",
                "suggestions": "Array of improvement suggestions",
                "risk_score": "Risk score from 0-100"
            },
            examples=[
                "Check if my comment follows r/programming rules",
                "Will this post get removed?",
                "Validate my draft against subreddit guidelines"
            ]
        ),
        AgentSkill(
            name="shield_check",
            description="Pre-flight check for content that might damage Reddit reputation based on removal history",
            parameters=[
                SkillParameter(
                    name="content",
                    type="string",
                    description="The content to check",
                    required=True
                ),
                SkillParameter(
                    name="subreddit",
                    type="string",
                    description="The target subreddit",
                    required=True
                )
            ],
            returns={
                "risk_level": "Risk level: 'low', 'medium', or 'high'",
                "warnings": "Array of specific risk warnings",
                "recommendations": "Array of safety recommendations",
                "historical_patterns": "Insights from past removal history"
            },
            examples=[
                "Check if this comment might hurt my reputation",
                "What should I avoid posting in r/programming?",
                "Is this content risky based on my history?"
            ]
        )
    ]


# =============================================================================
# Skill Execution Endpoints (Agent-Friendly Format)
# =============================================================================

class AnalyzeSubredditRequest(BaseModel):
    subreddit: str = Field(..., description="The subreddit to analyze")
    limit: int = Field(50, description="Number of posts to analyze")


class AnalyzeSubredditResponse(BaseModel):
    subreddit: str
    top_tones: List[Dict[str, Any]]
    top_topics: List[Dict[str, Any]]
    recommendations: List[str]
    analysis_summary: str


@router.post("/skills/analyze_subreddit", response_model=AnalyzeSubredditResponse)
def execute_analyze_subreddit(req: AnalyzeSubredditRequest):
    """
    Execute the analyze_subreddit skill.
    Returns agent-friendly structured response.
    
    Note: This is a proof-of-concept. In production, this would call
    the existing /api/analyze endpoint or extract its business logic.
    """
    from app.models import AnalyzeRequest
    from app.routers.ai import router as ai_router
    
    # For POC: Make internal call to existing endpoint
    # In production, extract business logic to services layer
    import httpx
    
    try:
        # Call the existing analyze endpoint
        response = httpx.post(
            "http://localhost:8000/api/analyze",
            json={"subreddit": req.subreddit, "limit": req.limit},
            timeout=30.0
        )
        response.raise_for_status()
        result = response.json()
    except Exception as e:
        # Fallback: Return structure indicating skill is available but needs implementation
        raise HTTPException(
            status_code=501,
            detail=f"Agent skill endpoint needs implementation. Original endpoint: /api/analyze. Error: {str(e)}"
        )
    
    # Format for agent consumption
    top_tones = sorted(
        result["tone_stats"].items(),
        key=lambda x: x[1]["avg"],
        reverse=True
    )[:5]
    
    top_topics = sorted(
        result["topic_stats"].items(),
        key=lambda x: x[1]["avg"],
        reverse=True
    )[:5]
    
    # Generate recommendations
    recommendations = []
    if top_tones:
        best_tone = top_tones[0][0]
        recommendations.append(f"Use a {best_tone} tone for best engagement")
    
    if top_topics:
        best_topic = top_topics[0][0]
        recommendations.append(f"Focus on {best_topic} topics for higher upvotes")
    
    if result.get("analysis"):
        recommendations.append(result["analysis"])
    
    return AnalyzeSubredditResponse(
        subreddit=req.subreddit,
        top_tones=[{"tone": t[0], **t[1]} for t in top_tones],
        top_topics=[{"topic": t[0], **t[1]} for t in top_topics],
        recommendations=recommendations,
        analysis_summary=result.get("analysis", "Analysis complete")
    )


class SuggestCommentRequest(BaseModel):
    post_text: str = Field(..., description="The Reddit post text to respond to")
    subreddit: str = Field(..., description="The subreddit name")
    tone: Optional[str] = Field("match_subreddit", description="Desired tone")


class SuggestCommentResponse(BaseModel):
    comment: str
    reasoning: str
    confidence: int = Field(..., ge=0, le=100)
    tone_used: str
    subreddit_rules_applied: List[str]


@router.post("/skills/suggest_comment", response_model=SuggestCommentResponse)
def execute_suggest_comment(req: SuggestCommentRequest):
    """
    Execute the suggest_comment skill.
    Returns agent-friendly structured response with explanations.
    
    Note: This is a proof-of-concept. In production, this would call
    the existing /api/suggest endpoint or extract its business logic.
    """
    import httpx
    
    try:
        response = httpx.post(
            "http://localhost:8000/api/suggest",
            json={"post_text": req.post_text, "subreddit": req.subreddit},
            timeout=30.0
        )
        response.raise_for_status()
        result = response.json()
    except Exception as e:
        raise HTTPException(
            status_code=501,
            detail=f"Agent skill endpoint needs implementation. Original endpoint: /api/suggest. Error: {str(e)}"
        )
    
    # Extract reasoning and confidence from response
    comment_text = result.get("suggestion", result.get("comment", ""))
    reasoning = result.get("reasoning", "Generated based on subreddit rules and user persona")
    
    # Estimate confidence based on response quality
    confidence = 75  # Default
    if "high quality" in reasoning.lower() or "excellent" in reasoning.lower():
        confidence = 90
    elif "may need" in reasoning.lower() or "consider" in reasoning.lower():
        confidence = 60
    
    return SuggestCommentResponse(
        comment=comment_text,
        reasoning=reasoning,
        confidence=confidence,
        tone_used=req.tone or "match_subreddit",
        subreddit_rules_applied=result.get("rules_applied", [])
    )


class ValidateContentRequest(BaseModel):
    draft: str = Field(..., description="The content to validate")
    subreddit: str = Field(..., description="The target subreddit")
    content_type: str = Field("comment", description="Type: 'comment' or 'post'")


class ValidateContentResponse(BaseModel):
    is_valid: bool
    issues: List[str]
    suggestions: List[str]
    risk_score: int = Field(..., ge=0, le=100)
    validation_summary: str


@router.post("/skills/validate_content", response_model=ValidateContentResponse)
def execute_validate_content(req: ValidateContentRequest):
    """
    Execute the validate_content skill.
    Returns agent-friendly structured response with actionable feedback.
    
    Note: This is a proof-of-concept. In production, this would call
    the existing /api/validate endpoint or extract its business logic.
    """
    import httpx
    
    try:
        response = httpx.post(
            "http://localhost:8000/api/validate",
            json={"draft": req.draft, "subreddit": req.subreddit, "original_post": ""},
            timeout=30.0
        )
        response.raise_for_status()
        result = response.json()
    except Exception as e:
        raise HTTPException(
            status_code=501,
            detail=f"Agent skill endpoint needs implementation. Original endpoint: /api/validate. Error: {str(e)}"
        )
    
    # Extract issues and suggestions
    issues = result.get("issues", [])
    suggestions = result.get("suggestions", [])
    is_valid = len(issues) == 0
    
    # Calculate risk score
    risk_score = 0
    if "rule violation" in str(result).lower():
        risk_score += 30
    if "tone mismatch" in str(result).lower():
        risk_score += 20
    if "too long" in str(result).lower() or "too short" in str(result).lower():
        risk_score += 10
    
    summary = "Content is valid and ready to post" if is_valid else "Content needs revision before posting"
    
    return ValidateContentResponse(
        is_valid=is_valid,
        issues=issues,
        suggestions=suggestions,
        risk_score=min(risk_score, 100),
        validation_summary=summary
    )


class ShieldCheckRequest(BaseModel):
    content: str = Field(..., description="The content to check")
    subreddit: str = Field(..., description="The target subreddit")


class ShieldCheckResponse(BaseModel):
    risk_level: str  # 'low', 'medium', 'high'
    warnings: List[str]
    recommendations: List[str]
    historical_patterns: Dict[str, Any]


@router.post("/skills/shield_check", response_model=ShieldCheckResponse)
def execute_shield_check(req: ShieldCheckRequest):
    """
    Execute the shield_check skill.
    Returns agent-friendly structured response with risk assessment.
    
    Note: This is a proof-of-concept. In production, this would call
    the existing /api/shield/check endpoint or extract its business logic.
    """
    import httpx
    
    try:
        response = httpx.post(
            "http://localhost:8000/api/shield/check",
            json={"content": req.content, "subreddit": req.subreddit},
            timeout=30.0
        )
        response.raise_for_status()
        result = response.json()
    except Exception as e:
        raise HTTPException(
            status_code=501,
            detail=f"Agent skill endpoint needs implementation. Original endpoint: /api/shield/check. Error: {str(e)}"
        )
    
    # Determine risk level
    risk_score = result.get("risk_score", 0)
    if risk_score < 30:
        risk_level = "low"
    elif risk_score < 70:
        risk_level = "medium"
    else:
        risk_level = "high"
    
    warnings = result.get("warnings", [])
    recommendations = result.get("recommendations", [])
    patterns = result.get("patterns", {})
    
    return ShieldCheckResponse(
        risk_level=risk_level,
        warnings=warnings,
        recommendations=recommendations,
        historical_patterns=patterns
    )


# =============================================================================
# Agent Integration Helpers
# =============================================================================

@router.get("/skills/openai-format")
def get_openai_function_format():
    """
    Returns skills in OpenAI function calling format.
    Agents can use this directly with OpenAI's function calling API.
    """
    skills = [
        {
            "type": "function",
            "function": {
                "name": "analyze_subreddit",
                "description": "Analyzes a subreddit to identify successful content patterns",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "subreddit": {
                            "type": "string",
                            "description": "The subreddit to analyze (e.g., 'programming')"
                        },
                        "limit": {
                            "type": "integer",
                            "description": "Number of posts to analyze",
                            "default": 50
                        }
                    },
                    "required": ["subreddit"]
                }
            }
        },
        {
            "type": "function",
            "function": {
                "name": "suggest_comment",
                "description": "Generates a Reddit comment suggestion based on post context and user persona",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "post_text": {
                            "type": "string",
                            "description": "The text of the Reddit post to respond to"
                        },
                        "subreddit": {
                            "type": "string",
                            "description": "The subreddit where the post is located"
                        },
                        "tone": {
                            "type": "string",
                            "description": "Desired tone: 'professional', 'casual', 'helpful'",
                            "enum": ["professional", "casual", "helpful", "match_subreddit"]
                        }
                    },
                    "required": ["post_text", "subreddit"]
                }
            }
        },
        {
            "type": "function",
            "function": {
                "name": "validate_content",
                "description": "Validates Reddit content against subreddit rules before posting",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "draft": {
                            "type": "string",
                            "description": "The content to validate"
                        },
                        "subreddit": {
                            "type": "string",
                            "description": "The target subreddit"
                        },
                        "content_type": {
                            "type": "string",
                            "description": "Type of content: 'comment' or 'post'",
                            "enum": ["comment", "post"]
                        }
                    },
                    "required": ["draft", "subreddit"]
                }
            }
        },
        {
            "type": "function",
            "function": {
                "name": "shield_check",
                "description": "Pre-flight check for content that might damage Reddit reputation",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "content": {
                            "type": "string",
                            "description": "The content to check"
                        },
                        "subreddit": {
                            "type": "string",
                            "description": "The target subreddit"
                        }
                    },
                    "required": ["content", "subreddit"]
                }
            }
        }
    ]
    
    return {"tools": skills}
