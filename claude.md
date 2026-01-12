# SongBird (SOTD) - Complete Reference Guide

**Comprehensive documentation for business strategy, technical implementation, and project context.**

---

## Table of Contents

1. [Business Strategy & Product Context](#business-strategy--product-context)
2. [Technical Implementation](#technical-implementation)
3. [Current Status & Critical Issues](#current-status--critical-issues)
4. [Development Guidelines](#development-guidelines)
5. [Feature Roadmap](#feature-roadmap)
6. [Monetization Strategy](#monetization-strategy)
7. [Metrics & KPIs](#metrics--kpis)

---

# Business Strategy & Product Context

## Product Overview

**SongBird** is a "Song of the Day" journaling app that lets users:
- Log one song per day that represents their day
- Add notes/memories to each entry
- Tag people they were with (both app users and non-users)
- View "On This Day" memories from past years
- See analytics (top artists, songs, people)
- Share entries with friends (private, not public)
- Get a "Wrapped" year-end summary (like Spotify Wrapped)

### Core Value Proposition
**"Remember your life through music"** — SongBird connects songs to life moments, creating a musical autobiography over time.

### Founder Context
- Solo founder, side project (not full-time)
- Bootstrap budget (minimal spending)
- Technical (using Cursor/AI for development)
- No design skills (relying on AI-generated assets)
- Has 4.5 years of personal data (~1,400 entries)

### Current Status
- MVP built but auth is broken (being fixed)
- Has 4.5 years of founder's personal data (~1,400 entries)
- No external users yet
- **Goal: 10 test users (friends/family) in 2 weeks**
- Long-term: App Store launch

---

## Competitive Landscape

### Direct Competitors (Music Logging)
- **Last.fm**: Automatic scrobbling, no journaling, decades of history
- **Stats.fm**: Spotify stats visualization, no daily ritual
- **Receiptify**: One-time shareable image, no ongoing engagement

### Adjacent Competitors (Journaling)
- **Day One**: Premium journaling, "On This Day" feature, $35/year
- **Daylio**: Micro-journaling with mood + activities, $36/year
- **Finch**: Gamified self-care with pet bird, emotional attachment

### Adjacent Competitors (Music Social)
- **Spotify**: Has social features but they're weak
- **Apple Music**: Minimal social
- **Discord music bots**: Community sharing

### SongBird's Unique Position
No app combines:
1. Daily music ritual (intentional, not passive)
2. Life context (notes, people, memories)
3. Long-term memory value ("On This Day")
4. Private-first social sharing

---

## Planned Features

### Confirmed for Development
1. **Mood/vibe emoji tags** — Capture emotional context (😊😢🔥🌙💭❤️)
2. **B-sides** — Add additional songs beyond main SOTD
3. **Streaks** — Gentle gamification for consistency
4. **Playlist generation** — Create Spotify playlists from entries
5. **Notifications** — "On This Day" reminders, streak nudges
6. **Shareable Wrapped** — Instagram-ready year-end summaries

### Future Considerations
- Customizable bird avatar (visual personalization)
- "Chirp" — AI-generated audio signature based on music taste
- Apple Music integration
- Premium tier with advanced features

---

# Technical Implementation

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: Clerk (migrating from NextAuth)
- **Styling**: Tailwind CSS
- **Hosting**: Vercel
- **Music API**: Spotify Web API

## Project Structure

```
sotd/
├── app/
│   ├── api/              # API routes
│   │   ├── entries/      # Entry CRUD operations
│   │   ├── songs/        # Spotify search
│   │   ├── analytics/    # Analytics endpoints
│   │   ├── feed/         # Social feed
│   │   ├── friends/      # Friend system
│   │   ├── notifications/# Notifications
│   │   ├── on-this-day/  # Memory feature
│   │   ├── wrapped/      # Year-end summary
│   │   └── users/        # User profiles
│   ├── home/             # Home screen with logo
│   ├── sign-in/          # Clerk sign-in
│   ├── sign-up/          # Clerk sign-up
│   ├── archive/          # Archive page
│   ├── profile/          # Profile pages
│   ├── user/[username]/  # User profile pages
│   ├── layout.tsx        # Root layout (ClerkProvider)
│   └── page.tsx          # Dashboard redirect
├── components/
│   ├── Dashboard.tsx     # Main dashboard with tabs
│   ├── TodayTab.tsx      # Today's entry
│   ├── AddEntryTab.tsx   # Add new entry
│   ├── FeedTab.tsx       # Social feed
│   ├── HistoryTab.tsx    # Entry history
│   ├── MemoryTab.tsx     # "On This Day" memories
│   ├── AnalyticsTab.tsx  # Analytics dashboard
│   ├── WrappedTab.tsx    # Year-end summary
│   ├── LeaderboardTab.tsx # Streaks leaderboard
│   ├── ProfileTab.tsx    # User profile
│   ├── FriendsTab.tsx    # Friends management
│   ├── Notifications.tsx # Notifications
│   └── Navigation.tsx    # Navigation component
├── lib/
│   ├── prisma.ts         # Prisma client
│   ├── auth.ts           # NextAuth config (legacy, to be removed)
│   ├── spotify.ts        # Spotify API client
│   └── friends.ts        # Friend utilities
├── prisma/
│   └── schema.prisma     # Database schema
└── scripts/              # Migration and utility scripts
```

## Database Schema

### Core Models

**User**
- `id` (String, cuid)
- `email` (String, unique)
- `name`, `username` (String, optional)
- `clerkId` (String, unique) - Clerk authentication ID
- `password` (String, optional) - Legacy NextAuth
- `image`, `bio` (String, optional)
- `favoriteArtists`, `favoriteSongs` (JSON strings)
- Relations: entries, taggedEntries, mentions, notifications, personReferences, friendRequests

**Entry**
- `id` (String, cuid)
- `date` (DateTime)
- `userId` (String, foreign key)
- Song metadata: `songTitle`, `artist`, `albumTitle`, `albumArt`, `trackId`, `uri`
- Track info: `durationMs`, `explicit`, `popularity`, `releaseDate`
- `notes` (String, optional)
- Relations: user, tags, mentions, people
- Unique constraint: `[userId, date]` (one entry per user per day)
- Index: `[userId, date]` for performance

**EntryTag**
- Links entries to users (tagging system)
- Unique constraint: `[entryId, userId]`

**FriendRequest**
- Two-way friendship system
- Status: "pending", "accepted", "declined"
- Unique constraint: `[senderId, receiverId]`

**Mention**
- Explicit social mentions (separate from private tags)
- Unique constraint: `[entryId, userId]`

**Notification**
- Types: "mention", "friend_request_accepted"
- `read` boolean flag

**PersonReference**
- Tag people who may or may not be on the app
- Separate from EntryTag (app users) and Mention (social)
- `name` (String) - person's name
- `userId` (String, optional) - link if person has account

---

# Current Status & Critical Issues

## ✅ What's Working

- Core functionality (add entries, view history, analytics)
- Database schema and Prisma setup
- API routes structure
- Basic UI/UX
- Home screen with logo
- Clerk installation and basic setup
- Middleware updated for Clerk
- Layout wrapped with ClerkProvider

## ⚠️ Critical Issues

### 1. Authentication Migration (IN PROGRESS)

**Status**: Partially migrated from NextAuth to Clerk

**What's Done**:
- ✅ Clerk package installed
- ✅ Home screen created (`/home` with logo)
- ✅ Sign-in/Sign-up pages created (`/sign-in`, `/sign-up`)
- ✅ Middleware updated for Clerk
- ✅ `app/page.tsx` updated to use Clerk auth
- ✅ `app/layout.tsx` wrapped with ClerkProvider

**What's NOT Done** (CRITICAL):
- ❌ All components still use `useSession` from NextAuth (needs `useUser()` from Clerk)
- ❌ All API routes still use `getServerSession` (needs `auth()` from Clerk)
- ❌ User ID mapping: Clerk uses different user IDs than database
- ❌ User sync strategy not implemented (Clerk manages users separately)

**Migration Tasks**:

1. **Update Components** (11 files):
   - Find all `useSession` imports from `next-auth/react`
   - Replace with `useUser()` from `@clerk/nextjs`
   - Replace `session.user.id` with `user?.id`
   - Replace `signOut()` with `useClerk().signOut()`
   - Files: Navigation, AddEntryTab, FeedTab, AnalyticsTab, MemoryTab, HistoryTab, ProfileTab, FriendsTab, WrappedTab, Notifications, FullHistoryTab

2. **Update API Routes** (20+ files):
   - Find all `getServerSession(authOptions)` calls
   - Replace with `auth()` from `@clerk/nextjs/server`
   - Replace `session.user.id` with `userId` from `auth()`
   - Update error handling

3. **Database User Sync**:
   - Add `clerkUserId` field to User model (already exists as `clerkId`)
   - Create helper function to sync Clerk users to database
   - Handle user creation on first Clerk login

4. **Cleanup**:
   - Remove `next-auth` package
   - Delete `lib/auth.ts` (NextAuth config)
   - Delete `app/api/auth/[...nextauth]/route.ts`
   - Remove NextAuth types

### 2. Environment Variables

- Keys added to `.env` file
- Server needs restart to load new env vars
- Should use `.env.local` for local development

### 3. File Lock Issues (Windows/OneDrive)

- Project located in OneDrive folder
- Can cause file locking errors (EBUSY)
- Recommendation: Move project out of OneDrive for development

---

# Development Guidelines

## Code Style & Conventions

### TypeScript
- Use strict TypeScript typing - avoid `any` when possible
- Define interfaces for all data structures
- Use type inference where appropriate but be explicit for function parameters and returns

### React/Next.js Patterns
- Use functional components with hooks
- Prefer `'use client'` directive for client components
- Use Server Components by default (no directive)
- Always handle loading states before showing "no data" messages
- Use proper error boundaries and error handling

### File Structure
- API routes: `app/api/[route]/route.ts`
- Components: `components/[ComponentName].tsx`
- Pages: `app/[route]/page.tsx`
- Utilities: `lib/[utility].ts`
- Database schema: `prisma/schema.prisma`

### Database Patterns
- Use Prisma for all database operations
- Always use `select` or `include` to limit fields (never fetch all fields)
- Use indexes for frequently queried fields (userId, date combinations)
- Handle connection pooling properly for Vercel serverless
- Never fetch base64 images in bulk queries (use `excludeImages=true`)

### API Route Patterns
- Always check authentication with `auth()` from `@clerk/nextjs/server` (after migration)
- Return proper HTTP status codes
- Use NextResponse.json for responses
- Handle errors gracefully with try/catch
- Limit response sizes for performance

### Performance Guidelines
- Always show loading states instead of "no data" while fetching
- Use pagination for large datasets (pageSize: 100-1000 depending on data)
- Avoid unnecessary count queries - use length checks instead
- Optimize images (Next.js Image component, exclude when not needed)
- Use database indexes for common query patterns

### Component Patterns
- Loading states should appear BEFORE empty states
- Check `loading` state before checking data length
- Use consistent loading messages: "Loading...", "Loading [resource]..."
- Empty states should only show when `!loading && data.length === 0`

### UI/UX Guidelines
- Use consistent color scheme: `bg-bg`, `text-text`, `bg-surface`, `text-accent`
- Loading indicators: Use `animate-pulse` or loading spinners
- Error messages: Clear, user-friendly, with actionable suggestions
- Responsive design: Mobile-first, use `sm:`, `md:` breakpoints

### Common Patterns

**Entry Fetching**:
```typescript
const [entries, setEntries] = useState<Entry[]>([])
const [loading, setLoading] = useState(false)

const fetchEntries = async () => {
  setLoading(true)
  try {
    const res = await fetch('/api/entries')
    const data = await res.json()
    if (res.ok) {
      setEntries(data.entries)
    }
  } catch (error) {
    console.error('Error:', error)
  } finally {
    setLoading(false)
  }
}
```

**Loading State Pattern**:
```typescript
{loading ? (
  <div>Loading...</div>
) : entries.length > 0 ? (
  <div>{/* Show entries */}</div>
) : (
  <div>No entries found</div>
)}
```

## Agent Instructions by Task Type

### 🔐 Authentication Migration Agent

**Your Goal**: Complete the migration from NextAuth to Clerk

**Key Files**:
- `components/*.tsx` - All components using `useSession`
- `app/api/**/route.ts` - All API routes using `getServerSession`
- `prisma/schema.prisma` - Already has `clerkId` field
- `types/next-auth.d.ts` - Can remove after migration

**Reference**:
- Clerk docs: https://clerk.com/docs
- Use `useUser()` hook for client components
- Use `auth()` function for server components/API routes

### 🎨 Design & Layout Improvement Agent

**Your Goal**: Improve visual design, layout, and user experience

**Current State**:
- Basic Tailwind CSS styling
- Functional but could be more polished
- Some inconsistencies in spacing/layout
- Mobile responsiveness needs improvement

**Key Areas**:
- Home screen (`app/home/page.tsx`)
- Dashboard (`components/Dashboard.tsx`)
- Entry cards/displays
- Forms (Add Entry)
- Analytics/Charts
- Archive/History lists
- Navigation

**Constraints**:
- Must use Tailwind CSS only
- Follow existing color scheme (or improve it systematically)
- Maintain accessibility
- Keep performance in mind
- No breaking changes to functionality

### ⚙️ Backend Improvement Agent

**Your Goal**: Optimize backend, improve performance, enhance code quality

**Current State**:
- API routes working but could be optimized
- Database queries functional but some could be improved
- Error handling basic
- No caching strategy

**Key Files**:
- `app/api/**/route.ts` - All API routes
- `lib/prisma.ts` - Prisma client setup
- `prisma/schema.prisma` - Database schema

**Constraints**:
- Must use Prisma for database operations
- Keep Vercel serverless limits in mind
- Maintain type safety
- Don't break existing functionality
- Follow existing patterns where reasonable

### 💡 Brainstorming Agent

**Your Goal**: Generate creative improvement ideas and feature suggestions

**Focus Areas**:
1. New Features (music-related, social, analytics, integrations)
2. User Experience (workflow improvements, pain points, engagement)
3. Technical Improvements (architecture, performance, scalability)
4. Business/Product (monetization, growth, retention, competitive advantages)

---

# Feature Roadmap

## Phase 1: Complete Authentication Migration
**Priority**: 🔴 CRITICAL

- Update all components to use Clerk
- Update all API routes to use Clerk
- Implement user sync strategy
- Remove NextAuth dependencies
- Test authentication flow

## Phase 2: Improve Design & Layout
**Priority**: 🟡 Medium

- Standardize spacing/padding
- Consistent button styles
- Uniform card/container designs
- Better mobile responsiveness
- Improved loading/empty states
- Better typography hierarchy

## Phase 3: Backend Improvements
**Priority**: 🟡 Medium

- Optimize database queries
- Better error handling
- Input validation (expand Zod usage)
- Response size optimization
- Better pagination
- Consider caching strategies

## Phase 4: Planned Features
**Priority**: 🟢 Low-Medium

1. **Mood/vibe emoji tags** — Capture emotional context
2. **B-sides** — Add additional songs beyond main SOTD
3. **Streaks** — Gentle gamification for consistency
4. **Playlist generation** — Create Spotify playlists from entries
5. **Notifications** — "On This Day" reminders, streak nudges
6. **Shareable Wrapped** — Instagram-ready year-end summaries

## Phase 5: Future Considerations
**Priority**: 🟢 Low

- Customizable bird avatar
- "Chirp" — AI-generated audio signature
- Apple Music integration
- Premium tier features
- Export data functionality
- Mobile app (iOS/Android)

---

# Monetization Strategy

## Proposed Model: Freemium

### Free Tier
- 30 entries per month
- Basic analytics
- Friend sharing
- "On This Day" memories

### Pro Tier ($3/month or $24/year)
- Unlimited entries
- Full analytics history
- Wrapped feature
- Playlist generation
- Custom themes (future)
- Data export
- Priority support
- Advanced features (B-sides, mood tags, etc.)

### Pricing Rationale
- Lower than Day One ($35/yr) and Daylio ($36/yr)
- Accessible for casual users
- Annual discount encourages commitment
- $3/month is impulse-buy territory

---

# Metrics & KPIs

## Engagement Metrics
- **DAU/MAU ratio** (target: 20%+ for daily habit app)
- **Entries per user per month**
- **Streak length distribution**
- **"On This Day" view rate**
- **Friend interaction rate**

## Retention Metrics
- **D1, D7, D30 retention**
- **Churn rate** (monthly)
- **Reactivation rate**
- **Weekly active users**

## Growth Metrics
- **Organic signups**
- **Referral rate** (users inviting friends)
- **Wrapped share rate** (viral coefficient)
- **App Store ranking** (when launched)

## Monetization Metrics (Future)
- **Free to paid conversion rate**
- **ARPU** (average revenue per user)
- **LTV** (lifetime value)
- **CAC** (customer acquisition cost)
- **MRR** (monthly recurring revenue)

---

# Business Advisor Role

## Your Role as Strategic Advisor

When advising on SongBird, you should:

1. **Challenge assumptions** — Ask "why" and "how do you know"
2. **Provide frameworks** — Give structured ways to think about problems
3. **Share relevant examples** — Reference what worked for similar apps
4. **Prioritize ruthlessly** — Solo founder = limited bandwidth
5. **Be honest about risks** — Don't sugarcoat challenges
6. **Give actionable next steps** — Not just strategy, but tactics

## Topics You Can Advise On

- Feature prioritization
- Pricing strategy
- User acquisition tactics
- Retention optimization
- Competitive positioning
- Launch strategy
- Investor readiness (if applicable)
- Metrics and analytics
- Community building
- App Store optimization
- Marketing messaging

## Example Interaction

**Founder:** Should I add Apple Music support before launch or focus on Spotify only?

**Advisor:** Let's think through this strategically.

**Market share:** Spotify has ~30% of streaming market, Apple Music ~15%. But the overlap between "people who journal" and "Apple Music users" might be different from general population.

**Development cost:** Adding Apple Music means:
- New API integration
- Testing on both platforms
- Maintaining two codebases for music features
- Potential edge cases (what if someone switches services?)

**My recommendation:** Spotify-only for launch. Here's why:
1. You're a solo founder — focus beats breadth
2. Your 10 test users probably use Spotify (ask them)
3. Apple Music can be a "Pro" feature later
4. Better to nail one integration than have two mediocre ones

**What to do instead:** Add a "request Apple Music" button that logs interest. If 30%+ of users click it, prioritize it.

---

# Quick Reference

## Key Technologies
- Next.js 16 (App Router)
- TypeScript
- Prisma ORM
- PostgreSQL
- Clerk (auth)
- Tailwind CSS
- Spotify API

## Important Paths
- Components: `components/*.tsx`
- API Routes: `app/api/**/route.ts`
- Pages: `app/**/page.tsx`
- Database: `prisma/schema.prisma`
- Styles: `app/globals.css`, `tailwind.config.js`

## Environment Variables
- Clerk keys needed for auth
- Database URL for Prisma
- Spotify API keys
- See `.env` or `.env.local`

## Common Patterns
- Server Components by default
- 'use client' for client components
- API routes in `app/api`
- Prisma for all database access
- Tailwind for styling

## Getting Started Checklist

Before starting work:
- [ ] Understand the current state
- [ ] Check authentication migration status
- [ ] Review relevant files
- [ ] Understand the tech stack
- [ ] Test current functionality
- [ ] Make a plan
- [ ] Start with small changes
- [ ] Test thoroughly
- [ ] Document changes

---

# Next Steps Summary

1. **IMMEDIATE** (Before anything else):
   - Complete Clerk authentication migration
   - Update all components and API routes
   - Test authentication flow
   - Remove NextAuth dependencies

2. **SHORT TERM** (After auth works):
   - Improve design and layout
   - Fix any remaining bugs
   - Optimize performance
   - Get 10 test users

3. **MEDIUM TERM**:
   - Backend improvements
   - Feature enhancements (mood tags, B-sides, streaks)
   - User experience improvements
   - Launch preparation

4. **LONG TERM**:
   - New features (playlist generation, notifications)
   - Integrations (Apple Music)
   - App Store launch
   - Scaling considerations
   - Monetization implementation

---

**Last Updated**: Based on current codebase state and business consultant prompt
**Version**: 1.0


