# RedBuddy - User Guide

A comprehensive guide to using RedBuddy for analyzing your Reddit engagement and improving your content strategy.

---

## Table of Contents

1. [Getting Started](#getting-started)
2. [AI Configuration](#ai-configuration)
3. [Managing Multiple Reddit Accounts](#managing-multiple-reddit-accounts)
4. [Dashboard - Understanding Your Data](#dashboard)
5. [Recommendations](#recommendations)
6. [Competitor Analysis](#competitor-analysis)
7. [Reputation Shield](#reputation-shield)
8. [Insights - Removal Tracking](#insights)
9. [Data Safety & Backups](#data-safety--backups)
10. [Troubleshooting](#troubleshooting)

---

## Getting Started

### Prerequisites

1. **Python 3.8+** installed
2. **Node.js 18+** installed
3. **AI Provider** (choose one):
   - **Option A (Recommended):** Anthropic API key from [console.anthropic.com](https://console.anthropic.com)
   - **Option B:** Claude Code CLI - `npm install -g @anthropic-ai/claude-code`

### Installation

```bash
# Clone the repository
git clone https://github.com/AvinashDalvi89/myredbuddy-tool.git
cd reddit-buddy

# Install Python dependencies
pip install -r requirements.txt

# Install dashboard dependencies
cd dashboard
npm install
cd ..

# Configure AI (see AI Configuration section below)
cp .env.example .env
# Edit .env with your API key
```

### Running the Tool

You need to run both the API and the dashboard:

**Terminal 1 - Start the API:**
```bash
python api.py
# API runs on http://localhost:8000
```

**Terminal 2 - Start the Dashboard:**
```bash
cd dashboard
npm run dev
# Dashboard runs on http://localhost:3000
```

Open your browser to **http://localhost:3000**

---

## AI Configuration

RedBuddy uses Claude AI for recommendations, content analysis, and suggestions. You can choose between two modes:

### Option A: Anthropic API (Recommended)

Best for: Open source users, production use, reliable AI features

1. Get an API key from [console.anthropic.com](https://console.anthropic.com)
2. Create a `.env` file in the project root (or copy `.env.example`):

```bash
cp .env.example .env
```

3. Add your API key:

```env
ANTHROPIC_API_KEY=sk-ant-your-key-here

# Optional: Change model (default is claude-sonnet-4-20250514)
# CLAUDE_MODEL=claude-sonnet-4-20250514
```

4. Restart the API server

**Benefits:**
- Reliable and stable
- Proper rate limiting
- Clear per-token billing
- Works without Claude Code installed

### Option B: Claude CLI (Personal Use)

Best for: Developers with Claude Code subscription, personal projects

1. Install Claude Code CLI:
```bash
npm install -g @anthropic-ai/claude-code
```

2. Authenticate with your Anthropic account

3. Leave `ANTHROPIC_API_KEY` empty or not set in `.env`

**Benefits:**
- Uses existing Claude Code subscription
- Good for development and testing
- No separate API billing

### Checking Your AI Mode

The Setup tab shows which AI mode is active:
- **Purple badge (API):** Using Anthropic API with your key
- **Blue badge (CLI):** Using Claude Code CLI

You can also check via API:
```bash
curl http://localhost:8000/api/ai-config
```

---

## Managing Multiple Reddit Accounts

RedBuddy supports analyzing multiple Reddit accounts. Each account gets its own isolated profile with separate data.

### Importing Your First Account

1. Go to the **Setup** tab
2. Enter your Reddit username (without u/)
3. Check the confirmation box "I confirm this is my own Reddit account"
4. Click **Import Data**

Your data will be fetched from Reddit's public API and stored locally.

### Adding Another Account

Simply repeat the import process with a different username:

1. Go to **Setup** tab
2. Enter your second username
3. Confirm and import

A new profile is automatically created and set as active.

### Switching Between Accounts

In the **Setup** tab, you'll see a "Your Profiles" section:

- Each profile shows the username, post count, and comment count
- Click **Switch** to change the active profile
- The active profile is highlighted with an orange indicator
- The sidebar shows the currently active profile (u/username)

### What Happens When You Switch

- Dashboard data updates to show the selected profile's analytics
- Shield checks use the selected profile's history
- Insights show the selected profile's removal patterns
- All features work with the active profile's data

### Profile Data Location

Each profile's data is stored separately:

```
/reddit-buddy/profiles/
├── index.json                 # Profile list & active profile
├── username1/
│   ├── extracted_data.json    # Posts & comments
│   ├── removal_history.json   # Removal tracking
│   └── persona.json           # AI persona settings
└── username2/
    └── ...
```

---

## Dashboard

The Dashboard gives you a complete overview of your Reddit performance.

### Stats Overview

- **Total Posts/Comments**: Your content count
- **Average Upvotes**: Your typical engagement level
- **Top Subreddits**: Where you're most active

### What Works vs What Doesn't

The dashboard splits your content into two categories:

**What Works (3+ upvotes)**
- Content that resonated with the community
- Analyze the tones and topics that perform well

**What Doesn't Work (0-2 upvotes)**
- Content that didn't gain traction
- Identify patterns to avoid

### Filtering

Click on any stat card to filter the content:
- Click a subreddit to see only that subreddit's content
- Click a tone to see content with that tone
- Click a topic to see content about that topic

---

## Recommendations

AI-powered suggestions based on your historical performance.

### Post Ideas

Get suggestions for new posts based on:
- Your best-performing topics
- Subreddits where you do well
- Predicted upvote potential

### Comment Strategies

Learn what commenting approaches work for you:
- Personal experience sharing
- Technical/advisory responses
- Quick practical tips

### Patterns to Avoid

Identify what consistently underperforms:
- Topics that don't resonate
- Tones that get ignored
- Timing issues

---

## Competitor Analysis

Analyze any public subreddit to understand what works there.

### How to Use

1. Go to **Competitor Analysis** tab
2. Enter a subreddit name (e.g., `aws`, `programming`)
3. Click **Analyze**

### What You Get

- **Top Posts**: What's working in that subreddit
- **Tone Analysis**: What communication styles succeed
- **Topic Breakdown**: What subjects get engagement
- **AI Insights**: Actionable recommendations for that subreddit

### Use Cases

- Research a new subreddit before posting
- Understand community culture
- Find content gaps you can fill

---

## Reputation Shield

Pre-flight checks to prevent content removal and protect your reputation.

### Quick Scan

Enter your draft post/comment and target subreddit to check:

- **Subreddit Rules**: Does it violate known rules?
- **Spam Patterns**: Does it look promotional?
- **Tone Check**: Is it appropriate for the community?
- **Historical Patterns**: Based on your removal history

### What Gets Flagged

- Self-promotion without value
- Controversial topics for that subreddit
- Patterns similar to your previously removed content
- Rule violations (if subreddit rules are configured)

### Interpreting Results

- **Green (Safe)**: Good to post
- **Yellow (Caution)**: Review the warnings
- **Red (Risk)**: High chance of removal, reconsider

### History Cleanup

Analyze your existing content for risky posts that might get reported or removed later.

---

## Insights

Track content removals and learn from them.

### Logging Removals

When your content gets removed:

1. Go to **Insights** tab
2. Click "Log a Removal"
3. Enter:
   - Subreddit where it was removed
   - The content (or summary)
   - Type: Post or Comment
   - Reason (if known)
   - Who removed it: Mod, AutoMod, or Admin

### Removal Patterns

The Insights tab shows:

- **Total Removals**: Overall count
- **High-Risk Subreddits**: Where you get removed most
- **Common Reasons**: Why content gets removed
- **Removal Timeline**: Recent removals

### How Shield Uses Insights

Your removal history feeds into Shield checks:

- If you've had removals in a subreddit, Shield warns you
- Pattern matching identifies similar content to past removals
- High-risk topics are flagged based on your history

---

## Data Safety & Backups

Your data is stored locally on your machine. Here's how to keep it safe.

### Where Data is Stored

```
/reddit-buddy/profiles/
```

This folder contains all your profiles and data.

### Exporting a Profile

1. Go to **Setup** tab
2. Find the profile in "Your Profiles"
3. Click the database icon (Export/Backup)
4. Click **Download Backup**

You'll get a JSON file with all your data.

### Importing a Backup

Use the API endpoint:
```bash
curl -X POST http://localhost:8000/api/profiles/import \
  -H "Content-Type: application/json" \
  -d @your-backup-file.json
```

### Backup Best Practices

1. **Regular Backups**: Export after significant data changes
2. **Before Updates**: Backup before updating the tool
3. **Cloud Storage**: Store backups in cloud storage for safety

### Removing a Profile

1. Go to **Setup** tab
2. Click the X button on a profile
3. Confirm removal

**Note**: This only removes the profile from the list. Data files are preserved on disk. To fully delete, manually remove the folder from `/profiles/`.

---

## Troubleshooting

### API Connection Error

**Symptom**: "Could not connect to API"

**Solution**:
```bash
# Make sure API is running
python api.py

# Check it's accessible
curl http://localhost:8000/health
```

### No Data Showing

**Symptom**: Dashboard shows "No data loaded"

**Solutions**:
1. Check if you've imported data in Setup tab
2. Verify the active profile has data
3. Check the profiles directory exists

### Import Failed

**Symptom**: "No data found for u/username"

**Possible Causes**:
- Username is incorrect
- Profile is set to private
- Reddit API rate limiting

**Solution**: Wait a few minutes and try again. Verify the username is correct.

### Build Errors

**Symptom**: Next.js build or runtime errors

**Solution**:
```bash
cd dashboard
rm -rf .next
npm run dev
```

### Data Not Syncing Between Profiles

**Symptom**: Switching profiles doesn't update dashboard

**Solution**: Refresh the page after switching profiles, or check that the API is running.

---

## Tips for Best Results

### Import More Data

The more data you import, the better the recommendations:
- Use GDPR export for complete history
- Import regularly to keep data fresh

### Configure Subreddit Rules

Add rules for subreddits you post in frequently:
```bash
# Edit subreddit_rules.json
```

### Set Up Your Persona

Configure your persona for better AI suggestions:
- Your expertise areas
- Your communication style
- Real experiences to reference

### Use Shield Before Posting

Always run a Shield check before posting to high-value subreddits. It takes seconds and can save hours of frustration.

---

## Privacy & Ethics

### Self-Analysis Only

This tool is designed for analyzing **your own** Reddit activity. While it technically can fetch any public profile, please:

- Only analyze accounts you own
- Don't use it to stalk or harass others
- Respect Reddit's terms of service

### Data Privacy

- All data stays on your local machine
- No data is sent to external servers (except Claude API for AI features)
- You control your data completely

### Rate Limiting

Be respectful of Reddit's API:
- Don't import too frequently
- The tool includes built-in delays
- If you hit rate limits, wait before retrying

---

## Developer Guide

### Project Structure

The API follows a modular FastAPI architecture:

```
reddit-buddy/
├── api.py                 # Entry point
├── app/
│   ├── main.py           # FastAPI app setup
│   ├── config.py         # Settings and configuration
│   ├── models.py         # Pydantic request/response models
│   ├── routers/          # API endpoint handlers
│   │   ├── health.py     # /health, /api/status
│   │   ├── profiles.py   # /api/profiles/*
│   │   ├── imports.py    # /api/import/*, /api/rules
│   │   ├── ai.py         # /api/validate, /api/suggest, /api/analyze
│   │   ├── insights.py   # /api/insights/*
│   │   └── shield.py     # /api/shield/*
│   └── services/         # Business logic layer
│       ├── claude.py     # AI integration (API + CLI)
│       ├── reddit.py     # Reddit data fetching
│       ├── storage.py    # File/profile management
│       └── analysis.py   # Data analysis helpers
├── dashboard/            # Next.js frontend
├── profiles/             # User data storage
└── process_data.py       # Tone/topic classification
```

### Running for Development

```bash
# Backend (with auto-reload)
uvicorn app.main:app --reload --port 8000

# Or use the entry point
python api.py

# Frontend
cd dashboard && npm run dev
```

### API Documentation

Once running, visit:
- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

### Adding New Endpoints

1. Create or update a router in `app/routers/`
2. Add business logic to `app/services/`
3. Define request/response models in `app/models.py`
4. Include the router in `app/main.py`

### Testing

```bash
# Check API health
curl http://localhost:8000/health

# Check AI configuration
curl http://localhost:8000/api/ai-config

# Check status
curl http://localhost:8000/api/status
```

---

## Getting Help

- **Issues**: https://github.com/AvinashDalvi89/myredbuddy-tool/issues
- **Discussions**: GitHub Discussions
- **Updates**: Watch the repository for new features

---

*RedBuddy is an open-source tool. Contributions welcome!*
