# SongBird - Complete Documentation

**A personal music journal app for tracking "Song of the Day" with social features.**

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [Tech Stack](#tech-stack)
3. [Getting Started](#getting-started)
4. [Project Structure](#project-structure)
5. [Database Schema](#database-schema)
6. [Development Guidelines](#development-guidelines)
7. [Design System](#design-system)
8. [UI Components & Patterns](#ui-components--patterns)
9. [API Routes](#api-routes)
10. [Deployment](#deployment)
11. [Feature Roadmap](#feature-roadmap)
12. [Business Strategy](#business-strategy)
13. [Design Assets & Branding](#design-assets--branding)
14. [Troubleshooting](#troubleshooting)

---

## Project Overview

**SongBird** is a music journaling app where users:
- Log one song per day that represents their day
- Add notes/memories to each entry
- Tag people they were with (both app users and non-users)
- View "On This Day" memories from past years
- See analytics (top artists, songs, people)
- Share entries with friends (private, not public)
- Get a "Wrapped" year-end summary (like Spotify Wrapped)

### Core Value Proposition
**"Remember your life through music"** — SongBird connects songs to life moments, creating a musical autobiography over time.

### Current Features
- 🎵 **Song Search**: Search and add songs from Spotify
- 📝 **Daily Journal**: Add notes and memories to each song entry
- 📊 **Analytics**: View your top artists and songs with various time filters
- 📜 **History**: Browse historical entries and search by keywords
- 👥 **Social Features**: Tag other users, friend system, social feed
- 🔐 **Authentication**: Secure user accounts with Clerk
- 📅 **On This Day**: View memories from past years on the same date
- 🎁 **Wrapped**: Year-end summary of your music journey

---

## Tech Stack

| Category | Technology |
|----------|------------|
| **Framework** | Next.js 14+ (App Router) |
| **Language** | TypeScript |
| **Database** | PostgreSQL with Prisma ORM |
| **Authentication** | Clerk |
| **Styling** | Tailwind CSS |
| **Hosting** | Vercel |
| **Music API** | Spotify Web API |

---

## Getting Started

### Prerequisites
- Node.js 18+ and npm
- PostgreSQL database (Supabase recommended)
- Spotify Developer Account
- Clerk Account

### Installation

1. **Clone and install dependencies:**
```bash
npm install
```

2. **Set up environment variables:**

Create a `.env.local` file:
```env
# Database (Supabase PostgreSQL)
DATABASE_URL="postgresql://postgres:[PASSWORD]@db.[REF].supabase.co:5432/postgres"

# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/

# Spotify API
SPOTIPY_CLIENT_ID=your-spotify-client-id
SPOTIPY_CLIENT_SECRET=your-spotify-client-secret
```

3. **Initialize database:**
```bash
npx prisma generate
npx prisma db push
```

4. **Run development server:**
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000)

### Spotify API Setup
1. Go to [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
2. Create a new app
3. Copy Client ID and Client Secret
4. Add credentials to `.env.local`

### Environment Variables Note
**IMPORTANT:** Always restart the dev server after adding/changing environment variables!
```bash
# Stop server with Ctrl+C, then:
npm run dev
```

---

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
│   ├── home/             # Landing page
│   ├── sign-in/          # Clerk sign-in
│   ├── sign-up/          # Clerk sign-up
│   ├── archive/          # Full archive
│   ├── profile/          # Profile pages
│   ├── user/[username]/  # Public profiles
│   ├── layout.tsx        # Root layout (ClerkProvider)
│   ├── page.tsx          # Dashboard
│   ├── globals.css       # Global styles
│   └── songbird.css      # Design system
├── components/
│   ├── Dashboard.tsx     # Main dashboard with tabs
│   ├── TodayTab.tsx      # Today's entry view
│   ├── AddEntryTab.tsx   # Add new entry form
│   ├── FeedTab.tsx       # Social feed
│   ├── HistoryTab.tsx    # Entry history
│   ├── MemoryTab.tsx     # "On This Day" memories
│   ├── AnalyticsTab.tsx  # Analytics dashboard
│   ├── WrappedTab.tsx    # Year-end summary
│   ├── LeaderboardTab.tsx# Streaks leaderboard
│   ├── ProfileTab.tsx    # User profile
│   ├── FriendsTab.tsx    # Friends management
│   ├── Notifications.tsx # Notifications
│   └── Navigation.tsx    # Navigation component
├── lib/
│   ├── prisma.ts         # Prisma client
│   ├── clerk-sync.ts     # Clerk user sync
│   ├── spotify.ts        # Spotify API client
│   └── friends.ts        # Friend utilities
├── prisma/
│   └── schema.prisma     # Database schema
├── public/               # Static assets
│   └── icons/            # Logo and icons
└── types/                # TypeScript types
```

---

## Database Schema

### Core Models

**User**
- `id` (String, cuid) - Primary key
- `email` (String, unique)
- `name`, `username` (String, optional)
- `clerkId` (String, unique) - Clerk authentication ID
- `image`, `bio` (String, optional)
- `favoriteArtists`, `favoriteSongs` (JSON strings)
- Relations: entries, taggedEntries, mentions, notifications, friendRequests

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

**FriendRequest**
- Two-way friendship system
- Status: "pending", "accepted", "declined"
- Unique constraint: `[senderId, receiverId]`

**Mention**
- Social mentions in entries
- Unique constraint: `[entryId, userId]`

**Notification**
- Types: "mention", "friend_request_accepted"
- `read` boolean flag

**PersonReference**
- Tag people who may or may not be on the app
- `name` (String) - person's name
- `userId` (String, optional) - link if person has account

---

## Development Guidelines

### TypeScript
- Use strict TypeScript typing - avoid `any` when possible
- Define interfaces for all data structures
- Use type inference where appropriate but be explicit for function parameters and returns

### React/Next.js Patterns
- Use functional components with hooks
- Prefer `'use client'` directive for client components
- Use Server Components by default (no directive)
- Always handle loading states before showing "no data" messages

### Component Pattern
```typescript
'use client'

import { useUser } from '@clerk/nextjs'

export default function MyComponent() {
  const { user, isLoaded, isSignedIn } = useUser()
  
  if (!isLoaded) return <div>Loading...</div>
  if (!isSignedIn) return null
  
  // Component logic
}
```

### API Route Pattern
```typescript
import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { userId } = await auth()
  
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  // API logic with userId
}
```

### Database Patterns
- Use Prisma for all database operations
- Always use `select` or `include` to limit fields
- Use indexes for frequently queried fields
- Never fetch base64 images in bulk queries (use `excludeImages=true`)

### Loading State Pattern
```typescript
{loading ? (
  <div>Loading...</div>
) : entries.length > 0 ? (
  <div>{/* Show entries */}</div>
) : (
  <div>No entries found</div>
)}
```

### Performance Guidelines
- Always show loading states instead of "no data" while fetching
- Use pagination for large datasets (pageSize: 100-1000)
- Avoid unnecessary count queries - use length checks instead
- Optimize images (Next.js Image component)

---

## Design System

### Design Philosophy
**"A robin on a branch at dawn: warm chest, cool surroundings, attentive, personal."**

### Core Principles
1. **Content First**: Music and memories are the hero
2. **Minimal but Meaningful**: Every element serves a purpose
3. **Mobile-First**: Optimized for daily mobile use
4. **Accessible**: Clear contrast, readable fonts
5. **Emotional**: Design enhances the connection to music

### Color Palette

| Token | Value | Description |
|-------|-------|-------------|
| `--bg` | `#1a1816` | Deep charcoal - main background |
| `--surface` | `#2f2a26` | Warm gray - cards/panels |
| `--text` | `#E3E1DB` | Feather cream - primary text |
| `--muted` | `#9A9D9A` | Soft ash gray - secondary text |
| `--accent` | `#B65A2A` | Deep rust orange - CTAs, highlights |
| `--accent-soft` | `#C96A3A` | Soft burnt orange - hover states |
| `--border` | `rgba(227, 225, 219, 0.1)` | Subtle borders |

### Typography

**Primary Font (Body):** Inter
- Clean, modern, highly readable

**Secondary Font (Headings):** Crimson Text
- Elegant serif for warmth and personality

**Type Scale:**
- h1: 2rem (32px)
- h2: 1.5rem (24px)
- h3: 1.125rem (18px)
- Body: 1rem (16px)
- Small: 0.875rem (14px)
- Tiny: 0.75rem (12px)

### Spacing
```css
--pad-sm: 0.75rem (12px)
--pad-md: 1.25rem (20px)
--pad-lg: 2rem (32px)
--radius-sm: 8px
--radius-lg: 16px
```

### UI Classes
```css
bg-bg       /* Main background */
bg-surface  /* Card/panel background */
text-text   /* Primary text */
text-accent /* Accent/link text */
```

---

## UI Components & Patterns

### Navigation
- Top navbar: Logo, app name, notifications, user info
- Bottom nav (mobile): Today, Feed, Memory, Insights, Profile
- Active state: `--accent` color

### Cards
```css
background: --surface
border-radius: --radius-lg
padding: --pad-md
box-shadow: 0 2px 12px rgba(0, 0, 0, 0.3)
```

### Buttons
**Primary:**
- Background: `--accent`
- Text: `--bg` (dark)

**Secondary:**
- Background: `--surface`
- Border: `--accent`
- Text: `--text`

### Loading States
- Use `animate-pulse` for loading indicators
- Show loading before empty states
- Consistent messages: "Loading...", "Loading [resource]..."

### Empty States
- Centered icon/emoji
- Friendly, actionable message
- `--muted` color

---

## API Routes

| Route | Method | Description |
|-------|--------|-------------|
| `/api/entries` | GET, POST | List/create entries |
| `/api/entries/[id]` | GET, PUT, DELETE | Single entry operations |
| `/api/songs/search` | GET | Search Spotify |
| `/api/analytics` | GET | User analytics |
| `/api/feed` | GET | Social feed |
| `/api/friends/list` | GET | Friends list |
| `/api/friends/requests` | GET, POST | Friend requests |
| `/api/notifications` | GET | User notifications |
| `/api/on-this-day` | GET | Historical entries |
| `/api/wrapped` | GET | Year-end summary |
| `/api/users/search` | GET | Search users |
| `/api/profile` | GET, PUT | User profile |

---

## Deployment

### Vercel Deployment

1. **Push to GitHub:**
```bash
git add .
git commit -m "Ready for deployment"
git push origin main
```

2. **Deploy to Vercel:**
   - Go to [vercel.com](https://vercel.com)
   - Import your GitHub repository
   - Add environment variables

3. **Environment Variables for Vercel:**
```
DATABASE_URL=postgresql://...
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
SPOTIPY_CLIENT_ID=...
SPOTIPY_CLIENT_SECRET=...
```

4. **After deployment:**
   - Update any URLs to your Vercel domain
   - Run `npx prisma db push` if needed

### Database Setup (Supabase)

1. Go to [supabase.com](https://supabase.com)
2. Create new project
3. Go to **Settings** → **Database**
4. Copy connection string (URI format)
5. For serverless, use the **pooler** connection (port 6543)

**Pooler URL format:**
```
postgresql://postgres.[ref]:[password]@aws-0-us-east-1.pooler.supabase.com:6543/postgres
```

### Local Network Access (Testing on Phone)

1. Find your local IP: `ipconfig` (Windows) or `ifconfig` (Mac/Linux)
2. Start dev server: `npm run dev`
3. On phone (same WiFi): `http://[YOUR-IP]:3000`

---

## Feature Roadmap

### Planned Features
1. **Mood/vibe emoji tags** — Capture emotional context
2. **B-sides** — Add additional songs beyond main SOTD
3. **Streaks** — Gentle gamification for consistency
4. **Playlist generation** — Create Spotify playlists from entries
5. **Notifications** — "On This Day" reminders, streak nudges
6. **Shareable Wrapped** — Instagram-ready year-end summaries
7. **Song Previews** — 30-second Spotify previews with theatrics mode

### Future Considerations
- Customizable bird avatar
- Apple Music integration
- Premium tier with advanced features
- Export data functionality
- Mobile app (iOS/Android)

---

## Business Strategy

### Freemium Model (Proposed)

**Free Tier:**
- 30 entries per month
- Basic analytics
- Friend sharing
- "On This Day" memories

**Pro Tier ($3/month or $24/year):**
- Unlimited entries
- Full analytics history
- Wrapped feature
- Playlist generation
- Custom themes
- Data export
- Priority support

### Competitive Landscape

**Direct Competitors:**
- Last.fm: Automatic scrobbling, no journaling
- Stats.fm: Spotify stats, no daily ritual
- Receiptify: One-time shareable, no engagement

**SongBird's Unique Position:**
1. Daily music ritual (intentional, not passive)
2. Life context (notes, people, memories)
3. Long-term memory value ("On This Day")
4. Private-first social sharing

---

## Design Assets & Branding

### Logo Files
- `public/SongBirdlogo.png` - Main logo
- `public/logo1brown.png`, `logo2brown.png`, `logo3brown.png` - Variants
- `public/movingbirdbrowon.mp4` - Animated bird video

### Logo Usage
- Navigation: 32x32px
- Homepage: 200x200px
- Entry forms: 144x144px

### Asset Generation (Midjourney Prompts)

**Logo:**
```
minimalist robin bird logo, music app icon, geometric shapes, 
orange #B65A2A and cream #E3E1DB colors, flat vector style, 
simple clean design, transparent background --v 6 --ar 1:1
```

**Mood Birds:**
```
SongBird bird character, [pose], [accessory], fine grain texture, 
print-like quality, dark background, emotion-first design, 
no emoji, premium but warm, 1:1 aspect ratio --style raw --ar 1:1
```

### Icon Sizes Needed
- Logo: 512x512px (web), 1024x1024px (app stores)
- Tab icons: 48x48px
- Favicon: 32x32px, 16x16px
- Apple touch icon: 180x180px

---

## Troubleshooting

### Common Issues

**"Missing publishableKey" (Clerk)**
- Check `.env.local` has correct Clerk keys
- Restart dev server after adding env vars
- Clear `.next` cache: `Remove-Item -Recurse -Force .next`

**Database Connection Failed**
- Verify `DATABASE_URL` is correct
- For Vercel, use pooler connection (port 6543)
- Check SSL mode: `?sslmode=require`

**500 Error on API Routes**
- Check Vercel function logs
- Verify all environment variables are set
- Ensure database is accessible

**File Lock Errors (Windows)**
- Stop dev server (Ctrl+C)
- Close file editors
- Restart dev server

**Prisma Schema Sync**
- After schema changes: `npx prisma generate`
- Push to database: `npx prisma db push`
- On Windows, kill Node processes first if locked

### Debugging Tips

1. Check browser console for client-side errors
2. Check terminal for server-side errors
3. Use Prisma Studio to verify data: `npx prisma studio`
4. Check Vercel function logs for production issues

---

## Quick Reference

### Key Commands
```bash
npm run dev          # Start development server
npm run build        # Build for production
npx prisma studio    # Open database viewer
npx prisma generate  # Regenerate Prisma client
npx prisma db push   # Push schema to database
```

### Key Files
- `components/*.tsx` - React components
- `app/api/**/route.ts` - API routes
- `app/**/page.tsx` - Pages
- `prisma/schema.prisma` - Database schema
- `app/globals.css` - Global styles
- `tailwind.config.js` - Tailwind config

### Color Quick Reference
- Background: `bg-bg`
- Cards: `bg-surface`
- Text: `text-text`
- Accent: `text-accent`, `bg-accent`
- Muted: `text-text/60`

---

## Social Features Planning

### User Profiles
- Profile picture, username, bio
- Favorite artists/songs
- Entry count and stats
- Friends list

### Friend System
- Two-way friendships with requests
- Add by username
- Pending/accepted/declined states

### Feed
- Entries from friends
- Chronological ordering
- Card-based layout

### Notifications
- Friend request notifications
- Mention notifications
- In-app notification center

### Privacy
- Private notes vs public entries
- Friend-only sharing
- Control over tagged content

---

**Last Updated:** January 2025
**Version:** 2.0 (Post-Clerk Migration)

