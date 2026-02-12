#!/usr/bin/env python3
"""
RedBuddy Setup Wizard
Helps you get started with RedBuddy
"""

import os
import json
import subprocess
import sys

DATA_DIR = os.path.dirname(os.path.abspath(__file__))

def print_banner():
    print("\n" + "="*50)
    print("  RedBuddy - Setup Wizard")
    print("="*50 + "\n")

def check_dependencies():
    """Check if required packages are installed."""
    print("[1/5] Checking dependencies...")

    missing = []
    for pkg in ["fastapi", "uvicorn", "dotenv"]:
        try:
            __import__(pkg if pkg != "dotenv" else "dotenv")
        except ImportError:
            missing.append(pkg if pkg != "dotenv" else "python-dotenv")

    if missing:
        print(f"  Missing: {', '.join(missing)}")
        install = input("  Install now? (y/n): ").strip().lower()
        if install == 'y':
            subprocess.run([sys.executable, "-m", "pip", "install"] + missing)
            print("  Installed!")
        else:
            print("  Run: pip install -r requirements.txt")
            return False
    else:
        print("  All dependencies installed!")
    return True

def check_claude_cli():
    """Check if Claude CLI is available."""
    print("\n[2/5] Checking Claude CLI...")

    try:
        result = subprocess.run(["claude", "--version"], capture_output=True, text=True)
        if result.returncode == 0:
            print("  Claude CLI found!")
            return True
    except FileNotFoundError:
        pass

    print("  Claude CLI not found.")
    print("  Install with: npm install -g @anthropic-ai/claude-code")
    return False

def setup_env():
    """Create or check .env file."""
    print("\n[3/5] Setting up environment...")

    env_path = os.path.join(DATA_DIR, ".env")

    if os.path.exists(env_path):
        with open(env_path) as f:
            content = f.read()

        has_openai = "OPENAI_API_KEY=" in content and "sk-" in content
        has_gemini = "GEMINI_API_KEY=" in content and content.split("GEMINI_API_KEY=")[1].split("\n")[0].strip()

        if has_openai or has_gemini:
            print("  API key found!")
            return True
        else:
            print("  .env exists but no API key set.")

    print("\n  You need an API key for AI features.")
    print("  Options:")
    print("    1. OpenAI: https://platform.openai.com/api-keys")
    print("    2. Gemini: https://makersuite.google.com/app/apikey")

    choice = input("\n  Enter key now? (openai/gemini/skip): ").strip().lower()

    if choice == "openai":
        key = input("  OpenAI API key: ").strip()
        with open(env_path, "w") as f:
            f.write(f"OPENAI_API_KEY={key}\n")
        print("  Saved!")
        return True
    elif choice == "gemini":
        key = input("  Gemini API key: ").strip()
        with open(env_path, "w") as f:
            f.write(f"GEMINI_API_KEY={key}\n")
        print("  Saved!")
        return True
    else:
        print("  Skipped. Add key to .env later.")
        return False

def setup_persona():
    """Create persona.json if it doesn't exist."""
    print("\n[4/5] Setting up your persona...")

    persona_path = os.path.join(DATA_DIR, "persona.json")

    if os.path.exists(persona_path):
        with open(persona_path) as f:
            persona = json.load(f)
        print(f"  Found existing persona: {persona.get('name', 'Unknown')}")
        update = input("  Update it? (y/n): ").strip().lower()
        if update != 'y':
            return True

    print("\n  Your persona helps generate authentic comments.")
    print("  Fill in your real background:\n")

    name = input("  Your name: ").strip() or "Anonymous"
    years = input("  Years of experience: ").strip()
    years = int(years) if years.isdigit() else 5
    role = input("  Current role: ").strip() or "Software Engineer"

    print("\n  Enter your skills (comma separated):")
    skills = input("  e.g. Python, AWS, React: ").strip()
    skills = [s.strip() for s in skills.split(",")] if skills else ["Python"]

    print("\n  Enter your domains (comma separated):")
    domains = input("  e.g. fintech, e-commerce: ").strip()
    domains = [d.strip() for d in domains.split(",")] if domains else ["tech"]

    print("\n  Enter 1-3 real experiences (one per line, empty to finish):")
    experiences = []
    for i in range(3):
        exp = input(f"  {i+1}. ").strip()
        if exp:
            experiences.append(exp)
        else:
            break

    if not experiences:
        experiences = ["Built and scaled production systems"]

    persona = {
        "name": name,
        "experience_years": years,
        "current_role": role,
        "expertise": {"main": skills},
        "domains": domains,
        "real_experiences": experiences,
        "personality": {
            "native_english": False,
            "writing_style": "simple, direct, practical"
        }
    }

    with open(persona_path, "w") as f:
        json.dump(persona, f, indent=2)

    print("\n  Persona saved!")
    return True

def import_data():
    """Help user import Reddit data."""
    print("\n[5/5] Import your Reddit data...")

    extracted_path = os.path.join(DATA_DIR, "extracted_data.json")

    if os.path.exists(extracted_path):
        with open(extracted_path) as f:
            data = json.load(f)
        posts = len(data.get("posts", []))
        comments = len(data.get("comments", []))
        print(f"  Found existing data: {posts} posts, {comments} comments")
        reimport = input("  Re-import? (y/n): ").strip().lower()
        if reimport != 'y':
            return True

    print("\n  How do you want to import?")
    print("    1. By username (quick, ~100 items)")
    print("    2. Skip for now")

    choice = input("\n  Choice (1/2): ").strip()

    if choice == "1":
        username = input("  Reddit username: ").strip().replace("u/", "")
        if username:
            print(f"\n  Importing u/{username}...")
            print("  Run the server and use:")
            print(f'  curl -X POST "http://localhost:8000/api/import/username" \\')
            print(f'    -H "Content-Type: application/json" \\')
            print(f'    -d \'{{"username": "{username}"}}\'')
    else:
        print("  Skipped. Import later using the API.")

    return True

def main():
    print_banner()

    check_dependencies()
    check_claude_cli()
    setup_env()
    setup_persona()
    import_data()

    print("\n" + "="*50)
    print("  Setup Complete!")
    print("="*50)
    print("\n  Start the server:")
    print("    python api.py")
    print("\n  Then open: http://localhost:8000")
    print("\n  API docs: http://localhost:8000/docs")
    print("="*50 + "\n")

if __name__ == "__main__":
    main()
