# /database-check

Review database schema, queries, and data operations for correctness, performance, and best practices. Act like a database administrator with production experience.

## Current Stack

SongBird uses **two database clients**:
1. **Prisma** - Type-safe ORM (legacy, some routes)
2. **Supabase** - Direct client (newer routes, preferred)

## Key Files

- `prisma/schema.prisma` - Database schema
- `lib/prisma.ts` - Prisma client singleton
- `lib/supabase.ts` - Supabase client
- `migrations/*.sql` - Manual SQL migrations

## Schema Overview

### Core Models
- **User** - User accounts with profile, streaks, premium status
- **Entry** - Song of the day entries
- **FriendRequest** - Two-way friend system
- **Mention** - Entry mentions (notifies user)
- **PersonReference** - Non-user person tags

### Social Models
- **Vibe** - Heart/likes on entries
- **Comment** - Comments on entries
- **Notification** - User notifications

### System Models
- **PushSubscription** - Web push subscriptions
- **Invite** - Invite codes
- **AnalyticsEvent** - Analytics tracking
- **UnlockedBird** - Bird unlock records
- **BlockedUser** - User blocks
- **Report** - User/content reports
- **WaitlistEntry** - Pre-launch waitlist

## Query Patterns

### Using Supabase (Preferred)
```typescript
import { getSupabase } from '@/lib/supabase'

const supabase = getSupabase()

// Select with filter
const { data, error } = await supabase
  .from('entries')
  .select('id, songTitle, artist, date')
  .eq('userId', userId)
  .order('date', { ascending: false })
  .limit(100)

// Insert
const { data, error } = await supabase
  .from('entries')
  .insert({ userId, songTitle, artist, ... })
  .select()
  .single()

// Update
const { error } = await supabase
  .from('users')
  .update({ theme: 'cardinal' })
  .eq('id', userId)

// Count (efficient)
const { count } = await supabase
  .from('entries')
  .select('id', { count: 'exact', head: true })
  .eq('userId', userId)
```

### Using Prisma (Legacy)
```typescript
import { prisma } from '@/lib/prisma'

const entries = await prisma.entry.findMany({
  where: { userId },
  select: { id: true, songTitle: true, artist: true },
  orderBy: { date: 'desc' },
  take: 100,
})
```

## Important Indexes

```prisma
@@index([userId, date])    // Entry queries by user
@@index([userId])          // User-specific queries
@@index([event])           // Analytics by event type
@@index([createdAt])       // Time-based queries
```

## Schema Changes

### Adding New Fields
1. Update `prisma/schema.prisma`
2. Create migration file in `migrations/`
3. Run migration on Supabase
4. Run `npx prisma generate`

Example migration:
```sql
-- migrations/add-new-field.sql
ALTER TABLE users ADD COLUMN new_field TEXT;
```

### Unique Constraints
```prisma
@@unique([userId, date])    // One entry per day
@@unique([entryId, userId]) // One vibe per user per entry
@@unique([blockerId, blockedId]) // One block record
```

## Performance Checklist

### Query Optimization
- [ ] Select only needed fields (`select: {...}`)
- [ ] Use indexes for WHERE clauses
- [ ] Limit results for pagination
- [ ] Use `count` with `head: true` for counts
- [ ] Avoid N+1 queries

### Bulk Operations
```typescript
// Bad: N+1 queries
for (const entry of entries) {
  const vibes = await supabase.from('vibes').select().eq('entryId', entry.id)
}

// Good: Single query with join
const { data } = await supabase
  .from('entries')
  .select('*, vibes(*)')
  .in('id', entryIds)
```

### Connection Pooling
Supabase handles pooling automatically. For Prisma, use singleton pattern:
```typescript
const globalForPrisma = global as { prisma?: PrismaClient }
export const prisma = globalForPrisma.prisma ?? new PrismaClient()
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
```

## Data Integrity

### User Data Isolation
```typescript
// ALWAYS filter by userId
const { data } = await supabase
  .from('entries')
  .select('*')
  .eq('userId', userId)  // REQUIRED
```

### Cascade Deletes
```prisma
user User @relation(fields: [userId], references: [id], onDelete: Cascade)
```

### Blocking Filter
```typescript
const blockedIds = await getBlockedUserIds(userId)
// Filter from queries
.not('userId', 'in', `(${blockedIds.join(',')})`)
```

## Output Format

**Schema Issues:**
- List any schema design problems

**Query Issues:**
- List problematic query patterns found

**Performance Issues:**
- List performance bottlenecks

**Recommendations:**
- Specific improvements with code examples
