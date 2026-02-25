# MyRedBuddy

**Post with confidence. Get engagement, not banned.**

MyRedBuddy is an action-oriented Reddit engagement tool that protects genuine users from bans, downvotes, and karma loss while helping them grow authentically.

![MyRedBuddy](dashboard/public/myredditbuddy-logo.png)

## Why MyRedBuddy?

Reddit is unforgiving. One wrong post can destroy your karma, get you shadowbanned, or kill your reputation in a community you care about. MyRedBuddy gives you a safety net:

- **No account required to start** - Use Community Guide, Pre-Post Checker, and Reputation Shield with zero Reddit history
- **Pre-post protection** - Check content BEFORE you post, not after
- **Learn from YOUR data** - See what works for YOU specifically
- **Action-oriented** - Every insight has an immediate action button
- **100% local** - Your data never leaves your machine
- **Subreddit-specific** - Each community is different

## Features

| Feature | What It Does | Needs Account? |
|---------|--------------|----------------|
| **Community Guide** | Culture briefing for any subreddit — vibe, unwritten rules, what gets removed | No |
| **Pre-Post Checker** | Validate a draft before posting, get a score and rewrite | No |
| **Reputation Shield** | Scans for ban triggers, AI detection, self-promo patterns | No |
| **Competitor Analysis** | Learn what content performs best in any subreddit | No |
| **Pattern Analysis** | Shows what tones/topics work for YOU specifically | Yes |
| **Recommendations** | AI post ideas based on your history | Yes |
| **Removal Insights** | Log removals, see patterns, avoid repeat mistakes | Yes |

## Who Is This For?

- **New to Reddit** — No post history yet? Start with Community Guide to understand any subreddit before your first post
- **Getting banned often** — Use Reputation Shield and Pre-Post Checker without needing to import your history
- **Experienced users** — Import your Reddit history for personalized insights, recommendations, and pattern analysis
- **Lurkers** — Explore communities and validate posts without linking an account

## Quick Start

### 1. Clone and Install

```bash
git clone https://github.com/AvinashDalvi89/myredbuddy-tool.git
cd myredbuddy-tool

# Install Python dependencies
pip install -r requirements.txt

# Install dashboard dependencies
cd dashboard && npm install && cd ..
```

### 2. Configure AI (Choose One)

Create `.env` file:

```bash
# Option A: Anthropic API (Recommended)
ANTHROPIC_API_KEY=your-key-here

# Option B: Claude CLI (if no API key)
# Just install: npm install -g @anthropic-ai/claude-code
# No env variable needed
```

### 3. Start Services

```bash
# Terminal 1: Start API
python api.py
# → http://localhost:8000

# Terminal 2: Start Dashboard
cd dashboard && npm run dev
# → http://localhost:3000
```

### 4. First Time? Two paths

**Path A — No Reddit account / just exploring**

Open http://localhost:3000 — you will land on the Community Guide flow automatically.
Enter any subreddit name to get a culture briefing before you post. No account or import needed.

Tools available without an account:
- Community Guide (`/api/community/culture`)
- Pre-Post Checker (`/api/validate`)
- Reputation Shield (`/api/shield/check`)
- Competitor Analysis (`/api/analyze`)

**Path B — Import your Reddit history**

Go to Dashboard → you will be guided through onboarding automatically.

Enter your Reddit username:
- If you already have a persona saved, onboarding skips directly to linking your account — no repeated setup steps
- If it's your first time, you will go through a short persona setup (goal, background, expertise)

Or import directly via API:
```bash
curl -X POST "http://localhost:8000/api/import/username" \
  -H "Content-Type: application/json" \
  -d '{"username": "YOUR_REDDIT_USERNAME"}'
```

**Path C — GDPR Export (complete history)**

For your full Reddit history:
1. Go to https://www.reddit.com/settings/data-request
2. Request your data (takes 24-48 hours)
3. Download and extract the ZIP
4. Import via Dashboard → Setup → GDPR Import

### 5. Set Up Your Persona (Optional but Recommended)

For better AI suggestions, create `persona.json`:

```json
{
  "name": "Your Name",
  "experience_years": 10,
  "current_role": "Software Engineer",
  "expertise": ["Python", "AWS", "React"],
  "domains": ["fintech", "e-commerce"],
  "real_experiences": [
    "Built payment system handling $1M daily",
    "Migrated monolith to microservices"
  ]
}
```

Or use the API:
```bash
curl -X POST "http://localhost:8000/api/persona" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Your Name",
    "experience_years": 10,
    "expertise": ["Python", "AWS"],
    "real_experiences": ["Built X", "Scaled Y"]
  }'
```

See `persona.example.json` for a full template.

## Dashboard

The dashboard is **action-oriented** — every metric has buttons to take immediate action.

