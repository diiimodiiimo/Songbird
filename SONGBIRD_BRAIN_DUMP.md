# SongBird — Complete Project Brain Dump

> Drop this doc into any AI conversation to get full context on the project for planning, brainstorming, and building.

---

## What Is SongBird?

SongBird is a **"Song of the Day" music journaling app**. Users log one song per day that represents their day, add personal notes and tag people they were with, and build a musical autobiography over time.

**Core value proposition:** *"Remember your life through music."*

The app connects songs to life moments — creating a deeply personal, emotional archive that grows more valuable over time. Think of it as a diary, but instead of writing pages, you pick one song each day and add context about why.

### Design Philosophy

> *"A robin on a branch at dawn: warm chest, cool surroundings, attentive, personal."*

- **Warm and personal**, not clinical or sterile
- **Core functionality** over flashy features
- **Private-first** — social features exist but are optional (friends only, not public)
- **Emotional connection** — the design enhances the feeling of music + memory

---

## Founder Context

- **Solo founder**, side project (not full-time yet)
- **Bootstrap budget** — minimal spending
- **Technical** — building with Cursor/AI assistance
- **No formal design training** — relying on AI-generated assets and iteration
- **Has 4.5+ years of personal data** (~1,400+ entries) — this is the founder's own tool first
- **Goal**: Get to 10 test users (friends/family), then grow from there toward App Store launch

---

## What Exists Today

### Two Codebases

**1. Web App (Primary — Production)**
- **Framework**: Next.js 16 (App Router) with TypeScript
- **Database**: PostgreSQL via Supabase (using raw Supabase JS client, not Prisma at runtime)
- **Auth**: Clerk
- **Music API**: Spotify Web API
- **Hosting**: Vercel
- **Payments**: Stripe (Founding Flock + SongBird Plus subscriptions)
- **Styling**: Tailwind CSS with custom CSS variables (warm dark theme)
- **Fonts**: Crimson Text (headings/titles — elegant serif) + Inter (body — clean sans-serif)
- **Video**: Remotion (for generating promo/recap videos)

**2. Mobile App (In Progress)**
- **Framework**: Expo (React Native) with Expo Router
- **Auth**: Clerk (`@clerk/clerk-expo`)
- **API**: Calls the same web app API endpoints via `Bearer` token
- **Status**: Has scaffolding — onboarding flow, tab navigation, theme system — but screens are mostly placeholders
- **Tabs**: Today | Memory | Feed | Aviary | Insights | Profile

---

## Feature Map (What's Built)

### Core Features ✅
- **Daily Song Logging** — Search Spotify, pick a song, add notes, tag people
  - One entry per user per day (unique constraint on `[userId, date]`)
  - Same-day requirement for streaks (entry date must match creation date)
- **Song Search** — Spotify Web API integration for finding tracks
- **Entry Notes** — Free-text notes attached to each entry
- **People Tagging** — Tag people who were with you (both app users and non-users via `PersonReference`)

### Memory Features ✅
- **"On This Day" Memories** — See what song you logged on this date in previous years (emotionally powerful, prominently placed)
- **AI Insight** — AI-generated insight about your "On This Day" entries
- **Full History/Archive** — Browse all past entries with search

### Social Features ✅
- **Friends System** — Send/accept friend requests (bidirectional)
- **Social Feed** — See friends' song entries in a feed
- **Vibes** — React to friends' entries (like a "like" button)
- **Comments** — Comment on friends' entries
- **Mentions** — Mention friends in entries (triggers notifications)
- **Invite System** — Invite codes for bringing friends to the app
- **User Profiles** — Public profiles with username, bio, favorites, stats
- **Blocking & Reporting** — Full safety system (block users, report content/users)

### Analytics & Insights ✅
- **Top Artists** — Podium-style ranking with artist images
- **Top Songs** — Most frequently logged songs
- **People in Your Days** — Who you tag most often
- **Time Period Filters** — Last 4 weeks, 6 months, calendar year, all time
- **Artist Search** — Search your own data by artist
- **Wrapped** — Year-end summary (premium feature, like Spotify Wrapped)
- **Leaderboard** — Social streak/engagement leaderboard

### Gamification ✅
- **Streaks** — Daily streak tracking with:
  - Streak freeze (auto-activates if you miss ONE day, regenerates after 7 consecutive days)
  - Streak restore (once per month if streak breaks)
  - Milestone tracking (7, 30, 50, 100, 200, 365 days)
- **Bird Avatars ("Aviary")** — Collectible bird themes that unlock via milestones
  - Default birds: American Robin, Northern Cardinal
  - Unlock via streaks (7-day, 14-day, 30-day, etc.), entry count, time on platform
  - Premium-exclusive birds
  - Each bird has its own color accent theme
