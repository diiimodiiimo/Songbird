# /api-review

Review API routes for correctness, security, performance, and best practices. Act like a senior backend engineer with production experience.

## Authentication Pattern

```typescript
import { auth } from '@clerk/nextjs/server'
import { getPrismaUserIdFromClerk } from '@/lib/clerk-sync'
import { checkRateLimit } from '@/lib/rate-limit'

export async function GET(request: Request) {
  // 1. Check auth
  const { userId: clerkId } = await auth()
  if (!clerkId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // 2. Rate limiting
  const { allowed, response } = await checkRateLimit(clerkId, 'READ')
  if (!allowed) return response

  // 3. Get database user ID
  const userId = await getPrismaUserIdFromClerk(clerkId)
  if (!userId) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }

  // 4. Execute logic
  try {
    const result = await doSomething(userId)
    return NextResponse.json({ data: result })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
```

## Checklist

### Authentication
- [ ] Uses `auth()` from `@clerk/nextjs/server`
- [ ] Checks `userId` before any database operations
- [ ] Uses `getPrismaUserIdFromClerk()` to get database user ID
- [ ] Returns 401 for unauthenticated requests
- [ ] Returns 403 for unauthorized access (accessing others' data)

### Rate Limiting
- [ ] Uses `checkRateLimit()` from `@/lib/rate-limit`
- [ ] Appropriate limit type (READ, WRITE, SEARCH, AUTH)
- [ ] Returns rate limit response when exceeded

### Blocking
- [ ] Filters out blocked users where applicable
- [ ] Uses `getBlockedUserIds()` or `isUserBlocked()` from `lib/blocking.ts`

### Analytics
- [ ] Tracks relevant events using `trackEvent()` from `lib/analytics.ts`
- [ ] Uses correct event names from `AnalyticsEvents`

### Request Handling

#### GET Requests
- [ ] Proper query parameter handling
- [ ] Pagination for large datasets (`skip`, `take`)
- [ ] Filtering support where appropriate
- [ ] Proper error handling with try/catch

#### POST/PUT Requests
- [ ] Input validation (Zod preferred)
- [ ] Proper request body parsing
- [ ] Returns created/updated resource
- [ ] Idempotency considerations

#### DELETE Requests
- [ ] Ownership verification before deletion
- [ ] Soft delete vs hard delete appropriateness
- [ ] Returns proper status code (200/204)

### Database Operations
- [ ] Uses Supabase (`getSupabase()`) or Prisma correctly
- [ ] Limits fields with `select` (not `*`)
- [ ] Excludes heavy fields (base64 images) in bulk queries
- [ ] Uses indexes for common query patterns
- [ ] Handles connection pooling (Vercel serverless)

### Response Format
- [ ] Uses `NextResponse.json()` consistently
- [ ] Proper HTTP status codes (200, 201, 400, 401, 403, 404, 429, 500)
- [ ] Consistent response structure (`{ data }` or `{ error }`)
- [ ] Error responses include helpful messages
- [ ] No sensitive data in responses

### Performance
- [ ] Avoids N+1 queries
- [ ] Response size optimization
- [ ] Unnecessary count queries replaced with `.length`
- [ ] Database indexes utilized

## Output Format

Provide a checklist summary:
✅ Passing checks
⚠️ Warnings (should improve)
❌ Failing checks (must fix)

Include specific code suggestions for each issue.
