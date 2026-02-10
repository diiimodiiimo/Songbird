# SongBird - Agent Instructions

## What is SongBird?

A music journaling app that helps users track daily "Song of the Day" entries with personal notes and memories. The core value is understanding the connection between music and the life we live.

## Tech Stack

- **Framework**: Next.js 14+ (App Router)
- **Database**: PostgreSQL with Supabase
- **Auth**: Clerk
- **Music API**: Spotify
- **Hosting**: Vercel
- **Payments**: Stripe (Founding Flock + SongBird Plus)

## Design Philosophy

> "A robin on a branch at dawn: warm chest, cool surroundings, attentive, personal."

- Warm and personal, not clinical
- Core functionality over flashy features
- Social features are optional (private to friends only)

## Key Features

- Daily song logging (same-day requirement for streaks)
- "On This Day" memories (emotionally powerful - prominent placement)
- Social feed (optional, drives viral growth)
- Bird avatar customization with milestone unlocks
- Insights and Wrapped summaries (premium)

## Commands

```bash
npm run dev          # Start dev server
npm run typecheck    # TypeScript check
npm run lint         # ESLint
npm test             # Run tests
```

## Patterns

- Server actions in `actions.ts` files
- Use Clerk's `auth()` server-side, `useAuth()` client-side
- Spotify token refresh handled in `/lib/spotify.ts`
- Always check `passes` status after changes

## When Making Changes

1. Understand the existing patterns first
2. Make small, incremental changes
3. Run typecheck after each change
4. Commit frequently with clear messages
5. Update this file if you discover new patterns
