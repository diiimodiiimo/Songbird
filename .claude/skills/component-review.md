# /component-review

Review React components for best practices, patterns, and SongBird conventions. Act like a senior React engineer.

## Framework Context

- **Next.js 14+** with App Router
- **React 18** with hooks
- **TypeScript** for type safety
- **Tailwind CSS** for styling

## Server vs Client Components

### Server Components (Default)
```tsx
// No 'use client' directive
// Can directly fetch data
// Cannot use hooks or event handlers

export default async function ServerComponent() {
  const data = await fetchData()  // Direct async
  return <div>{data.title}</div>
}
```

### Client Components
```tsx
'use client'

// Required for:
// - useState, useEffect, etc.
// - Event handlers (onClick, etc.)
// - Browser APIs

export default function ClientComponent() {
  const [state, setState] = useState()
  return <button onClick={() => setState(...)}>Click</button>
}
```

## Component Patterns

### Props Interface
```tsx
interface EntryCardProps {
  entry: Entry
  onVibe?: (id: string) => void
  showActions?: boolean
}

export default function EntryCard({ entry, onVibe, showActions = true }: EntryCardProps) {
  // ...
}
```

### Loading State Pattern (CRITICAL)
```tsx
const [data, setData] = useState<Entry[]>([])
const [loading, setLoading] = useState(true)  // Start true!

useEffect(() => {
  fetchData()
    .then(setData)
    .finally(() => setLoading(false))
}, [])

// CORRECT order: loading → data → empty
return loading ? (
  <Loading />
) : data.length > 0 ? (
  <DataList data={data} />
) : (
  <EmptyState />
)
```

### Error Handling
```tsx
const [error, setError] = useState<string | null>(null)

const handleSubmit = async () => {
  try {
    setError(null)
    await submitData()
  } catch (e) {
    setError('Something went wrong. Please try again.')
  }
}

{error && (
  <div className="text-red-400 bg-red-400/10 p-3 rounded-lg">
    {error}
  </div>
)}
```

### State Collocation
```tsx
// BAD: Lifting state unnecessarily
function Parent() {
  const [inputValue, setInputValue] = useState('')
  return <Child value={inputValue} onChange={setInputValue} />
}

// GOOD: Keep state where it's used
function Child() {
  const [inputValue, setInputValue] = useState('')
  return <input value={inputValue} onChange={e => setInputValue(e.target.value)} />
}
```

## Hooks Usage

### useEffect Dependencies
```tsx
// WRONG: Missing dependencies
useEffect(() => {
  fetchEntries(userId)
}, [])  // userId missing!

// CORRECT: Include all dependencies
useEffect(() => {
  fetchEntries(userId)
}, [userId])
```

### useCallback for Handlers
```tsx
// Use when passing to child components
const handleVibe = useCallback((entryId: string) => {
  setVibes(prev => [...prev, entryId])
}, [])

<EntryCard onVibe={handleVibe} />
```

### useMemo for Expensive Computation
```tsx
// Use for expensive calculations
const sortedEntries = useMemo(() => {
  return [...entries].sort((a, b) => new Date(b.date) - new Date(a.date))
}, [entries])
```

## SongBird-Specific Patterns

### Auth Check
```tsx
'use client'
import { useUser } from '@clerk/nextjs'

export default function ProtectedComponent() {
  const { isLoaded, isSignedIn, user } = useUser()

  if (!isLoaded) return <Loading />
  if (!isSignedIn) return <SignInPrompt />

  return <div>Welcome, {user.firstName}</div>
}
```

### API Fetching
```tsx
const fetchEntries = async () => {
  setLoading(true)
  try {
    const res = await fetch('/api/entries')
    if (!res.ok) throw new Error('Failed to fetch')
    const data = await res.json()
    setEntries(data.entries)
  } catch (error) {
    console.error('Error:', error)
    setError('Failed to load entries')
  } finally {
    setLoading(false)
  }
}
```

### Theme Colors
```tsx
// Always use CSS variables for theming
<div className="bg-bg text-text">
  <p className="text-text/60">Secondary text</p>
  <button className="bg-accent">Primary CTA</button>
</div>
```

## Review Checklist

### Structure
- [ ] Single responsibility (one purpose per component)
- [ ] Props are typed with interface
- [ ] 'use client' only when necessary
- [ ] No prop drilling (use context if needed)

### State Management
- [ ] State colocated where used
- [ ] Loading state initialized to `true` for fetches
- [ ] Error states handled
- [ ] No unnecessary re-renders

### Effects
- [ ] All dependencies included
- [ ] Cleanup functions where needed
- [ ] No missing dependencies warnings

### Performance
- [ ] useMemo/useCallback for expensive operations
- [ ] Lists have stable `key` props
- [ ] Images use Next.js Image component

### Accessibility
- [ ] Interactive elements are focusable
- [ ] Proper ARIA attributes
- [ ] Keyboard navigation works

### Code Quality
- [ ] TypeScript types are correct
- [ ] No `any` types
- [ ] Consistent naming conventions
- [ ] Clear, descriptive variable names

## Output Format

Rate the component:
- ✅ Well-structured, follows patterns
- ⚠️ Minor issues, suggestions
- ❌ Significant problems, must fix

Provide specific code improvements.
