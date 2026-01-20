# /prisma-help

Get help with Prisma ORM operations, schema design, and database queries. Act like a Prisma expert who knows the gotchas.

## Quick Reference

### Generate Client (after schema changes)
```bash
npx prisma generate
```

### Push Schema (dev - no migration history)
```bash
npx prisma db push
```

### Create Migration (production)
```bash
npx prisma migrate dev --name migration_name
```

### Open Prisma Studio
```bash
npx prisma studio
```

### Format Schema
```bash
npx prisma format
```

## Schema Patterns

### Basic Model
```prisma
model Entry {
  id        String   @id @default(cuid())
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  // Fields
  songTitle String
  artist    String
  notes     String?
  
  // Relations
  userId    String
  user      User     @relation(fields: [userId], references: [id])
  
  // Indexes
  @@index([userId])
  @@unique([userId, date])
}
```

### One-to-Many
```prisma
model User {
  id      String   @id @default(cuid())
  entries Entry[]  // One user has many entries
}

model Entry {
  id     String @id @default(cuid())
  userId String
  user   User   @relation(fields: [userId], references: [id])
}
```

### Many-to-Many
```prisma
model Entry {
  id   String  @id @default(cuid())
  tags EntryTag[]
}

model User {
  id      String  @id @default(cuid())
  taggedIn EntryTag[]
}

model EntryTag {
  id      String @id @default(cuid())
  entryId String
  userId  String
  entry   Entry  @relation(fields: [entryId], references: [id])
  user    User   @relation(fields: [userId], references: [id])
  
  @@unique([entryId, userId])
}
```

## Query Patterns

### Find Many with Filter
```typescript
const entries = await prisma.entry.findMany({
  where: {
    userId: userId,
    date: {
      gte: startDate,
      lte: endDate,
    }
  },
  select: {
    id: true,
    songTitle: true,
    artist: true,
    date: true,
  },
  orderBy: { date: 'desc' },
  take: 100,
  skip: 0,
})
```

### Find Unique
```typescript
const entry = await prisma.entry.findUnique({
  where: {
    id: entryId,
  },
  include: {
    user: true,
    tags: true,
  }
})
```

### Find First (flexible unique lookup)
```typescript
const todayEntry = await prisma.entry.findFirst({
  where: {
    userId: userId,
    date: today,
  }
})
```

### Create
```typescript
const entry = await prisma.entry.create({
  data: {
    songTitle: 'Yesterday',
    artist: 'The Beatles',
    userId: userId,
    date: new Date(),
  }
})
```

### Upsert (create or update)
```typescript
const entry = await prisma.entry.upsert({
  where: {
    userId_date: {
      userId: userId,
      date: today,
    }
  },
  create: {
    songTitle: 'Yesterday',
    artist: 'The Beatles',
    userId: userId,
    date: today,
  },
  update: {
    songTitle: 'Yesterday',
    artist: 'The Beatles',
  }
})
```

### Update
```typescript
const entry = await prisma.entry.update({
  where: { id: entryId },
  data: { notes: 'Updated notes' }
})
```

### Delete
```typescript
await prisma.entry.delete({
  where: { id: entryId }
})
```

### Aggregations
```typescript
// Count
const count = await prisma.entry.count({
  where: { userId }
})

// Group by
const artistCounts = await prisma.entry.groupBy({
  by: ['artist'],
  where: { userId },
  _count: { id: true },
  orderBy: { _count: { id: 'desc' } },
  take: 10,
})
```

## Common Issues

### N+1 Query Problem
```typescript
// BAD: N+1 queries
const entries = await prisma.entry.findMany({ where: { userId } })
for (const entry of entries) {
  const tags = await prisma.entryTag.findMany({ where: { entryId: entry.id } })
}

// GOOD: Include in single query
const entries = await prisma.entry.findMany({
  where: { userId },
  include: { tags: true }
})
```

### Connection Pooling (Vercel)
```typescript
// lib/prisma.ts
import { PrismaClient } from '@prisma/client'

const globalForPrisma = global as { prisma?: PrismaClient }

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query'] : [],
  })

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}
```

### Date Handling
```typescript
// Create date for "today" (start of day)
const today = new Date()
today.setHours(0, 0, 0, 0)

// Date range query
where: {
  date: {
    gte: new Date('2024-01-01'),
    lt: new Date('2024-02-01'),
  }
}
```

### Unique Constraint Errors
```typescript
try {
  await prisma.entry.create({ data: {...} })
} catch (error) {
  if (error.code === 'P2002') {
    // Unique constraint violation
    return NextResponse.json(
      { error: 'Entry already exists for this date' },
      { status: 409 }
    )
  }
  throw error
}
```

## Output Format

Based on your question, provide:

1. **Schema Example** (if applicable)
2. **Query Code** (TypeScript)
3. **Common Pitfalls** to avoid
4. **Commands to Run** (if any)

