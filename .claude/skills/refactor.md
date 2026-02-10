# /refactor

Suggest code refactoring improvements without changing external behavior. Act like a senior engineer improving code quality.

## Refactoring Principles

1. **Preserve behavior** - Don't change what the code does
2. **Improve readability** - Make it easier to understand
3. **Reduce complexity** - Simplify where possible
4. **Eliminate duplication** - DRY (Don't Repeat Yourself)
5. **Improve maintainability** - Make future changes easier

## Common Refactoring Patterns

### Extract Function
Before:
```typescript
async function handleSubmit() {
  // 15 lines of validation
  if (!title) return setError('Title required')
  if (title.length > 100) return setError('Title too long')
  // ... more validation

  // 10 lines of API call
  const response = await fetch('/api/entries', { ... })
  const data = await response.json()
  
  // 10 lines of success handling
  setEntries([...entries, data])
  setSuccess(true)
}
```

After:
```typescript
async function handleSubmit() {
  const validationError = validateEntry({ title, notes })
  if (validationError) return setError(validationError)

  const data = await createEntry({ title, notes })
  handleSuccess(data)
}

function validateEntry({ title, notes }) {
  if (!title) return 'Title required'
  if (title.length > 100) return 'Title too long'
  return null
}
```

### Consolidate Conditional
Before:
```typescript
if (user.isPremium) {
  showPremiumFeature()
}
if (user.isFoundingMember) {
  showPremiumFeature()
}
```

After:
```typescript
const hasPremiumAccess = user.isPremium || user.isFoundingMember
if (hasPremiumAccess) {
  showPremiumFeature()
}
```

### Replace Magic Numbers
Before:
```typescript
if (entries.length >= 365) {
  unlockBird('painted-bunting')
}
```

After:
```typescript
const LEGENDARY_BIRD_STREAK = 365

if (entries.length >= LEGENDARY_BIRD_STREAK) {
  unlockBird('painted-bunting')
}
```

### Replace Nested Conditionals with Early Return
Before:
```typescript
async function getEntries(userId: string) {
  if (userId) {
    const user = await getUser(userId)
    if (user) {
      const entries = await fetchEntries(user.id)
      if (entries.length > 0) {
        return entries
      } else {
        return []
      }
    } else {
      throw new Error('User not found')
    }
  } else {
    throw new Error('User ID required')
  }
}
```

After:
```typescript
async function getEntries(userId: string) {
  if (!userId) throw new Error('User ID required')
  
  const user = await getUser(userId)
  if (!user) throw new Error('User not found')
  
  return await fetchEntries(user.id)
}
```

### Extract Component
Before:
```tsx
function Dashboard() {
  return (
    <div>
      {/* 50 lines of header JSX */}
      <nav>...</nav>
      
      {/* 100 lines of main content */}
      <main>...</main>
      
      {/* 50 lines of footer JSX */}
      <footer>...</footer>
    </div>
  )
}
```

After:
```tsx
function Dashboard() {
  return (
    <div>
      <Header />
      <MainContent />
      <Footer />
    </div>
  )
}
```

### Use Map for Switch Statements
Before:
```typescript
function getBirdColor(birdId: string) {
  switch (birdId) {
    case 'cardinal':
      return '#c41e3a'
    case 'bluebird':
      return '#1e90ff'
    case 'goldfinch':
      return '#ffd700'
    default:
      return '#e07b53'
  }
}
```

After:
```typescript
const BIRD_COLORS: Record<string, string> = {
  'cardinal': '#c41e3a',
  'bluebird': '#1e90ff',
  'goldfinch': '#ffd700',
}

function getBirdColor(birdId: string) {
  return BIRD_COLORS[birdId] ?? '#e07b53'
}
```

### Compose Hooks
Before:
```tsx
function EntryForm() {
  const [title, setTitle] = useState('')
  const [artist, setArtist] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  
  const handleSubmit = async () => {
    setLoading(true)
    setError('')
    try { ... }
    catch (e) { setError(e.message) }
    finally { setLoading(false) }
  }
}
```

After:
```tsx
function useEntryForm() {
  const [formData, setFormData] = useState({ title: '', artist: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const submit = async () => { ... }

  return { formData, setFormData, loading, error, submit }
}

function EntryForm() {
  const { formData, setFormData, loading, error, submit } = useEntryForm()
  // Much cleaner component
}
```

## When NOT to Refactor

- Don't refactor working code without reason
- Don't refactor during a critical fix
- Don't refactor if you don't understand the code
- Don't over-abstract for hypothetical future needs

## Refactoring Checklist

- [ ] Understand current behavior completely
- [ ] Have tests or verification method
- [ ] Make small, incremental changes
- [ ] Verify behavior after each change
- [ ] Improve naming along the way
- [ ] Remove unused code

## Output Format

```markdown
## Refactoring Suggestions

### High Impact
1. **[Pattern Name]** in `file.ts`
   - Current: [description]
   - Suggested: [description]
   - Benefit: [why it's better]

### Medium Impact
...

### Low Impact
...
```
