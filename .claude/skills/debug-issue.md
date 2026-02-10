# /debug-issue

Systematic debugging assistance for SongBird issues. Act like a senior engineer troubleshooting production problems.

## Debugging Framework

### 1. Reproduce
- What are the exact steps to reproduce?
- Which user/account is affected?
- When did it start happening?
- Is it consistent or intermittent?

### 2. Isolate
- Does it happen in development or production?
- Does it affect all users or specific ones?
- Is it browser/device specific?
- Is it related to specific data?

### 3. Investigate
- Check console errors (browser + server)
- Check network requests (status codes, responses)
- Check database state
- Check recent deployments

### 4. Fix & Verify
- Make minimal change to fix
- Test the fix locally
- Verify in staging/preview
- Deploy and monitor

## Common Issue Categories

### Authentication Issues

**Symptoms**: "Unauthorized", redirects to login, 401 errors

**Check**:
```typescript
// 1. Is auth() returning a user?
const { userId } = await auth()
console.log('Clerk userId:', userId)

// 2. Is the user in the database?
const user = await getPrismaUserIdFromClerk(userId)
console.log('Database user:', user)

// 3. Is the session valid?
// Check Clerk dashboard for session status
```

### Database Issues

**Symptoms**: "User not found", empty data, stale data

**Check**:
```typescript
// 1. Query the database directly
const { data, error } = await supabase
  .from('users')
  .select('*')
  .eq('clerkId', clerkId)

console.log('Query result:', { data, error })

// 2. Check for connection issues
// Supabase dashboard → Database → Connection pool
```

### API Issues

**Symptoms**: 500 errors, timeout, wrong data

**Check**:
```typescript
// 1. Add logging to API route
console.log('Request params:', request.nextUrl.searchParams)

// 2. Check rate limiting
const { allowed, remaining } = await checkRateLimit(userId, 'READ')
console.log('Rate limit:', { allowed, remaining })

// 3. Check response structure
return NextResponse.json({ 
  success: true,
  data,
  _debug: { userId, timestamp: Date.now() }  // Temporary
})
```

### UI Issues

**Symptoms**: Blank screen, loading forever, wrong display

**Check**:
```tsx
// 1. Add console logs in component
useEffect(() => {
  console.log('Component mounted, state:', { loading, data, error })
}, [loading, data, error])

// 2. Check for React errors in console
// Look for: "Uncaught Error", "Cannot read property"

// 3. Check loading state order
// Must be: loading → data → empty
```

### Performance Issues

**Symptoms**: Slow loading, freezing, memory warnings

**Check**:
```typescript
// 1. Time your operations
console.time('fetchEntries')
const entries = await fetchEntries()
console.timeEnd('fetchEntries')

// 2. Check for N+1 queries
// Look for repeated similar queries in logs

// 3. Check response sizes
console.log('Response size:', JSON.stringify(data).length)
```

## Debugging Tools

### Browser DevTools
- Console: JavaScript errors
- Network: API requests/responses
- Application: Storage, cookies, service workers
- Performance: Rendering issues

### Vercel Dashboard
- Logs: Function execution logs
- Analytics: Performance metrics
- Deployments: Recent deploys

### Supabase Dashboard
- Database: Query execution
- Auth: Session state
- Logs: API requests

### Clerk Dashboard
- Users: User state and sessions
- Sessions: Active sessions
- Logs: Authentication events

## Log Patterns

### Structured Logging
```typescript
console.log('[API:entries] Fetching entries', {
  userId,
  date,
  timestamp: new Date().toISOString(),
})

console.error('[API:entries] Error fetching entries', {
  error: error.message,
  stack: error.stack,
  userId,
})
```

### Breadcrumb Trail
```typescript
try {
  console.log('[1] Starting entry creation')
  const user = await getUser()
  
  console.log('[2] User found:', user.id)
  const entry = await createEntry(data)
  
  console.log('[3] Entry created:', entry.id)
  await updateStreak(user.id)
  
  console.log('[4] Streak updated')
  return { success: true, entry }
} catch (error) {
  console.error('[ERROR] Failed at step:', error)
  throw error
}
```

## Quick Fixes

### "User not found in database"
```typescript
// Check Clerk → DB sync
await syncClerkUser(clerkId)
```

### "Rate limited"
```typescript
// Check current rate limit state
const store = rateLimitStore.get(userId)
console.log('Rate limit state:', store)
```

### "Entry not saving"
```typescript
// Check for unique constraint violation
// [userId, date] must be unique
const existing = await supabase
  .from('entries')
  .select('id')
  .eq('userId', userId)
  .eq('date', date)
```

### "Push notification not received"
```typescript
// Check subscription exists
const subs = await supabase
  .from('push_subscriptions')
  .select('*')
  .eq('userId', userId)

console.log('Push subscriptions:', subs.data)
```

## Escalation Path

1. **Self-debug** - Use this guide
2. **Check docs** - SONGBIRD_DOCUMENTATION.md
3. **Search codebase** - grep for similar issues
4. **Review recent changes** - git log, deployments
5. **Check external services** - Spotify, Clerk, Supabase status
