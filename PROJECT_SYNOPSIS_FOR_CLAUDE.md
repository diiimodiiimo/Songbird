# SongBird (SOTD) - Project Synopsis & Action Plan

## Project Overview

**SongBird** is a Next.js 14+ application for tracking "Song of the Day" entries - a personal music journal with social features. Users can log daily songs, add notes, track analytics, and share with friends.

### Core Features:
- 🎵 **Daily Song Tracking**: Search and add songs from Spotify
- 📝 **Music Journal**: Add notes and memories to each entry
- 👥 **Social Features**: Tag friends, mention users, friend system
- 📊 **Analytics**: Top artists, songs, streaks, wrapped/year-in-review
- 📅 **Memory/Archive**: "On This Day" feature, full archive with search
- 🔐 **Authentication**: Currently migrating from NextAuth to Clerk

### Tech Stack:
- **Framework**: Next.js 14+ (App Router)
- **Language**: TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: Migrating to Clerk (from NextAuth)
- **Styling**: Tailwind CSS
- **Hosting**: Vercel
- **Music API**: Spotify Web API

---

## Current Status & Issues

### ✅ What's Working:
- Core functionality (add entries, view history, analytics)
- Database schema and Prisma setup
- API routes structure
- Basic UI/UX
- Home screen with logo (newly added)
- Clerk installation and basic setup

### ⚠️ Current Issues:

#### 1. **Authentication Migration (In Progress)**
- **Status**: Partially migrated from NextAuth to Clerk
- **What's Done**:
  - Clerk package installed
  - Home screen created (`/home` with logo)
  - Sign-in/Sign-up pages created (`/sign-in`, `/sign-up`)
  - Middleware updated for Clerk
  - `app/page.tsx` updated to use Clerk auth
  - `app/layout.tsx` wrapped with ClerkProvider
  
- **What's NOT Done** (CRITICAL):
  - ❌ All components still use `useSession` from NextAuth (needs `useUser()` from Clerk)
  - ❌ All API routes still use `getServerSession` (needs `auth()` from Clerk)
  - ❌ User ID mapping: Clerk uses different user IDs than database
  - ❌ User sync strategy not implemented (Clerk manages users separately)

- **Current Error**: "Missing publishableKey" - Environment variables need server restart OR keys in `.env.local`

#### 2. **Environment Variables**
- Keys added to `.env` file
- Server needs restart to load new env vars
- Should use `.env.local` for local development (but `.env` works too)

#### 3. **File Lock Issues (Windows/OneDrive)**
- Project located in OneDrive folder (`OneDrive\Pictures\Screenshots 1\sotd`)
- Can cause file locking errors (EBUSY)
- Recommendation: Move project out of OneDrive for development

---

## Action Plan for Claude Agents

### Phase 1: Complete Authentication Migration

