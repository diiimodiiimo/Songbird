# /code-review

Perform thorough code reviews with categorized feedback. Act like a senior engineer reviewing a pull request.

## Review Categories

### 🚫 Blocking (Must Fix)
Critical issues that prevent merging:
- Security vulnerabilities
- Data corruption risks
- Breaking changes
- Missing authentication
- Incorrect business logic

### ⚠️ Non-Blocking (Should Fix)
Important improvements:
- Performance issues
- Error handling gaps
- Missing edge cases
- Code smell / tech debt
- Incomplete error messages

### 💡 Suggestions (Nice to Have)
Minor improvements:
- Code style
- Variable naming
- Documentation
- Alternative approaches
- Future optimization opportunities

### ✨ Praise
What's done well (keep doing!):
- Clean patterns
- Good test coverage
- Thoughtful error handling
- Performance optimization

## SongBird Code Standards

### TypeScript
```typescript
// ✅ Good: Explicit types for function params/returns
async function getEntries(userId: string): Promise<Entry[]> {
  // ...
}

// ❌ Bad: Using 'any'
function processData(data: any): any { ... }

// ✅ Good: Interface for complex objects
interface CreateEntryInput {
  songTitle: string
  artist: string
  notes?: string
}
```

### API Routes
```typescript
// ✅ Good: Complete pattern
export async function POST(request: Request) {
  // 1. Auth check
  const { userId: clerkId } = await auth()
  if (!clerkId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // 2. Rate limiting
  const { allowed, response } = await checkRateLimit(clerkId, 'WRITE')
  if (!allowed) return response

  // 3. Get database user
  const userId = await getPrismaUserIdFromClerk(clerkId)
  if (!userId) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }

  // 4. Execute with try/catch
  try {
    const result = await doSomething()
    return NextResponse.json({ data: result })
  } catch (error) {
    console.error('[API] Error:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
```

### React Components
```tsx
// ✅ Good: Loading state first
{loading ? (
  <Skeleton />
) : entries.length > 0 ? (
  <EntryList entries={entries} />
) : (
  <EmptyState />
)}

// ❌ Bad: Empty state flashes during load
{entries.length === 0 ? <EmptyState /> : <EntryList entries={entries} />}
```

### Error Handling
```typescript
// ✅ Good: Specific error handling
try {
  await supabase.from('entries').insert(data)
} catch (error) {
  if (error.code === '23505') {
    return { error: 'Entry already exists for this date' }
  }
  throw error // Re-throw unexpected errors
}

// ❌ Bad: Swallowing errors silently
try {
  await riskyOperation()
} catch (e) {
  // Nothing happens
}
```

### Database Queries
```typescript
// ✅ Good: Select only needed fields
const { data } = await supabase
  .from('entries')
  .select('id, songTitle, artist, date')
  .eq('userId', userId)
  .limit(50)

// ❌ Bad: Selecting everything
const { data } = await supabase.from('entries').select('*')
```

## Review Template

```markdown
## Code Review: [Feature/File Name]

### 🚫 Blocking Issues
1. **[Issue Title]**
   - Location: `file.ts:123`
   - Problem: [Description]
   - Fix: [Suggested code]

### ⚠️ Non-Blocking
1. **[Issue Title]**
   - Location: `file.ts:45`
   - Suggestion: [Description]

### 💡 Suggestions
1. Consider [improvement] for [reason]

### ✨ What's Good
- [Positive feedback]
- [Pattern worth keeping]

### Summary
- Blocking: X issues
- Non-blocking: Y issues
- Ready to merge: Yes/No
```

## Common Review Points

### Security
- [ ] Auth check on all protected routes
- [ ] User can only access their own data
- [ ] Rate limiting on write operations
- [ ] No sensitive data in responses
- [ ] Input validation on user inputs

### Performance
- [ ] No N+1 queries
- [ ] Appropriate use of indexes
- [ ] Response size is reasonable
- [ ] Expensive operations are cached

### Code Quality
- [ ] No unused imports
- [ ] No console.log in production code
- [ ] Proper error messages for users
- [ ] TypeScript types are correct

### Testing
- [ ] Edge cases considered
- [ ] Error paths handled
- [ ] Loading states work correctly
