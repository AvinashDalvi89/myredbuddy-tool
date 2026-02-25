"""
Pydantic Models for Request/Response Schemas
"""

from pydantic import BaseModel
from typing import Optional, List, Dict, Any


# =============================================================================
# Import Models
# =============================================================================

class OnboardingCheckRequest(BaseModel):
    username: str


class ImportUsernameRequest(BaseModel):
    username: str
    posts_limit: Optional[int] = 50
    comments_limit: Optional[int] = 100


class ImportPasteRequest(BaseModel):
    posts: Optional[List[dict]] = []
    comments: Optional[List[dict]] = []


# =============================================================================
# Profile Models
# =============================================================================

class ProfileCreateRequest(BaseModel):
    username: str
    confirm_own_account: bool = False


class ProfileSwitchRequest(BaseModel):
    username: str


# =============================================================================
# Persona Models
# =============================================================================

class PersonaRequest(BaseModel):
    name: str
    experience_years: int
    current_role: str
    expertise: List[str]
    domains: List[str]
    real_experiences: List[str]
    goal: Optional[str] = ""


# =============================================================================
# AI/Analysis Models
# =============================================================================

class AnalyzeRequest(BaseModel):
    subreddit: str
    limit: Optional[int] = 50


class ValidateRequest(BaseModel):
    draft: str
    subreddit: str
    original_post: Optional[str] = None


class SuggestRequest(BaseModel):
    post_text: str
    subreddit: str


class RefineRequest(BaseModel):
    comment: str
    feedback: str
    feedback_type: Optional[str] = "custom"
    subreddit: Optional[str] = ""


# =============================================================================
# Shield Models
# =============================================================================

class ShieldCheckRequest(BaseModel):
    text: str
    subreddit: str
    content_type: Optional[str] = "comment"


class OpportunityRequest(BaseModel):
    subreddit: str
    limit: Optional[int] = 25


# =============================================================================
# Insights Models
# =============================================================================

class RemovalLogRequest(BaseModel):
    subreddit: str
    content: str
    content_type: Optional[str] = "comment"
    reason: Optional[str] = ""
    removal_type: Optional[str] = "mod"
    topics: Optional[List[str]] = []
    tones: Optional[List[str]] = []


# =============================================================================
# Rules Models
# =============================================================================

class SubredditRulesRequest(BaseModel):
    subreddit: str
    rules: Dict[str, Any]


# =============================================================================
# Response Models (Optional - for documentation)
# =============================================================================

class HealthResponse(BaseModel):
    status: str
    version: str
    ai_mode: str
    ai_model: str


class StatusResponse(BaseModel):
    has_data: bool
    has_persona: bool
    has_framework: bool
    data_stats: Dict[str, int]
    active_profile: Optional[str]
    total_profiles: int
    data_location: str
    ai_mode: str
    ai_model: str
