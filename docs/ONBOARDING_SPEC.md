# SongBird Onboarding Implementation Spec

## Overview

Build a warm, "friend showing you around" onboarding flow that gets new users to log their first real song within 2 minutes. This should feel personal, not corporate.

**Core message to convey:** "SongBird helps you understand the connection between music and the life you live."

**Positioning (use this language or similar):** "Spotify shows you what you played. SongBird helps you remember *why* it mattered."

---

## Voice & Tone

- Warm, personal, like a friend texting you
- Not corporate, not overly enthusiastic, not minimalist-cold
- Use "you" and "your" — make it feel personal
- Okay to be a little playful but not cheesy
- Match the existing app's tone exactly

**Example good copy:**
- "What should we call you?"
- "Every day, log the song that defined it."
- "Over time, you'll build something beautiful."

**Example bad copy:**
- "Welcome to SongBird™! Let's get you set up!"
- "Create your musical journey today!"
- "You're going to LOVE this!"

---

## Flow Structure (6 Screens)

### Screen 1: Welcome
**Purpose:** Set the emotional tone

**Content:**
- The user's selected bird (default to Robin) with a gentle idle animation
- Headline: "Welcome to SongBird"
- Subtext: "Remember your life through music"
- Single "Continue" button

**Notes:**
- Keep it simple, let the bird be the focus
- This screen should feel like a breath, not information overload

---

### Screen 2: Set Username
**Purpose:** Establish identity (required)

**Content:**
- Headline: "What should we call you?"
- Username input field with validation
- Show availability check in real-time
- "Continue" button (disabled until valid username)

**Behavior:**
- No skip option — username is required
- Validate: 3-20 characters, alphanumeric + underscores, unique
- Show inline errors: "Too short", "Already taken", etc.
- On success, save username to database before proceeding

**Notes:**
- If username already exists (returning user somehow hit onboarding), pre-fill it and let them continue

---

### Screen 3: First Entry (Real Song)
**Purpose:** Teach the core mechanic by doing it

**Content:**
- Headline: "Let's log your first song"
- Subtext: "What song defined today? Or pick a recent day that stands out."
- Show the bird tap interaction (same as main app)
- Full song entry flow: search Spotify → select song → add optional note → save

**Behavior:**
- This creates a REAL entry in the database
- Date defaults to today but user can change it
- After saving, show a small success moment ("Got it! Your first memory is saved.")

**Important — Add this helper text somewhere visible:**
- "Not sure yet? You can always edit or change songs later from your timeline."

**Notes:**
- Use the existing AddEntryTab component/flow if possible, just wrapped in onboarding context
- The bird animation (tap → fly away → reveal form) should work exactly as it does in the main app

---

### Screen 4: Memories Preview
**Purpose:** Show the payoff of consistent logging

**Content:**
- Headline: "Over time, you'll build a musical autobiography"
- Show a mock/preview of the "On This Day" feature
- Subtext: "Imagine seeing what song defined this day last year, or three years ago."
- If they just logged a song, reference it: "Your first memory is already saved. Keep going and you'll have a year of moments to look back on."

**Visual:**
- Could show a sample "On This Day" card or a timeline preview
- The bird could appear looking at the memories (curious state)

---

### Screen 5: Social (Optional)
**Purpose:** Explain social features without pressure

**Content:**
- Headline: "Share with friends — or keep it private"
- Subtext: "SongBird can be your personal journal, or you can share moments with close friends. Your call."
- Two paths:
  - Primary button: "Invite a friend" → opens share/invite flow
  - Secondary/text link: "I'll journal solo for now" → continues to completion

**What to briefly mention (1-2 lines max, not a tutorial):**
- You can add friends and see what they're logging
- You can vibe (like) and comment on friends' songs
- Everything is private to your friends — no public posting

**Invite flow (if they tap "Invite a friend"):**
- Generate a shareable link or show username search
- After sharing OR dismissing, continue to completion

**Notes:**
- Don't make them feel bad for skipping social
- The "solo" option should feel equally valid, not like a lesser choice

---

### Screen 6: Completion / Celebration
**Purpose:** Transition to the main app with a positive feeling

**Content:**
- Headline: "You're all set!"
- Subtext: "Your flock awaits." (or similar bird-themed line)
- Bird does a happy animation (bounce, confetti, music notes — something celebratory but brief)
- Single button: "Start logging" → redirects to main dashboard (Today tab)

**Behavior:**
- Mark onboarding as complete in database (set `onboardingCompletedAt` to now)
- Redirect to dashboard

---

## Database Changes

