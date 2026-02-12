"""
Claude AI Service - Handles both API and CLI modes

Priority: API Key > CLI
Set ANTHROPIC_API_KEY in .env to use the API
Otherwise falls back to Claude CLI (requires Claude Code installed)
"""

import os
import subprocess
from typing import Optional

from app.config import settings

# Initialize Anthropic client if API key is available
anthropic_client = None

if settings.ANTHROPIC_API_KEY:
    try:
        from anthropic import Anthropic
        anthropic_client = Anthropic(api_key=settings.ANTHROPIC_API_KEY)
        print(f"✓ Anthropic API initialized (model: {settings.CLAUDE_MODEL})")
    except ImportError:
        print("⚠ anthropic package not installed. Run: pip install anthropic")
        print("  Falling back to Claude CLI mode")
    except Exception as e:
        print(f"⚠ Failed to initialize Anthropic client: {e}")
        print("  Falling back to Claude CLI mode")
else:
    print("ℹ No ANTHROPIC_API_KEY found. Using Claude CLI mode.")
    print("  For API mode, set ANTHROPIC_API_KEY in .env file")


def get_ai_status() -> dict:
    """Get current AI configuration status."""
    if anthropic_client:
        return {
            "mode": "api",
            "status": "configured",
            "model": settings.CLAUDE_MODEL,
            "message": "Using Anthropic API - recommended for production",
        }
    else:
        return {
            "mode": "cli",
            "status": "fallback",
            "model": "claude-cli",
            "message": "Using Claude CLI - for personal/development use",
            "setup_instructions": {
                "step1": "Get API key from https://console.anthropic.com",
                "step2": "Create .env file in project root",
                "step3": "Add: ANTHROPIC_API_KEY=your_key_here",
                "step4": "Restart the API server",
            },
        }


def call_claude_api(prompt: str, max_tokens: int = 4096) -> str:
    """Call Claude via Anthropic API."""
    if not anthropic_client:
        return "Error: Anthropic API not configured"

    try:
        message = anthropic_client.messages.create(
            model=settings.CLAUDE_MODEL,
            max_tokens=max_tokens,
            messages=[{"role": "user", "content": prompt}]
        )
        return message.content[0].text
    except Exception as e:
        return f"Error (API): {str(e)}"


def call_claude_cli(prompt: str, timeout: int = 120) -> str:
    """Call Claude via Claude Code CLI (subprocess)."""
    try:
        result = subprocess.run(
            ["claude", "-p", prompt],
            capture_output=True,
            text=True,
            timeout=timeout,
            cwd=settings.BASE_DIR,
        )
        if result.returncode != 0:
            return f"Error: {result.stderr}"
        return result.stdout.strip()
    except subprocess.TimeoutExpired:
        return "Error: Claude CLI timed out"
    except FileNotFoundError:
        return "Error: Claude CLI not found. Install with: npm install -g @anthropic-ai/claude-code"
    except Exception as e:
        return f"Error (CLI): {str(e)}"


def call_claude(prompt: str, timeout: int = 120, max_tokens: int = 4096) -> str:
    """
    Unified Claude call - uses API if available, falls back to CLI.

    For open source users: Set ANTHROPIC_API_KEY environment variable
    For personal use: Install Claude Code CLI

    Args:
        prompt: The prompt to send to Claude
        timeout: Timeout for CLI mode (seconds)
        max_tokens: Max tokens for API mode

    Returns:
        Claude's response as a string
    """
    if anthropic_client:
        return call_claude_api(prompt, max_tokens)
    else:
        return call_claude_cli(prompt, timeout)