**Priority**: 🔴 CRITICAL (App won't work until this is done)

**Tasks**:
1. Update all components to use Clerk instead of NextAuth:
   - Replace `useSession()` with `useUser()` and `useClerk()` from `@clerk/nextjs`
   - Update `components/Navigation.tsx`
   - Update all tab components (AddEntryTab, FeedTab, AnalyticsTab, etc.)
   - Update all components using session data

2. Update all API routes:
   - Replace `getServerSession(authOptions)` with `auth()` from `@clerk/nextjs/server`
   - Update user ID references (Clerk user IDs are different)
   - Create user sync strategy (link Clerk users to database users)

3. Database user sync:
   - Option A: Add `clerkUserId` field to User model
   - Option B: Create sync table mapping Clerk IDs to database IDs
   - Create migration script for existing users (if any)

4. Remove NextAuth dependencies:
   - Remove `next-auth` package
   - Remove NextAuth-related files
   - Update `app/providers.tsx` (already done)

**Files to Update** (estimated 20+ files):
- `components/*.tsx` (11 files using `useSession`)
- `app/api/**/route.ts` (20+ API routes using `getServerSession`)
- Database schema (add Clerk user ID field)

---

### Phase 2: Improve Design & Layout

**Priority**: 🟡 Medium (Can work on after auth is fixed)

**Current Design Issues**:
- Basic styling with Tailwind
- Inconsistent spacing/layouts
- Could use better visual hierarchy
- Mobile responsiveness could be improved
- Loading states inconsistent
- Empty states could be more engaging

**Areas for Improvement**:

1. **Home Screen** (`app/home/page.tsx`):
   - Already has logo, but could enhance animations
   - Better call-to-action design
   - Add preview/features section

2. **Dashboard** (`components/Dashboard.tsx`):
   - Better tab navigation design
   - Improved spacing and layout
   - Better visual feedback

3. **Entry Cards**:
   - More visually appealing entry displays
   - Better album art presentation
   - Improved typography hierarchy

4. **Analytics/Charts**:
   - Better data visualization
   - More engaging charts/graphs
   - Improved color schemes

5. **Forms** (Add Entry):
   - Better form design
   - Improved search results display
   - Better validation feedback

6. **Archive/History**:
   - Better list/table design
   - Improved filtering UI
   - Better pagination

7. **Overall**:
   - Consistent design system
   - Better color palette usage
   - Improved spacing/typography
   - Better mobile experience
   - Loading states and animations
   - Empty states design

**Key Files**:
- `app/home/page.tsx`
- `components/Dashboard.tsx`
- `components/AddEntryTab.tsx`
- `components/AnalyticsTab.tsx`
- `components/MemoryTab.tsx`
- `components/HistoryTab.tsx`
- `app/archive/page.tsx`
- `app/globals.css`
- `tailwind.config.js`

---

### Phase 3: Improve Backend

**Priority**: 🟡 Medium (Performance and reliability improvements)

**Current Backend Issues**:
- Some API routes could be optimized
- Database queries could be improved (some missing indexes)
- Error handling could be better
- API response sizes could be optimized
- Caching could be added

**Areas for Improvement**:

1. **Database Optimization**:
   - ✅ Indexes added (recently added for `[userId, date]`)
   - Review other query patterns
   - Optimize nested queries
   - Connection pooling (already handled by Prisma)

2. **API Route Improvements**:
   - Better error handling
   - Input validation (already using Zod in some routes)
   - Rate limiting (consider)
   - Response caching where appropriate
   - Better pagination
   - Optimize response payloads

3. **Performance**:
   - Reduce unnecessary database queries
   - Optimize image loading (already excluding base64 in bulk)
   - Add database query logging for optimization
   - Consider Redis caching for frequently accessed data

4. **Code Quality**:
   - Better error messages
   - Consistent error handling patterns
   - API documentation
   - Type safety improvements

**Key Files**:
- `app/api/**/route.ts` (all API routes)
- `lib/prisma.ts`
- `prisma/schema.prisma`
- Database query patterns

---

### Phase 4: Brainstorm Improvement Ideas

**Priority**: 🟢 Low (Feature ideas and enhancements)

**Ideas to Explore**:

1. **New Features**:
   - Playlist generation from entries
   - Music recommendations based on history
   - Social feed improvements
   - Notifications system (partially exists)
   - Export data (CSV, JSON)
   - Import from other platforms
   - Collaborative playlists
   - Music discovery features

2. **UI/UX Enhancements**:
   - Dark/light mode toggle
   - Customizable themes
   - Better mobile app experience (PWA?)
   - Keyboard shortcuts
   - Better search/filtering
   - Calendar view for entries
   - Timeline visualization

3. **Social Features**:
   - Better friend discovery
   - Groups/communities
   - Comments on entries
   - Reactions/likes
   - Sharing to social media

4. **Analytics**:
   - More detailed analytics
   - Custom date ranges
   - Comparison features (year over year)
   - Genre analysis
   - Mood tracking
   - Location-based insights

5. **Integration**:
   - Spotify playlist sync
   - Apple Music integration
   - Last.fm integration
   - Export to other platforms

6. **Performance**:
   - Offline support (PWA)
   - Background sync
   - Better caching strategies

---

## Instructions for Claude Agents

### For Design & Layout Improvements:

```
You are working on the SongBird (SOTD) music journal app. This is a Next.js 14+ app using Tailwind CSS.

CONTEXT:
- Users track daily songs with notes and memories
- Social features: friends, mentions, tags
- Analytics and wrapped/year-in-review features
- Currently using Tailwind CSS with custom color scheme (bg-bg, text-text, bg-surface, text-accent)

GOALS:
1. Improve visual design and consistency
2. Better mobile responsiveness
3. Enhance user experience with better layouts
4. Improve loading/empty states
5. Better typography and spacing

CONSTRAINTS:
- Must use Tailwind CSS (no additional CSS frameworks)
- Follow existing color scheme or suggest improvements
- Maintain accessibility
- Keep performance in mind

FILES TO REVIEW:
- components/*.tsx
- app/home/page.tsx
- app/globals.css
- tailwind.config.js

APPROACH:
1. Review current design patterns
2. Identify inconsistencies
3. Suggest improvements
4. Implement changes with explanations
5. Ensure mobile-first responsive design
```

### For Backend Improvements:

```
You are working on the SongBird (SOTD) music journal app backend. This is a Next.js 14+ API using Prisma with PostgreSQL.

CONTEXT:
- API routes in app/api/**/route.ts
- Database: PostgreSQL with Prisma ORM
- Authentication: Migrating to Clerk (currently in progress)
- Performance optimizations recently added (indexes, pagination)

GOALS:
1. Optimize database queries
2. Improve error handling
3. Add better validation
4. Optimize API response sizes
5. Improve code quality and consistency

CONSTRAINTS:
- Use Prisma for all database operations
- Follow existing patterns where possible
- Maintain type safety (TypeScript)
- Keep API responses under size limits (Vercel serverless)

FILES TO REVIEW:
- app/api/**/route.ts (all API routes)
- lib/prisma.ts
- prisma/schema.prisma

APPROACH:
1. Review database query patterns
2. Identify N+1 queries and optimize
3. Review error handling
4. Check input validation
5. Optimize response payloads
6. Add indexes where needed
7. Improve code consistency
```

### For Brainstorming Improvements:

```
You are brainstorming improvements for SongBird (SOTD), a music journal app.

CONTEXT:
- Users track daily songs with Spotify integration
- Social features: friends, mentions, tags
- Analytics and wrapped features
- Built with Next.js, Prisma, PostgreSQL, Clerk auth

GOALS:
1. Generate creative feature ideas
2. Suggest UX improvements
3. Propose technical enhancements
4. Consider user engagement features
5. Think about scalability and growth

CONSTRAINTS:
- Must be feasible with current tech stack
- Consider development effort vs. value
- Think about user needs and pain points
- Consider monetization possibilities (Stripe integration planned)

APPROACH:
1. Analyze current features and identify gaps
2. Think about user journeys and pain points
3. Suggest features that add value
4. Consider technical feasibility
5. Prioritize suggestions
6. Think about social/viral features
7. Consider integrations and partnerships
```

---

## Current File Structure

```
sotd/
├── app/
│   ├── api/              # API routes (needs Clerk migration)
│   ├── archive/          # Archive page (working)
│   ├── auth/             # Old NextAuth pages (can remove after migration)
│   ├── home/             # New home screen with logo
│   ├── sign-in/          # Clerk sign-in page
│   ├── sign-up/          # Clerk sign-up page
│   ├── layout.tsx        # Root layout (ClerkProvider added)
│   └── page.tsx          # Dashboard (Clerk auth, redirects to /home)
├── components/           # React components (need Clerk migration)
├── lib/
│   ├── auth.ts          # Old NextAuth config (can remove)
│   └── prisma.ts        # Prisma client
├── prisma/
│   └── schema.prisma    # Database schema (may need Clerk user ID field)
├── middleware.ts        # Clerk middleware (updated)
└── .env                 # Environment variables (Clerk keys added)
```

---

## Next Steps Summary

1. **IMMEDIATE** (Before anything else):
   - Complete Clerk authentication migration
   - Update all components and API routes
   - Test authentication flow
   - Remove NextAuth dependencies

2. **SHORT TERM** (After auth works):
   - Improve design and layout
   - Fix any remaining bugs
   - Optimize performance

3. **MEDIUM TERM**:
   - Backend improvements
   - Feature enhancements
   - User experience improvements

4. **LONG TERM**:
   - New features
   - Integrations
   - Scaling considerations

---

## Questions to Answer Before Proceeding

1. **Authentication Migration**:
   - How do we want to handle existing users? (if any)
   - User ID mapping strategy? (add clerkUserId field or sync table?)
   - Timeline for completing migration?

2. **Design Improvements**:
   - Preferred design style? (modern, minimal, colorful, etc.)
   - Any design inspiration/references?
   - Priority areas for design improvements?

3. **Backend Improvements**:
   - Any specific performance issues noticed?
   - Priority areas for optimization?
   - Any error patterns to address?

4. **Feature Ideas**:
   - What features do users request most?
   - What would make the app more engaging?
   - Monetization strategy? (affects feature priorities)



