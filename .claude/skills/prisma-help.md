# /prisma-help

Guidance for Prisma ORM usage in SongBird. Note: SongBird primarily uses Supabase client for new code.

## Current Setup

SongBird uses **two database clients**:
- **Prisma** - Type-safe ORM (legacy routes, schema definition)
- **Supabase** - Direct client (newer routes, preferred)

## Key Files

- `prisma/schema.prisma` - Schema definition (source of truth)
- `lib/prisma.ts` - Prisma client singleton
- `lib/supabase.ts` - Supabase client

## When to Use What

### Use Prisma For
- Schema definition
- Type generation
- Complex relations with type safety
- Legacy code maintenance

### Use Supabase For
- New API routes
- Simple CRUD operations
- Real-time subscriptions
- Edge-compatible operations

## Schema Definition

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id        String   @id @default(cuid())
  email     String   @unique
  username  String?  @unique
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  entries Entry[]

  @@map("users")  // PostgreSQL table name
}

model Entry {
  id        String   @id @default(cuid())
  date      DateTime
  userId    String
  songTitle String

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([userId, date])  // One entry per user per day
  @@index([userId, date])   // Query optimization
  @@map("entries")
}
```

## Common Schema Patterns

### Unique Constraints
```prisma
// Single field
email String @unique

// Composite unique
@@unique([userId, date])
@@unique([entryId, userId])  // One vibe per user per entry
```

### Indexes
```prisma
// Single field index
@@index([userId])

// Composite index for common queries
@@index([userId, date])
```

### Relations
```prisma
// One-to-Many
model User {
  entries Entry[]
}

model Entry {
  userId String
  user   User @relation(fields: [userId], references: [id], onDelete: Cascade)
}

// Self-referential (blocking)
model User {
  blockedUsers  BlockedUser[] @relation("Blocker")
  blockedBy     BlockedUser[] @relation("Blocked")
}
```

### Cascade Delete
```prisma
// When user is deleted, delete their entries
user User @relation(fields: [userId], references: [id], onDelete: Cascade)

// When user is deleted, set null (for optional relations)
user User? @relation(fields: [userId], references: [id], onDelete: SetNull)
```

## Prisma Client Usage

```typescript
import { prisma } from '@/lib/prisma'

// Find one
const user = await prisma.user.findUnique({
  where: { id: userId },
  select: { id: true, email: true, username: true },
})

// Find many with relations
const entries = await prisma.entry.findMany({
  where: { userId },
  include: { vibes: true, comments: true },
  orderBy: { date: 'desc' },
  take: 50,
})

// Create
const entry = await prisma.entry.create({
  data: {
    userId,
    songTitle: 'Yesterday',
    artist: 'The Beatles',
    // ...
  },
})

// Update
await prisma.user.update({
  where: { id: userId },
  data: { theme: 'cardinal' },
})

// Upsert
await prisma.entry.upsert({
  where: { userId_date: { userId, date } },
  create: { userId, date, songTitle, artist, ... },
  update: { songTitle, artist, ... },
})

// Delete
await prisma.entry.delete({
  where: { id: entryId },
})
```

## Schema Changes

### Adding a Field
```prisma
model User {
  newField String?  // Optional by default
}
```

Then:
```bash
npx prisma generate  # Regenerate client
npx prisma db push   # Push to database (dev)
# OR create migration file for production
```

### Adding a Required Field
```prisma
model User {
  requiredField String @default("default_value")
}
```

### Creating a Migration
```bash
# For development
npx prisma db push

# For production (creates migration file)
npx prisma migrate dev --name add_new_field
```

## Prisma Client Singleton

```typescript
// lib/prisma.ts
import { PrismaClient } from '@prisma/client'

const globalForPrisma = global as unknown as { prisma: PrismaClient }

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' 
      ? ['query', 'error', 'warn'] 
      : ['error'],
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
```

## Common Issues

### "Cannot find module '@prisma/client'"
```bash
npx prisma generate
```

### "Unique constraint violation"
```typescript
try {
  await prisma.entry.create({ ... })
} catch (error) {
  if (error.code === 'P2002') {
    // Handle duplicate
  }
}
```

### "Foreign key constraint failed"
- Referenced record doesn't exist
- Check `onDelete` behavior

### Slow Queries
- Add appropriate indexes
- Use `select` to limit fields
- Check for N+1 patterns