### Add to User model:
- `onboardingCompletedAt` (DateTime, nullable) — null means hasn't completed
- Optionally: `onboardingSkippedAt` (DateTime, nullable) — if you want to track skips separately

### Migration for existing users:
- All users created before this feature launches should have `onboardingCompletedAt` backfilled to their `createdAt` date
- This ensures existing users don't see onboarding

---

## Routing Logic

### When user logs in or signs up:
1. Check if `onboardingCompletedAt` is null
2. If null → redirect to `/welcome` (onboarding)
3. If not null → redirect to `/dashboard`

### The `/welcome` route:
- Should NOT show the bottom navigation
- Should be a full-screen flow
- Should not be accessible if onboarding already completed (redirect to dashboard)

---

## Skip Functionality

### There should be a skip option, but with nuance:
- **Screen 1 (Welcome):** No skip, just continue
- **Screen 2 (Username):** No skip, username is required
- **Screen 3 (First Entry):** Allow skip with text "I'll do this later"
- **Screen 4 (Memories):** No skip needed, it's just informational, has continue
- **Screen 5 (Social):** The "solo" option IS the skip
- **Screen 6 (Completion):** No skip, just finish

### If they skip the first entry:
- Still mark onboarding complete
- They land on dashboard with an empty Today tab
- The normal empty state encourages them to log

---

## Progress Indicator

- Show dot indicators at bottom of screen (6 dots)
- Current screen = filled dot, others = outline
- Subtle, not distracting
- Consider hiding on Screen 1 (Welcome) for cleaner first impression

---

## Visual Design

### Theme:
- Use the default Robin theme colors (current app default)
- Dark background with rust-orange accents
- Match existing `globals.css` and `UI_DESIGN_DOCUMENT.md`

### Layout:
- Full-screen cards, swipe or button to advance
- Content centered vertically
- Bird mascot appears on most/all screens
- Generous whitespace, not cramped

### Animations:
- Bird should have subtle idle animation on each screen
- Transitions between screens: simple fade or slide (nothing fancy)
- Completion screen: bird does happy bounce + music notes or subtle confetti

---

## Analytics to Track

Add event tracking for:
- `onboarding_started` — when they hit Screen 1
- `onboarding_username_set` — when username saved
- `onboarding_first_entry_created` — when they log their first song
- `onboarding_first_entry_skipped` — if they skip Screen 3
- `onboarding_invite_tapped` — if they tap invite on Screen 5
- `onboarding_invite_skipped` — if they choose solo
- `onboarding_completed` — when they finish
- `onboarding_dropped_off` — if they leave mid-flow (track which screen)

This helps identify where users get stuck or leave.

---

## Streak Logic Update (Separate Task)

**Current behavior:** Streak counts if you fill in any date.

**New behavior:** Streak only counts if the entry is logged on the same calendar day.

### Rules:
- An entry contributes to streak if `entry.createdAt` is the same calendar day as `entry.date`
- Backfilled entries (past dates logged later) still appear in timeline but don't count toward streak
- Consider a grace period: logging before noon counts for the previous day (for night owls) — OPTIONAL, can add later

### Why:
- Streaks should reward the daily ritual of reflection
- Backfilling is still valuable for building your memory archive, just doesn't game the streak
- This is the honest metric

### Implementation:
- Update streak calculation logic wherever it currently lives
- Don't break existing streaks — grandfather them in OR recalculate (your call)
- Display should still say "X day streak" but based on new logic

---

## Invite Friends Flow (New Feature Needed)

Currently doesn't exist. Build a simple version:

### Option A: Share link
- Generate a unique invite link per user
- When someone signs up via link, automatically create friend request or connection
- "Share your link" button that opens native share sheet

### Option B: Username search
- "Find friends by username" search
- Send friend request from search results

### For onboarding, Option A (share link) is simpler and more likely to convert.

### Where invite lives after onboarding:
- Profile tab → "Invite Friends" button
- Aviary tab → Empty state includes invite CTA
- Maybe: Feed tab empty state

---

## File Structure Suggestion

```
app/
  welcome/
    page.tsx              # Main onboarding page
    layout.tsx            # Layout without bottom nav

components/
  onboarding/
    OnboardingFlow.tsx    # Controls which screen shows, handles progression
    WelcomeScreen.tsx
    UsernameScreen.tsx
    FirstEntryScreen.tsx
    MemoriesScreen.tsx
    SocialScreen.tsx
    CompletionScreen.tsx
    ProgressDots.tsx      # The dot indicator component
```

---

## Summary Checklist

Before shipping onboarding:

