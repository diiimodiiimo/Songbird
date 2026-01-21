# Ralph Setup for SongBird

## Quick Setup

1. **Copy these files to your SongBird repo:**
   ```
   .github/workflows/ralph.yml
   .ralph/
   AGENTS.md (or merge with existing)
   ```

2. **Add your Anthropic API key to GitHub Secrets:**
   - Go to your repo → Settings → Secrets and variables → Actions
   - Add `ANTHROPIC_API_KEY` with your key

3. **That's it.** 

## How to Use (from your phone)

### Option A: GitHub Mobile App
1. Open GitHub app
2. Go to SongBird repo → Actions → "Ralph - Autonomous Dev Agent"
3. Tap "Run workflow"
4. Type your task and go

### Option B: iOS Shortcut (fastest)
I can create a Shortcut that lets you just type what you want and it triggers the workflow via GitHub API.

### Option C: Message me here
Send me the task in Claude, I'll format it properly and you can copy-paste into GitHub Actions.

## Example Tasks

Good tasks (specific, testable):
- "Add a dark mode toggle to settings"
- "Show streak count on the profile page"
- "Add loading skeleton to the feed"

Too vague (will struggle):
- "Make it better"
- "Fix bugs"
- "Improve performance"

## Reviewing Results

Ralph will:
1. Create a branch like `ralph/20250120-1430-add-dark-mode`
2. Make commits as it works
3. Open a PR when done

You review the PR, test locally if needed, and merge.

## Costs

Each iteration uses Claude Code API calls. Rough estimate:
- Simple task (3-5 iterations): ~$1-3
- Medium task (10 iterations): ~$5-10
- Complex task (20+ iterations): Consider breaking it down

## Troubleshooting

**Workflow fails immediately:**
- Check ANTHROPIC_API_KEY is set correctly

**Ralph gets stuck in a loop:**
- Task might be too vague or impossible
- Check the Actions log for what it's trying

**Code doesn't work:**
- Ralph isn't perfect - review the PR carefully
- Leave comments on the PR for the next iteration
