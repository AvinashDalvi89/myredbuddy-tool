"""
Configuration and Settings for MyRedBuddy API

AI Mode Configuration:
- Set ANTHROPIC_API_KEY env var to use the official Anthropic API (recommended)
- Without API key, falls back to Claude CLI (for personal use)
"""

import os
from typing import Optional

# Load environment variables
try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass


class Settings:
    """Application settings loaded from environment variables."""

    # Paths
    BASE_DIR: str = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    PROFILES_DIR: str = os.path.join(BASE_DIR, "profiles")
    PROFILE_INDEX_FILE: str = os.path.join(PROFILES_DIR, "index.json")
    DASHBOARD_PUBLIC_DIR: str = os.path.join(BASE_DIR, "dashboard", "public")

    # AI Configuration
    ANTHROPIC_API_KEY: str = os.getenv("ANTHROPIC_API_KEY", "")
    CLAUDE_MODEL: str = os.getenv("CLAUDE_MODEL", "claude-sonnet-4-20250514")

    # Reddit API
    USER_AGENT: str = "MyRedBuddy/1.0 (Open Source - github.com/AvinashDalvi89/myredbuddy-tool)"

    # API Settings
    API_VERSION: str = "1.0.0"
    API_TITLE: str = "MyRedBuddy API"
    API_DESCRIPTION: str = "Open source tool to analyze your Reddit engagement and get AI suggestions"

    # CORS Origins
    CORS_ORIGINS: list = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "*"
    ]

    def __init__(self):
        """Ensure required directories exist."""
        os.makedirs(self.PROFILES_DIR, exist_ok=True)


# Global settings instance
settings = Settings()


def get_ai_mode() -> str:
    """Return current AI mode: 'api' or 'cli'"""
    from app.services.claude import anthropic_client
    return "api" if anthropic_client else "cli"


def get_ai_model() -> str:
    """Return current AI model name."""
    from app.services.claude import anthropic_client
    return settings.CLAUDE_MODEL if anthropic_client else "claude-cli"
