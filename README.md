# MyRedBuddy

**Post with confidence. Get engagement, not banned.**

MyRedBuddy is an action-oriented Reddit engagement tool that protects genuine users from bans, downvotes, and karma loss while helping them grow authentically.

![MyRedBuddy](dashboard/public/myredditbuddy-logo.png)

## Why MyRedBuddy?

Reddit is unforgiving. One wrong post can destroy your karma, get you shadowbanned, or kill your reputation in a community you care about. MyRedBuddy gives you a safety net:

- **Pre-post protection** - Check content BEFORE you post, not after
- **Learn from YOUR data** - See what works for YOU specifically
- **Action-oriented** - Every insight has an immediate action button
- **100% local** - Your data never leaves your machine
- **Subreddit-specific** - Each community is different

## Features

| Feature | What It Does | Action |
|---------|--------------|--------|
| **Shield Check** | Scans for ban triggers, AI detection, self-promo | → Fix issues before posting |
| **Pattern Analysis** | Shows what tones/topics work for YOU | → Generate similar content |
| **Comment Suggestions** | AI generates comments matching YOUR style | → Use winning patterns |
| **Competitor Analysis** | Learn what works in any subreddit | → Apply to your posts |
| **Removal Tracking** | Log removals, see patterns | → Avoid future mistakes |

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

### 4. Import Your Data

**Option A: By Username (quickest)**

Go to Dashboard → Setup → Enter your Reddit username → Import

Or via API:
```bash
curl -X POST "http://localhost:8000/api/import/username" \
  -H "Content-Type: application/json" \
  -d '{"username": "YOUR_REDDIT_USERNAME"}'
```

**Option B: GDPR Export (complete history)**

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

The dashboard is **action-oriented** - every metric has buttons to take immediate action:

### Overview Tab
- See your performance metrics
- Quick actions: Refresh, View Patterns, Copy Style, Find Posts

### Performance Tab
- What Works vs What Doesn't
- Actions: Copy Pattern, Generate Similar, Avoid This

### Analytics Tab
- Breakdown by Tone, Topic, Subreddit
- Actions: Filter, Generate with Tone, Find Opportunities

### Shield Tab
- Pre-flight content checker
- Actions: Auto-Fix, Humanize, Remove Promo

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
| `/api/import/username` | POST | Import by Reddit username |
| `/api/persona` | GET/POST | Get/Save your persona |
| `/api/suggest` | POST | Get comment suggestions |
| `/api/validate` | POST | Validate a draft |
| `/api/shield/check` | POST | Pre-flight content check |
| `/api/shield/cleanup` | POST | Find risky items in history |
| `/api/insights/removal` | POST | Log a content removal |
| `/api/insights/stats` | GET | Get removal patterns |

### Usage Examples

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
