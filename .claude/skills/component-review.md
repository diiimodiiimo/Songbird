# /component-review

Review React components for best practices, code quality, and maintainability. Act like a senior React developer doing a thorough code review.

## Component Structure

### File Organization
- [ ] Single responsibility (one main purpose per component)
- [ ] Reasonable file length (< 300 lines ideally)
- [ ] Logical code ordering (hooks, handlers, render)
- [ ] Clean exports

### Naming
- [ ] PascalCase for component names
- [ ] Descriptive, intention-revealing names
- [ ] Consistent naming with codebase conventions

## React Patterns

### Hooks Usage
```typescript
// Good: Hooks at top level, in consistent order
export default function MyComponent() {
  const { user, isLoaded } = useUser()
  const [state, setState] = useState<Type>([])
  const [loading, setLoading] = useState(false)
  
  useEffect(() => {}, [dependencies])
}
```

### State Management
- [ ] Minimal state (avoid derived state)
- [ ] State lifted appropriately (not too high, not too low)
- [ ] Loading/error states handled
- [ ] Initial states are sensible

### Effects
- [ ] Dependencies array is complete
- [ ] Cleanup functions where needed
- [ ] No effects that should be event handlers
- [ ] Avoid async effects without cleanup

### Event Handlers
- [ ] Named clearly (handleClick, onSubmit)
- [ ] Extracted from JSX when complex
- [ ] useCallback for handlers passed to children (if needed)

## TypeScript

### Types
- [ ] Props interface defined
- [ ] No `any` types
- [ ] Proper generic usage
- [ ] Event types specified (React.ChangeEvent, etc.)

### Pattern
```typescript
interface MyComponentProps {
  title: string
  onAction: (id: string) => void
  optional?: boolean
}

export default function MyComponent({ title, onAction, optional = false }: MyComponentProps) {
  // ...
}
```

## Loading States (SongBird Pattern)

### Required Pattern
```typescript
// ✅ Correct
{loading ? (
  <div>Loading...</div>
) : data.length > 0 ? (
  <div>{/* Show data */}</div>
) : (
  <div>No data found</div>
)}

// ❌ Wrong - shows empty state while loading
{data.length > 0 ? (
  <div>{/* Show data */}</div>
) : (
  <div>No data found</div>
)}
```

## Data Fetching

### Pattern
```typescript
const fetchData = async () => {
  setLoading(true)
  try {
    const res = await fetch('/api/endpoint')
    const data = await res.json()
    if (res.ok) {
      setData(data.items)
    } else {
      setError(data.error)
    }
  } catch (error) {
    console.error('Error:', error)
    setError('Failed to load data')
  } finally {
    setLoading(false)
  }
}

useEffect(() => {
  fetchData()
}, [dependency])
```

## JSX Quality

### Readability
- [ ] Consistent indentation
- [ ] Logical grouping of elements
- [ ] Extracted complex conditionals
- [ ] Comments for non-obvious logic

### Accessibility
- [ ] Button for actions, anchor for navigation
- [ ] Alt text on images
- [ ] Labels on form inputs
- [ ] Proper heading structure

### Styling
- [ ] Uses design system classes (bg-bg, text-text, etc.)
- [ ] Consistent spacing
- [ ] No hardcoded colors/values
- [ ] Responsive classes where needed

## Performance

- [ ] No inline object/array creation in JSX
- [ ] Keys on list items (not index)
- [ ] Large lists virtualized
- [ ] Heavy computations memoized
- [ ] Images optimized (Next.js Image)

## Common Issues to Check

1. **Missing loading state** before empty state
2. **Hardcoded API URLs** instead of relative paths
3. **Missing error handling** in fetch calls
4. **Unused imports** and dead code
5. **Magic numbers/strings** without constants
6. **Console.log** left in production code
7. **Missing TypeScript types**

## Output Format

**Rating:** ⭐⭐⭐⭐⭐

**Strengths:**
- What the component does well

**Issues:**
1. [Severity] Issue description
   - Location
   - Fix

**Refactor Suggestions:**
- Optional improvements for maintainability