- **Milestone Modal** — Celebration when hitting streak milestones

### Monetization ✅
- **Stripe Integration** — Full payment flow
- **Founding Flock** — Early supporter tier (limited slots, special pricing)
- **SongBird Plus (Premium)** — Subscription tier
- **Freemium Model**:
  - **Free**: 30 entries/month, 20 friend limit, 30-day "On This Day" history, basic analytics
  - **Premium**: Unlimited entries, unlimited friends, full history, Wrapped, data export, all birds unlocked

### Onboarding ✅
- Multi-step onboarding flow:
  - Welcome → Age Gate → Terms → Why SongBird → Value Props → Username → Social Preview → Memories Preview → Spotify Data Primer → First Entry → Attribution → Premium Upsell → Notification Setup → Completion
- Skippable (tracked separately from completion)

### Other ✅
- **Push Notifications** — Web push via `web-push` library
- **Notification Preferences** — Granular control (vibes, comments, mentions, friend requests, "On This Day" reminders)
- **Waitlist** — Pre-launch email collection with referral tracking
- **Analytics Events** — Internal event tracking for user behavior
- **Theme System** — CSS variable-based theming that changes with bird selection
- **Contacts Discovery** — Find friends from contacts

---

## Database Schema (PostgreSQL via Supabase)

### Core Models
| Model | Purpose | Key Fields |
|-------|---------|------------|
| **User** | User accounts | email, username, clerkId, bio, image, theme, streaks, premium status, notification prefs |
| **Entry** | Daily song entries | date, songTitle, artist, albumArt, trackId, uri, notes, mood | Unique on `[userId, date]` |
| **EntryTag** | Tag users on entries | entryId, userId |
| **FriendRequest** | Friend system | senderId, receiverId, status (pending/accepted/declined) |
| **Mention** | Social mentions | entryId, userId |
| **PersonReference** | Tag non-users by name | entryId, name, userId (optional link) |
| **Vibe** | Entry reactions | entryId, userId |
| **Comment** | Entry comments | entryId, userId, content |
| **Notification** | In-app notifications | userId, type, relatedId, read |
| **PushSubscription** | Web push endpoints | userId, endpoint, p256dh, auth |
| **Invite** | Invite codes | code, senderId, receiverId, status |
| **UnlockedBird** | Bird collection tracking | userId, birdId, method (milestone/purchased/premium) |
| **AnalyticsEvent** | Internal event tracking | userId, event, properties (JSON) |
| **BlockedUser** | User blocking | blockerId, blockedId |
| **Report** | Content/user reports | reporterId, type, reason, status |
| **WaitlistEntry** | Pre-launch signups | email, source, referralCode |

---

## Project Structure