- [ ] Database: Add `onboardingCompletedAt` field to User
- [ ] Database: Backfill existing users so they skip onboarding
- [ ] Routing: Redirect new users to `/welcome`
- [ ] Routing: Redirect completed users to `/dashboard`
- [ ] Screen 1: Welcome with bird animation
- [ ] Screen 2: Username input (required, validated)
- [ ] Screen 3: First song entry (real entry, skippable)
- [ ] Screen 4: Memories/On This Day preview
- [ ] Screen 5: Social explanation + invite or skip
- [ ] Screen 6: Celebration + redirect
- [ ] Progress dots on all screens
- [ ] Skip saves progress appropriately
- [ ] Analytics events firing
- [ ] Streak logic updated to same-day only
- [ ] Invite friends flow exists (at least share link)
- [ ] Mobile responsive (test on small screens)
- [ ] Matches existing app theme/design

---

## Finalized Decisions

1. **Streak protection system** — See expanded section below

2. **Invite link mechanics:** Requires approval. Clicking an invite link sends a friend request, doesn't auto-connect.

3. **Invite link format:** Use random code format (e.g., `songbird.app/join/a8x9k2`). This is standard, doesn't expose usernames in URLs, and is easier to manage.

4. **Grandfathering streaks:** Existing users keep their current streak count when new logic ships. Don't recalculate retroactively.

---

## Streak System (Expanded)

### Core Rules

1. **Same-day logging required:** An entry only counts toward streak if logged on the same calendar day as the entry date
2. **Backfills don't count:** You can still fill in past dates for your memory archive, but they don't contribute to streak
3. **Streak resets at midnight** in user's local timezone

### Streak Freeze (Like LinkedIn Games)

**How it works:**
- Users get 1 streak freeze that auto-activates if they miss a day
- The freeze "covers" the missed day — streak doesn't break
- Freeze regenerates after X days of continuous logging (suggest: 7 days)
- Only 1 freeze can be banked at a time

**Visual indicator:**
- Show freeze status somewhere (Profile or Today tab)
- "🛡️ Streak Freeze Ready" or "🛡️ Freeze Used — Rebuilding (5/7 days)"

**When freeze activates:**
- User misses a day
- Next time they open app, show a gentle message: "Your streak freeze saved your 15-day streak! Log today to keep it going."

### Streak Restore (Like Snapchat)

**How it works:**
- If streak breaks AND no freeze was available, offer a one-time restore
- Restore could be:
  - Free once per month, OR
  - Costs in-app currency (if you add that), OR
  - Tied to premium/battlepass

**For V1, suggest:** One free restore per month. Keep it simple.

**UX flow:**
- User's streak breaks
- Next time they open app: "Your 23-day streak ended yesterday. Restore it?" 
- Two buttons: "Restore Streak" (once/month free) and "Start Fresh"
- If they already used their monthly restore: "Your streak ended. You've already used your monthly restore. Start a new streak today!"

### Streak Display

- Show current streak number on Today tab and Profile
- Consider a small flame or bird-themed icon (🔥 or 🐦 with a number)
- Milestone celebrations: 7 days, 30 days, 100 days, 365 days

### Database Fields to Add

```
User model:
  currentStreak        Int       @default(0)
  longestStreak        Int       @default(0)
  lastStreakDate       DateTime? // Last date that counted toward streak
  streakFreezeAvailable Boolean  @default(true)
  streakFreezeUsedAt   DateTime? // When freeze was last used
  lastStreakRestoreAt  DateTime? // When they last used monthly restore
```

### Streak Calculation Logic

```
On app open or new entry:
1. Get user's last streak date
2. Get today's date (user's local timezone)
3. Calculate days between them

If days == 0:
  → Already logged today, no change

If days == 1:
  → They're continuing streak, increment if they log today

If days == 2 (missed yesterday):
  → Check if freeze available
  → If yes: activate freeze, keep streak, mark freeze as used
  → If no: streak breaks (offer restore if eligible)

If days > 2:
  → Streak breaks, no freeze can save it
  → Offer restore if eligible
```

---

## Implementation Priority

For launch, implement in this order:

### Must have (V1):
- [ ] Same-day streak logic
- [ ] Streak freeze (auto-activates on miss)
- [ ] Grandfather existing streaks
- [ ] Basic streak display

### Nice to have (V1.1):
- [ ] Streak restore (once per month)
- [ ] Freeze regeneration indicator
- [ ] Milestone celebrations

### Later (V2+):
- [ ] Streak restore tied to premium/battlepass
- [ ] Streak leaderboards with friends
- [ ] "Streak rescue" as paid feature
