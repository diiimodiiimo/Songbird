# Quick Start Guide for Claude Agents

## What is SongBird?

**SongBird** is a music journal app where users:
- Track their "Song of the Day" with Spotify integration
- Add notes and memories to entries
- View analytics (top artists, songs, streaks)
- Share with friends (social features)
- Browse archives and "On This Day" memories

**Tech Stack**: Next.js 14+, TypeScript, Prisma, PostgreSQL, Clerk, Tailwind CSS

---

## Current Critical Issue

### Authentication Migration (IN PROGRESS)

**Status**: Partially migrated from NextAuth to Clerk
- ✅ Infrastructure set up (Clerk installed, pages created)
- ❌ Components still use NextAuth (`useSession`)
- ❌ API routes still use NextAuth (`getServerSession`)
- ❌ User ID mapping not implemented

**Impact**: Many features won't work until migration completes

**If you're working on components/API routes**: You may need to update auth calls first, or work around the migration

---

## Three Main Tasks

### 1. 🎨 Design & Layout Improvements

**Goal**: Make it look better, more polished, better UX

**What to do**:
- Review `components/*.tsx` files
- Improve visual design with Tailwind CSS
- Better spacing, typography, colors
- Improve mobile responsiveness
- Better loading/empty states

**Start with**:
- `app/home/page.tsx` - Home screen
- `components/Dashboard.tsx` - Main layout
- `components/AddEntryTab.tsx` - Main entry form

**Remember**:
- Use Tailwind CSS only
- Keep it functional
- Mobile-first design
- Consistent patterns

---

### 2. ⚙️ Backend Improvements

**Goal**: Better performance, code quality, reliability

**What to do**:
- Review `app/api/**/route.ts` files
- Optimize database queries
- Better error handling
- Input validation
- Response optimization

**Start with**:
- `app/api/entries/route.ts` - Main entries API
- `prisma/schema.prisma` - Database schema
- Check for slow queries

**Remember**:
- Use Prisma for database
- Keep Vercel serverless limits in mind
- Maintain type safety
- Don't break existing functionality

---

### 3. 💡 Brainstorm Improvements

**Goal**: Generate creative feature ideas and enhancements

**What to think about**:
- New features users would want
- UX improvements
- Technical enhancements
- Social/viral features
- Integrations

**Consider**:
- User pain points
- What makes the app unique
- Feasibility with current stack
- Value vs. effort
- Music/journaling context

**Output**: Prioritized list of ideas with descriptions

---

## File Structure Quick Reference

```
sotd/
├── app/
│   ├── api/          ← API routes (backend work)
│   ├── home/         ← Home screen (design work)
│   ├── sign-in/      ← Clerk sign-in
│   ├── sign-up/      ← Clerk sign-up
│   └── page.tsx      ← Dashboard entry
├── components/       ← React components (design + auth migration)
├── lib/              ← Utilities
├── prisma/           ← Database schema (backend work)
└── .env              ← Environment variables
```

---

## Before You Start

1. **Understand the current state**
   - Read `PROJECT_SYNOPSIS_FOR_CLAUDE.md` for full context
   - Check what's already done
   - Understand the migration status

2. **Choose your focus**
   - Design improvements?
   - Backend optimization?
   - Feature brainstorming?
   - Auth migration? (if needed)

3. **Start small**
   - Pick one component or one API route
   - Make improvements incrementally
   - Test as you go

4. **Ask questions**
   - If something is unclear
   - If you need more context
   - If you find issues

---

## Common Patterns to Follow

### Components
```typescript
'use client'  // For client components

import { useUser } from '@clerk/nextjs'  // After migration

// Use Tailwind classes
<div className="bg-surface rounded-xl p-6">
```

### API Routes
```typescript
import { auth } from '@clerk/nextjs/server'  // After migration

const { userId } = await auth()
// Use userId for database queries
```

### Database
```typescript
import { prisma } from '@/lib/prisma'

// Always use select/include to limit fields
const entries = await prisma.entry.findMany({
  select: { id: true, songTitle: true, ... }
})
```

---

## Important Notes

- ⚠️ **Auth migration in progress** - Many things may not work
- 📁 **Project in OneDrive** - Can cause file lock issues
- 🔑 **Env vars** - Need server restart after changes
- 🎨 **Design system** - Use existing Tailwind config
- ⚡ **Performance** - Vercel serverless limits apply

---

## Need Help?

- Check `PROJECT_SYNOPSIS_FOR_CLAUDE.md` for detailed context
- Check `CLAUDE_AGENT_INSTRUCTIONS.md` for specific instructions
- Review existing code for patterns
- Test changes locally

Good luck! 🚀



