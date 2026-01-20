# /api-review

Review API routes for correctness, security, performance, and best practices. Act like a senior backend engineer with production experience.

## Authentication

- [ ] Uses `auth()` from `@clerk/nextjs/server`
- [ ] Checks `userId` before any database operations
- [ ] Returns 401 for unauthenticated requests
- [ ] Returns 403 for unauthorized access (accessing others' data)

## Request Handling

### GET Requests
- [ ] Proper query parameter handling
- [ ] Pagination for large datasets (`skip`, `take`)
- [ ] Filtering support where appropriate
- [ ] Proper error handling with try/catch

### POST/PUT Requests
- [ ] Input validation (Zod preferred)
- [ ] Proper request body parsing
- [ ] Returns created/updated resource
- [ ] Idempotency considerations

### DELETE Requests
- [ ] Ownership verification before deletion
- [ ] Soft delete vs hard delete appropriateness
- [ ] Returns proper status code (200/204)

## Database Operations

- [ ] Uses Prisma with proper typing
- [ ] Limits fields with `select` or `include` (not `*`)
- [ ] Excludes heavy fields (base64 images) in bulk queries
- [ ] Uses indexes for common query patterns
- [ ] Handles connection pooling (Vercel serverless)

## Response Format

- [ ] Uses `NextResponse.json()` consistently
- [ ] Proper HTTP status codes (200, 201, 400, 401, 403, 404, 500)
- [ ] Consistent response structure (`{ data }` or `{ error }`)
- [ ] Error responses include helpful messages
- [ ] No sensitive data in responses

## Performance

- [ ] Avoids N+1 queries (use `include` properly)
- [ ] Response size optimization
- [ ] Unnecessary count queries replaced with `.length`
- [ ] Database indexes utilized

## Error Handling

- [ ] Try/catch wrapping
- [ ] Proper error logging (`console.error`)
- [ ] User-friendly error messages (no stack traces)
- [ ] Graceful handling of edge cases

## Code Quality

- [ ] TypeScript types for request/response
- [ ] Single responsibility (one action per route)
- [ ] Clear function naming
- [ ] Comments for complex logic

## Output Format

Provide a checklist summary:
✅ Passing checks
⚠️ Warnings (should improve)
❌ Failing checks (must fix)

Include specific code suggestions for each issue.

