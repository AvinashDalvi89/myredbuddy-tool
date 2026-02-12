# Customizing Prompts

RedBuddy comes with **template prompts** that work out of the box. However, you'll get significantly better results by customizing them with:

- Your successful comment examples
- Your persona/expertise
- Subreddit-specific knowledge
- Patterns from your removed content

## Quick Start

### Option 1: Environment Variables (Recommended)

Add to your `.env` file:

```bash
REDBUDDY_PROMPT_SUGGEST="Your custom suggest prompt here..."
REDBUDDY_PROMPT_VALIDATE="Your custom validate prompt here..."
```

### Option 2: Prompt Files

Create text files in this directory:

```
prompts/
├── suggest.txt      # Comment suggestion prompt
├── validate.txt     # Draft validation prompt
├── shield.txt       # Pre-post safety check
├── analyze.txt      # Subreddit analysis
└── refine.txt       # Comment refinement
```

## Available Prompts

| Prompt | Purpose | Key Variables |
|--------|---------|---------------|
| `suggest` | Generate comment ideas | `{subreddit}`, `{post_text}`, `{patterns}` |
| `validate` | Check draft for issues | `{draft}`, `{subreddit}`, `{original_post}` |
| `shield` | Pre-post safety scan | `{text}`, `{subreddit}`, `{content_type}` |
| `analyze` | Analyze subreddit patterns | `{subreddit}`, `{posts_data}` |
| `refine` | Improve a comment | `{comment}`, `{feedback}`, `{feedback_type}`, `{subreddit}` |

## Customization Tips

### For Better Suggestions

Add to your suggest prompt:
```
My background: [Your expertise, years of experience]

Examples of my successful comments:
1. "[A comment that got good engagement]" - 15 upvotes
2. "[Another successful comment]" - 12 upvotes

My writing style: [casual/technical/friendly/etc]
```

### For Better Validation

Add to your validate prompt:
```
Subreddit-specific rules I know:
- r/programming: No basic questions, must be technically deep
- r/aws: Include specific services, costs appreciated

Patterns that got me downvoted:
- Starting with "Great question!"
- Being too promotional about my projects
```

### For Better Shield Detection

Add to your shield prompt:
```
Content that was removed from my history:
- "[Example removed comment]" - Reason: self-promotion
- "[Another example]" - Reason: low effort

AutoMod triggers I've discovered:
- Mentioning competitor products in r/[subreddit]
- Links in first comment on r/[subreddit]
```

## Example: Custom Suggest Prompt

Create `prompts/suggest.txt`:

```
You are helping me write a Reddit comment. I'm a software engineer with 8 years of experience, focused on cloud infrastructure.

Subreddit: r/{subreddit}
Post: {post_text}
My past successful patterns: {patterns}

Generate 3 comments that sound like ME:

1. Personal story angle - I often share war stories from production
2. Practical advice - I give specific, actionable tips
3. Thoughtful question - I ask things that show I read the post carefully

My style:
- Casual but knowledgeable
- I use specific numbers and tool names
- I avoid corporate buzzwords
- I occasionally use humor

BAD patterns to avoid (these got me downvoted):
- Starting with "Great question!" or "This resonates with me"
- Being vague without specifics
- Mentioning my blog or projects

Return as JSON with confidence scores.
```

## Testing Your Prompts

Check which prompts are active:
```bash
curl http://localhost:8000/api/prompts/status
```

Test a prompt:
```bash
curl -X POST http://localhost:8000/api/suggest \
  -H "Content-Type: application/json" \
  -d '{"post_text": "Test post", "subreddit": "test"}'
```

## Priority Order

Prompts are loaded in this order (first found wins):

1. **Environment variable** - `REDBUDDY_PROMPT_SUGGEST`
2. **Custom file** - `prompts/suggest.txt` (your edits, gitignored)
3. **Example file** - `prompts/suggest.example.txt` (ships with repo)
4. **Template** - Built-in default

## Getting Started

The `.example.txt` files work out of the box. To customize:

```bash
# Copy an example to create your custom version
cp prompts/suggest.example.txt prompts/suggest.txt

# Edit your custom version (this file is gitignored)
nano prompts/suggest.txt
```

Your custom `.txt` files won't be committed to git, so your optimizations stay private.

## Pro Tips

1. **Start with templates** - They work. Test first, then customize.

2. **Add YOUR examples** - The more examples of your successful content, the better.

3. **Be specific** - "Technical but friendly" is better than "professional".

4. **Include failures** - Telling AI what NOT to do is powerful.

5. **Iterate** - Prompts improve over time. Keep notes on what works.

6. **Backup your prompts** - If you invest time customizing, save them somewhere safe.

---

**Note:** The template prompts are intentionally generic. Your customizations are what make RedBuddy work great for YOU specifically.
