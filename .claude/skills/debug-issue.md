# /debug-issue

Systematically investigate and resolve a bug or issue. Act like a senior developer with strong debugging skills and patience.

## Debugging Process

### 1. Reproduce the Issue
- What are the exact steps to reproduce?
- Is it consistent or intermittent?
- Does it happen locally, production, or both?
- What browser/device?
- What user account?

### 2. Gather Evidence

#### Check the Console
- Browser console errors (client-side)
- Terminal output (server-side)
- Vercel function logs (production)

#### Check the Network
- API request/response in Network tab
- Status codes
- Response body

#### Check the Data
- Prisma Studio (`npx prisma studio`)
- Database state
- User-specific data

### 3. Form Hypotheses

Common SongBird issue patterns:

#### Authentication Issues
- Missing `auth()` check
- Clerk user not synced to database
- Wrong userId being used

#### Data Issues
- Entry not found for date
- Duplicate entry constraint violation
- Missing required fields

#### API Issues
- 500 error without proper error handling
- Timeout on large queries
- Missing environment variables

#### UI Issues
- Wrong loading state shown
- Stale data after mutation
- Race condition in useEffect

### 4. Test Hypotheses

#### Add Logging
```typescript
console.log('[DEBUG] userId:', userId)
console.log('[DEBUG] query result:', result)
console.log('[DEBUG] error:', error)
```

#### Isolate the Problem
- Comment out code sections
- Test with hardcoded values
- Check individual components

### 5. Implement Fix

#### Fix Checklist
- [ ] Root cause identified
- [ ] Fix addresses root cause (not symptom)
- [ ] Fix doesn't break other functionality
- [ ] Edge cases considered
- [ ] Error handling added

### 6. Verify Fix

- [ ] Original issue resolved
- [ ] Works locally
- [ ] Works in production
- [ ] Related features still work
- [ ] Clean up debug logging

## Common SongBird Issues

### "Cannot read property of undefined"
- Check for null/undefined before access
- Add optional chaining: `object?.property`
- Add nullish coalescing: `value ?? defaultValue`

### "Unauthorized" or 401 errors
```typescript
const { userId } = await auth()
if (!userId) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
}
// Also sync Clerk user to DB if needed
```

### "Entry not found" for today
```typescript
// Date handling issue - check timezone
const today = new Date()
today.setHours(0, 0, 0, 0)
```

### Infinite loading
```typescript
// Missing finally in fetch
try {
  // ...
} catch {
  // ...
} finally {
  setLoading(false) // This line missing!
}
```

### Data not refreshing
```typescript
// Need to refetch after mutation
await fetch('/api/entries', { method: 'POST', ... })
await fetchEntries() // Refetch to update UI
```

## Output Format

### Issue Summary
Brief description of the problem

### Root Cause
What's actually causing the issue

### Evidence
- Console output
- Network requests
- Database state

### Fix
```typescript
// Before
// problematic code

// After
// fixed code
```

### Prevention
How to prevent similar issues in the future



