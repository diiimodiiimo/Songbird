# User ID System - Standardization Guide

## Overview
This document explains how user IDs work in SongBird and ensures consistency across all database operations.

## Core Principle
**ALWAYS use `users.id` (database primary key) for all database queries and relationships.**

## User ID Flow

### 1. Clerk Authentication
- Clerk provides `clerkUserId` (e.g., `user_388dqr3cH3WoTbL8RCxt1HAIx0o`)
- This is obtained via `auth().userId` in API routes

### 2. Database User Lookup
**Function**: `getPrismaUserIdFromClerk(clerkUserId: string): Promise<string | null>`

**What it does**:
- Takes Clerk user ID
- Returns `users.id` (database primary key)
- Handles user creation if needed
- Uses caching for performance

**Important Notes**:
- For **new users**: `users.id = clerkUserId` (same value)
- For **existing users**: `users.id` may differ from `clerkId`
- **ALWAYS returns `users.id`**, never `clerkId`

### 3. Database Relationships
All database relationships use `users.id`:

- `entries.userId` → references `users.id`
- `friends.userId` → references `users.id`
- `vibes.userId` → references `users.id`
- All other foreign keys → reference `users.id`

## Standard Pattern for API Routes

```typescript
import { auth } from '@clerk/nextjs/server'
import { getPrismaUserIdFromClerk } from '@/lib/clerk-sync'
import { getSupabase } from '@/lib/supabase'

export async function GET() {
  // 1. Get Clerk user ID
  const { userId: clerkUserId } = await auth()
  if (!clerkUserId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // 2. Get database user ID (ALWAYS use this)
  const userId = await getPrismaUserIdFromClerk(clerkUserId)
  if (!userId) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }

  // 3. Use userId for all database queries
  const supabase = getSupabase()
  const { data: entries } = await supabase
    .from('entries')
    .select('*')
    .eq('userId', userId) // ← Always use users.id here
}
```

## Common Mistakes to Avoid

### ❌ DON'T:
- Query by `clerkId` directly (use `getPrismaUserIdFromClerk` first)
- Use `clerkUserId` in database queries
- Assume `clerkId === users.id` (only true for new users)
- Create entries with `clerkUserId` directly

### ✅ DO:
- Always call `getPrismaUserIdFromClerk(clerkUserId)` first
- Use the returned `userId` for all database operations
- Trust that `userId` is always `users.id`

## Function Reference

### `getPrismaUserIdFromClerk(clerkUserId: string)`
- **Input**: Clerk user ID
- **Output**: Database `users.id` or `null`
- **Caching**: 5 minutes
- **Side effects**: May create user if not found

### `getPrismaUserId()`
- Helper that gets Clerk ID from auth and calls `getPrismaUserIdFromClerk`
- Use when you don't have `clerkUserId` directly

## Verification Checklist

When adding new API routes, verify:
- [ ] Uses `getPrismaUserIdFromClerk` to get database user ID
- [ ] All database queries use `users.id` (not `clerkId`)
- [ ] Entry creation uses `userId` from `getPrismaUserIdFromClerk`
- [ ] No direct queries by `clerkId` (except in `clerk-sync.ts`)

## Current Status

✅ **All API routes verified** - They all use `getPrismaUserIdFromClerk`
✅ **Entries use correct userId** - `entries.userId = users.id`
✅ **Birds API fixed** - Now uses `users.id` consistently

## Troubleshooting

If user lookups fail:
1. Check that `getPrismaUserIdFromClerk` is being called
2. Verify it returns a non-null `userId`
3. Check that `userId` matches `users.id` in database
4. Verify entries use the same `userId`