```
sotd/
├── app/                          # Next.js App Router
│   ├── api/                      # ~40+ API route groups
│   │   ├── entries/              # Entry CRUD
│   │   ├── songs/                # Spotify search
│   │   ├── analytics/            # Analytics endpoints
│   │   ├── feed/                 # Social feed
│   │   ├── friends/              # Friend system
│   │   ├── notifications/        # Notifications
│   │   ├── on-this-day/          # Memory feature
│   │   ├── wrapped/              # Year-end summary
│   │   ├── streak/               # Streak management
│   │   ├── aviary/               # Bird unlocks
│   │   ├── stripe/               # Payment webhooks
│   │   ├── checkout/             # Stripe checkout
│   │   ├── comments/             # Comments
│   │   ├── vibes/                # Vibes/reactions
│   │   ├── invites/              # Invite system
│   │   ├── reports/              # Reporting
│   │   ├── admin/                # Admin endpoints
│   │   ├── webhooks/             # External webhooks
│   │   └── ... (40+ route groups)
│   ├── home/                     # Landing page
│   ├── sign-in/                  # Clerk auth
│   ├── sign-up/                  # Clerk auth
│   ├── welcome/                  # Onboarding
│   ├── archive/                  # Full entry archive
│   ├── profile/                  # Profile pages
│   ├── user/[username]/          # Public profiles
│   ├── aviary/                   # Bird collection page
│   ├── checkout/                 # Payment flow
│   ├── settings/                 # User settings
│   ├── join/                     # Invite acceptance
│   ├── waitlist/                 # Waitlist page
│   ├── privacy/, terms/, refund/ # Legal pages
│   ├── layout.tsx                # Root layout (ClerkProvider, fonts)
│   ├── globals.css               # Global styles + animations
│   └── songbird.css              # Design system CSS variables
│
├── components/                   # React components
│   ├── Dashboard.tsx             # Main dashboard with tab navigation
│   ├── TodayTab.tsx              # Today's entry view
│   ├── AddEntryTab.tsx           # Add/edit entry form
│   ├── FeedTab.tsx               # Social feed
│   ├── MemoryTab.tsx             # "On This Day" + recent history
│   ├── AnalyticsTab.tsx          # Analytics dashboard
│   ├── WrappedTab.tsx            # Year-end summary
│   ├── LeaderboardTab.tsx        # Streak leaderboard
│   ├── ProfileTab.tsx            # User profile
│   ├── FriendsTab.tsx            # Friends management
│   ├── AviaryTab.tsx             # Bird collection
│   ├── Navigation.tsx            # Top + bottom nav
│   ├── Notifications.tsx         # Notification center
│   ├── onboarding/               # 18+ onboarding screen components
│   ├── aviary/                   # Aviary sub-components
│   │   ├── Aviary.tsx
│   │   ├── AviaryBird.tsx
│   │   ├── ContactsDiscovery.tsx
│   │   ├── SuggestedUsers.tsx
│   │   └── SongPreviewModal.tsx
│   └── ... (30+ components total)
│
├── lib/                          # Utilities & business logic
│   ├── supabase.ts               # Supabase client setup
│   ├── db.ts                     # Database helper functions
│   ├── clerk-sync.ts             # Clerk ↔ DB user sync
│   ├── spotify.ts                # Spotify API client + token refresh
│   ├── friends.ts                # Friend utilities
│   ├── streak.ts                 # Streak calculation logic
│   ├── birds.ts                  # Bird unlock system (~500 lines)
│   ├── premium.ts                # Premium status checks
│   ├── paywall.ts                # Freemium limit enforcement
│   ├── stripe.ts                 # Stripe client setup
│   ├── analytics.ts              # Server-side event tracking
│   ├── analytics-client.ts       # Client-side event tracking
│   ├── push.ts                   # Push notification sending
│   ├── rate-limit.ts             # API rate limiting
│   ├── blocking.ts               # User blocking logic
│   ├── email.ts                  # Email utilities
│   ├── theme.tsx                 # Theme/bird theme definitions
│   ├── date-utils.ts             # Date helpers
│   └── notification-helpers.ts   # Notification utilities
│
├── mobile/                       # Expo React Native app
│   ├── app/
│   │   ├── _layout.tsx           # Root layout (ClerkProvider)
│   │   ├── index.tsx             # Entry point / auth check
│   │   ├── home.tsx              # Pre-auth home screen
│   │   ├── welcome/              # Onboarding screens
│   │   ├── join/[code].tsx       # Invite deep link
│   │   └── (tabs)/              # Main tab navigation
│   │       ├── index.tsx         # Today tab
│   │       ├── memory.tsx        # Memory tab
│   │       ├── feed.tsx          # Feed tab
│   │       ├── aviary.tsx        # Aviary tab
│   │       ├── insights.tsx      # Insights tab
│   │       └── profile.tsx       # Profile tab
│   ├── components/
│   │   └── onboarding/           # 7 onboarding screen components
│   ├── lib/
│   │   ├── api.ts                # API client (calls web app endpoints)
│   │   ├── theme.ts              # Color/spacing/typography tokens
│   │   └── useWarmUpBrowser.ts   # Auth browser warmup
│   └── app.json                  # Expo config (bundle ID: com.songbird.app)
│
├── scripts/                      # Migration & utility scripts (~30 files)
├── remotion/                     # Remotion video generation
├── prisma/schema.prisma          # DB schema (reference, not used at runtime)
├── docs/                         # ~30+ documentation files
└── public/                       # Static assets (logos, videos, manifest)
```

---

## Design System

