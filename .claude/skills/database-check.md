# /database-check

Review database schema, queries, and data operations for correctness, performance, and best practices. Act like a database administrator with production experience.

## Schema Review (prisma/schema.prisma)

### Model Design
- Appropriate field types (String, Int, DateTime, etc.)
- Proper use of `@id`, `@unique`, `@default`
- Sensible nullable vs required fields
- Relations defined correctly (`@relation`)

### Indexes
- Indexed fields used in WHERE clauses
- Composite indexes for multi-field queries (e.g., `[userId, date]`)
- Unique constraints where appropriate

### Relationships
- Proper one-to-many, many-to-many setup
- Cascade delete behavior defined
- Reference integrity maintained

## Query Patterns

### Field Selection
- Using `select` to limit returned fields
- Using `include` sparingly (N+1 risk)
- Never fetching `*` when not needed
- Excluding heavy fields (base64, large text) in lists

### Filtering
- Always including `userId` in user-specific queries
- Proper date range queries
- Efficient text search patterns

### Pagination
- Using `skip` and `take` for large datasets
- Cursor-based pagination for infinite scroll
- Reasonable page sizes (100-1000)

### Aggregations
- Using `count()`, `groupBy()` efficiently
- Avoiding client-side aggregation
- Caching expensive aggregations

## Data Integrity

### Constraints
- Unique constraints where needed
- Foreign key constraints
- Check constraints (via application layer)

### Migrations
- Safe migration patterns
- Data preservation during schema changes
- Rollback strategy

### User Data Isolation
- All queries scoped to current user
- No cross-user data leaks
- Friend permissions properly enforced

## Performance

### Common Issues
- N+1 queries (use `include` or batch)
- Missing indexes on frequently queried fields
- Large result sets without pagination
- Inefficient sorting

### Serverless Considerations
- Connection pooling setup
- Query timeout awareness
- Cold start optimization

## Prisma Best Practices

### Client Setup
```typescript
// Singleton pattern for Prisma client
import { PrismaClient } from '@prisma/client'

const globalForPrisma = global as { prisma?: PrismaClient }
export const prisma = globalForPrisma.prisma ?? new PrismaClient()
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
```

### Query Patterns
```typescript
// Good: Select only needed fields
const entries = await prisma.entry.findMany({
  where: { userId },
  select: { id: true, songTitle: true, artist: true, date: true }
})

// Bad: Fetching everything
const entries = await prisma.entry.findMany({ where: { userId } })
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