### Community Guide *(no account needed)*
Enter any subreddit and get a culture briefing:
- Community vibe and tone
- What gets upvoted vs removed
- Unwritten rules not in the sidebar
- 2-3 concrete first post ideas tailored to that community
- New account tips (karma/age requirements)

### Pre-Post Checker *(no account needed)*
Paste a draft post or comment, pick the target subreddit, get:
- Score out of 10
- Strengths and issues
- A rewritten version if score is below 7
- Reputation Shield check runs at the same time

### Reputation Shield *(no account needed)*
Standalone content safety check — ban triggers, AI detection patterns, self-promotion signals.

### Competitor Analysis *(no account needed)*
Analyze any subreddit to see what content performs best.

### Dashboard / Overview *(account required)*
See your performance metrics, top content, quick actions.

### Recommendations *(account required)*
AI-generated post ideas and comment strategies based on your history.

### Removal Insights *(account required)*
Log removals, see patterns across subreddits, avoid repeating mistakes.

## Customization

### Custom Prompts

MyRedBuddy uses AI prompts that you can customize:

```bash
# Via environment variables
MYREDBUDDY_PROMPT_SUGGEST=Your custom prompt...

# Or via files in /prompts/ directory
echo "Your prompt here" > prompts/suggest.txt
```

See `/prompts/README.md` for details.

### Shield Weights

Adjust how strict the shield is:

```bash
SHIELD_WEIGHT_AI_TONE=20
SHIELD_WEIGHT_SELF_PROMO=25
SHIELD_WEIGHT_LOW_EFFORT=15
```

## API Reference

**Interactive Docs:** http://localhost:8000/docs (Swagger UI)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/health` | GET | Health check |
| `/api/status` | GET | Check loaded data |
| `/api/prompts/status` | GET | Check prompt configuration |
| `/api/community/culture` | POST | Community Guide — culture briefing for any subreddit |
| `/api/import/username` | POST | Import by Reddit username |
| `/api/persona` | GET/POST | Get/Save your persona |
| `/api/suggest` | POST | Get comment suggestions |
| `/api/validate` | POST | Validate a draft |
| `/api/shield/check` | POST | Pre-flight content check |
| `/api/shield/cleanup` | POST | Find risky items in history |
| `/api/insights/removal` | POST | Log a content removal |
| `/api/insights/stats` | GET | Get removal patterns |

### Usage Examples

**Get Community Guide (no account needed):**
```bash
curl -X POST "http://localhost:8000/api/community/culture" \
  -H "Content-Type: application/json" \
  -d '{"subreddit": "webdev", "limit": 50}'
```

**Get Comment Suggestions:**
```bash
curl -X POST "http://localhost:8000/api/suggest" \
  -H "Content-Type: application/json" \
  -d '{
    "post_text": "How do you handle deployments at scale?",
    "subreddit": "ExperiencedDevs"
  }'
```

**Validate a Draft:**
```bash
curl -X POST "http://localhost:8000/api/validate" \
  -H "Content-Type: application/json" \
  -d '{
    "draft": "My comment here...",
    "subreddit": "programming",
    "original_post": "The post I am replying to..."
  }'
```

**Shield Check Before Posting:**
```bash
curl -X POST "http://localhost:8000/api/shield/check" \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Check out my new tool for...",
    "subreddit": "programming",
    "content_type": "comment"
  }'
```

**Analyze a Subreddit:**
```bash
curl -X POST "http://localhost:8000/api/analyze" \
  -H "Content-Type: application/json" \
  -d '{"subreddit": "aws", "limit": 50}'
```

## Architecture

```
myredbuddy/
├── app/                    # FastAPI backend
│   ├── routers/           # API endpoints
│   ├── services/          # Business logic
│   └── prompts.py         # Prompt management
├── dashboard/             # Next.js frontend
├── prompts/               # Custom prompt templates
└── profiles/              # User data (local)
```

## Data Privacy

- **100% Local** - All data stored on your machine
- **No Cloud** - Nothing sent to external servers (except AI API calls)
- **Your Control** - Delete anytime, export anytime
- **Profile Isolation** - Multiple accounts stay separate

## Contributing

PRs welcome! Open an issue to discuss before making major changes.

### Key Principles
1. Every metric must have an action
2. Actions should be one-click when possible
3. Privacy first - local storage only
4. Authentic engagement, not manipulation

## License

MIT

## Links

- **Landing Page:** [myredbuddy.com](https://myredbuddy.com)
- **GitHub:** [github.com/AvinashDalvi89/myredbuddy-tool](https://github.com/AvinashDalvi89/myredbuddy-tool)
- **Issues:** [Report bugs or request features](https://github.com/AvinashDalvi89/myredbuddy-tool/issues)

---

Built by [@AvinashDalvi89](https://github.com/AvinashDalvi89)

**"Post with confidence. Get engagement, not banned."**