### Color Palette (Dark Theme)
| Token | Value | Description |
|-------|-------|-------------|
| `--bg` | `#1a1816` | Deep warm charcoal background |
| `--surface` | `#2f2a26` | Elevated panels/cards |
| `--text` | `#E3E1DB` | Feather cream (warm off-white) |
| `--muted` | `#9A9D9A` | Secondary text |
| `--accent` | `#B65A2A` | Deep rust orange (robin's chest) — signature color |
| `--accent-soft` | `#C96A3A` | Lighter accent for hovers |
| `--border` | `rgba(227,225,219,0.1)` | Subtle borders |

### Typography
- **Headings**: Crimson Text (serif — warm, journal-like)
- **Body**: Inter (sans-serif — clean, modern)
- Scale: 12px → 32px

### Spacing
- Small: 12px, Medium: 20px, Large: 32px
- Border radius: 8px (small), 16px (large)

### Animations (Implemented)
- Slide in/out (left/right), fade-in, count-up, fly-away, bounce
- Bird logo bounce on Today tab

---

## Competitive Landscape

### Direct Competitors (Music Logging)
- **Last.fm** — Automatic scrobbling, no journaling
- **Stats.fm** — Spotify stats visualization, no daily ritual
- **Receiptify** — One-time shareable image, no ongoing engagement

### Adjacent Competitors (Journaling)
- **Day One** — Premium journaling with "On This Day", $35/year
- **Daylio** — Micro-journaling with mood + activities, $36/year
- **Finch** — Gamified self-care with pet bird, emotional attachment

### SongBird's Unique Position
**No app combines:**
1. Daily music ritual (intentional, not passive)
2. Life context (notes, people, memories)
3. Long-term memory value ("On This Day")
4. Private-first social sharing
5. Gamification via collectible bird avatars

---

## Monetization

### Current Pricing
- **Free Tier**: 30 entries/month, 20 friends, 30-day history, basic analytics
- **Premium (SongBird Plus)**: Unlimited everything + Wrapped + all birds + data export
- **Founding Flock**: Special early supporter pricing (limited slots via Stripe)

### Revenue Goals
- Price point in ~$3/month or $24/year range (impulse-buy territory, cheaper than Day One/Daylio)

---

## Current State & Known Issues

### What's Working Well ✅
- Core entry logging flow
- Spotify search integration
- Full auth flow (Clerk)
- Social features (friends, feed, vibes, comments)
- "On This Day" memories
- Analytics with podium-style rankings
- Streak system with freeze/restore
- Bird avatar unlock system
- Stripe payment integration
- Push notifications
- Comprehensive onboarding flow (18 screens)

### Known Gaps & Areas for Improvement
- **Mobile app is scaffolded but mostly placeholder screens** — needs full implementation
- **Design system inconsistency** — some components use old color variables, needs migration to `songbird.css`
- **No skeleton loaders** — loading states are text-only ("Loading...")
- **Desktop experience** — no sidebar navigation, bottom nav only
- **No data export** — premium feature promised but not implemented
- **No Apple Music support** — Spotify only
- **No playlist generation** — planned but not built
- **B-sides feature** — planned (additional songs beyond main SOTD) but not built
- **Mood/vibe emoji tags on entries** — planned but not built
- **No charts/graphs** — analytics are list/podium based, no visual charts
- **Page transitions** — mostly instant, no smooth animations between views
- **Tailwind config** doesn't fully match the design system CSS variables
- **Mobile theme colors** differ from web (mobile uses `#0a0a0f` bg, `#e94560` accent vs web's `#1a1816` bg, `#B65A2A` accent)

---

## Key Technical Patterns

### Auth Pattern
```
Server-side: auth() from @clerk/nextjs/server → get clerkId → look up DB user
Client-side: useUser() from @clerk/nextjs → pass to API calls
Mobile: Clerk Expo → Bearer token → same API endpoints
```

### Database Pattern
```
Supabase JS client (NOT Prisma at runtime)
- lib/supabase.ts → getSupabase() 
- lib/clerk-sync.ts → maps Clerk IDs to DB user IDs
- Always use select() to limit fields
- Never fetch images in bulk queries
```

### API Route Pattern
```typescript
// app/api/[route]/route.ts
import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

export async function GET() {
  const { userId: clerkUserId } = await auth()
  if (!clerkUserId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  // ... business logic
  return NextResponse.json({ data })
}
```

### Component Pattern
```
Loading → Content → Empty State (in that order, never show empty while loading)
```

---

## Environment Variables Needed
- `DATABASE_URL` — PostgreSQL connection string (Supabase)
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` — Clerk public key
- `CLERK_SECRET_KEY` — Clerk secret key
- `SPOTIPY_CLIENT_ID` — Spotify API client ID
- `SPOTIPY_CLIENT_SECRET` — Spotify API client secret
- `STRIPE_SECRET_KEY` — Stripe secret key
- `STRIPE_WEBHOOK_SECRET` — Stripe webhook signing secret
- `VAPID_PUBLIC_KEY` / `VAPID_PRIVATE_KEY` — Push notification keys

---

## What I Want Help With

I'm looking for a thought partner who can help me:

1. **Prioritize** — What should I build/fix next given limited time as a solo founder?
2. **Product strategy** — How to position, price, and grow SongBird
3. **User acquisition** — How to get from 10 test users to 1,000+ real users
4. **Technical decisions** — Architecture choices, what to build native vs web, performance
5. **Design improvements** — Making the app feel more polished and delightful
6. **Feature brainstorming** — What features would make users love this and tell their friends?
7. **Monetization** — Is the freemium model right? Pricing? What should be gated?
8. **Mobile strategy** — Should I go full native (Expo), keep PWA, or both?
9. **Launch strategy** — App Store readiness, marketing, community building
10. **Retention** — How to make this a daily habit that sticks

Feel free to ask me clarifying questions. I'm open to being challenged on any decisions I've made so far.

---

*Last updated: February 2026*
*~1,400 entries of personal data, MVP web app live, mobile app in progress*


