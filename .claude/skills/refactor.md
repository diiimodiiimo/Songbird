# /refactor

Refactor code for improved readability, maintainability, and quality without changing functionality. Act like a senior engineer doing a thoughtful cleanup.

## Refactoring Principles

### Golden Rules
1. **Don't change behavior** - Same inputs → same outputs
2. **Small steps** - One refactor at a time
3. **Test after each change** - Verify nothing broke
4. **Leave it better** - Don't gold-plate, just improve

### When to Refactor
- Duplicated code
- Long functions (> 50 lines)
- Deeply nested logic
- Unclear naming
- Magic numbers/strings
- Mixed concerns
- Outdated patterns

### When NOT to Refactor
- Working code under time pressure
- Code you don't understand yet
- Without tests/verification ability
- Just for style preferences

## Common Refactors

### Extract Function
```typescript
// Before
async function handleSubmit() {
  const entry = await prisma.entry.create({...})
  await fetch('/api/notify', { body: JSON.stringify({...}) })
  // ...20 more lines
}

// After
async function handleSubmit() {
  const entry = await createEntry(data)
  await notifyFriends(entry)
  await updateUI(entry)
}
```

### Extract Constant
```typescript
// Before
if (entries.length > 100) { /* paginate */ }

// After
const PAGE_SIZE = 100
if (entries.length > PAGE_SIZE) { /* paginate */ }
```

### Simplify Conditionals
```typescript
// Before
if (user && user.friends && user.friends.length > 0) {
  return true
} else {
  return false
}

// After
return (user?.friends?.length ?? 0) > 0
```

### Remove Duplication (DRY)
```typescript
// Before
// Same fetch pattern in 5 components

// After
// Shared hook
function useEntries() {
  const [entries, setEntries] = useState([])
  const [loading, setLoading] = useState(false)
  // ... shared logic
  return { entries, loading, refresh }
}
```

### Early Returns
```typescript
// Before
function process(data) {
  if (data) {
    if (data.valid) {
      // ... actual logic
    }
  }
}

// After
function process(data) {
  if (!data) return
  if (!data.valid) return
  // ... actual logic
}
```

### Named Booleans
```typescript
// Before
if (user.role === 'admin' && user.verified && !user.suspended) {
  // ...
}

// After
const isActiveAdmin = user.role === 'admin' && user.verified && !user.suspended
if (isActiveAdmin) {
  // ...
}
```

## SongBird-Specific Patterns

### Consistent Data Fetching
```typescript
const [data, setData] = useState<Type[]>([])
const [loading, setLoading] = useState(false)
const [error, setError] = useState<string | null>(null)

const fetchData = async () => {
  setLoading(true)
  setError(null)
  try {
    const res = await fetch('/api/endpoint')
    const json = await res.json()
    if (res.ok) {
      setData(json.data)
    } else {
      setError(json.error || 'Failed to fetch')
    }
  } catch (err) {
    setError('Network error')
    console.error('Fetch error:', err)
  } finally {
    setLoading(false)
  }
}
```

### API Route Structure
```typescript
export async function GET(request: Request) {
  // 1. Auth check
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // 2. Parse input
  const { searchParams } = new URL(request.url)
  const param = searchParams.get('param')

  // 3. Execute logic
  try {
    const result = await doSomething(userId, param)
    return NextResponse.json({ data: result })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
```

## Output Format

### Proposed Refactors

1. **[Refactor Name]**
   - Location: `file:line`
   - Reason: Why this improves the code
   - Before:
   ```typescript
   // old code
   ```
   - After:
   ```typescript
   // new code
   ```
   - Risk: Low/Med (breaking change potential)

2. **[Next Refactor]**
   ...

### Not Recommending Changes To
- List any code that looks messy but shouldn't be touched (and why)



