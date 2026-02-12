#!/usr/bin/env python3
"""
RedBuddy API - Entry Point

A modular FastAPI application for Reddit engagement analysis.

Usage:
    python api.py                    # Run with uvicorn
    uvicorn app.main:app --reload    # Alternative

Project Structure:
    app/
    ├── main.py          # FastAPI app setup
    ├── config.py        # Settings and configuration
    ├── models.py        # Pydantic request/response models
    ├── routers/         # API endpoint handlers
    │   ├── health.py    # Health and status endpoints
    │   ├── profiles.py  # Profile management
    │   ├── imports.py   # Data import endpoints
    │   ├── ai.py        # AI-powered analysis
    │   ├── insights.py  # Removal tracking
    │   └── shield.py    # Reputation protection
    └── services/        # Business logic layer
        ├── claude.py    # AI integration (API + CLI)
        ├── reddit.py    # Reddit data fetching
        ├── storage.py   # File/profile management
        └── analysis.py  # Data analysis helpers

AI Configuration:
    - Set ANTHROPIC_API_KEY in .env for API mode (recommended)
    - Without API key, falls back to Claude CLI mode
"""

import uvicorn

# Import the FastAPI app from the app package
from app.main import app

if __name__ == "__main__":
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
    )
