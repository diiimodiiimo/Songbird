# /code-review

Perform a thorough code review on the current file or changes. Act like a thoughtful senior developer who balances quality with pragmatism.

## Review Mindset

### Goals
- Catch bugs before they ship
- Ensure code is maintainable
- Share knowledge and improve the codebase
- Be helpful, not nitpicky

### Principles
- **Assume good intent** - author tried their best
- **Explain the "why"** - not just what's wrong
- **Suggest, don't demand** - "Consider..." not "You must..."
- **Praise good work** - acknowledge what's done well

## Review Checklist

### Correctness
- [ ] Logic is correct for the intended purpose
- [ ] Edge cases are handled
- [ ] Error handling is appropriate
- [ ] No obvious bugs

### Security
- [ ] Auth checks in place
- [ ] User can only access their own data
- [ ] Input is validated
- [ ] No sensitive data exposed

### Performance
- [ ] No obvious performance issues
- [ ] Appropriate use of caching/memoization
- [ ] Database queries are efficient
- [ ] No unnecessary re-renders

### Maintainability
- [ ] Code is readable without comments
- [ ] Functions are focused (single responsibility)
- [ ] No magic numbers/strings
- [ ] Follows existing patterns

### TypeScript
- [ ] Types are correct and helpful
- [ ] No `any` without justification
- [ ] Interfaces defined for data structures
- [ ] Props typed for components

### Testing
- [ ] Is this testable?
- [ ] Are edge cases covered?
- [ ] Would I trust this in production?

## SongBird Standards

### Must Follow
- Loading state before empty state pattern
- Auth check on all API routes
- Design system colors (bg-bg, text-text, etc.)
- Prisma for database operations
- Clerk for authentication

### Naming Conventions
- Components: PascalCase
- Files: kebab-case or PascalCase for components
- Variables: camelCase
- Constants: UPPER_SNAKE_CASE

### Code Organization
```typescript
'use client'

// 1. External imports
import { useState, useEffect } from 'react'
import { useUser } from '@clerk/nextjs'

// 2. Internal imports
import { EntryCard } from '@/components/EntryCard'

// 3. Types
interface Props {
  id: string
}

// 4. Component
export default function MyComponent({ id }: Props) {
  // 5. Hooks
  const { user } = useUser()
  const [state, setState] = useState()
  
  // 6. Effects
  useEffect(() => {}, [])
  
  // 7. Handlers
  const handleClick = () => {}
  
  // 8. Render
  return <div>...</div>
}
```

## Comment Types

### Blocking (Must Fix)
❌ **Bug:** This will cause X to fail when Y
❌ **Security:** User could access others' data here
❌ **Crash:** This will throw when Z is null

### Non-Blocking (Should Consider)
⚠️ **Performance:** Consider memoizing this
⚠️ **Readability:** This could be clearer as...
⚠️ **Pattern:** We usually do X instead of Y

### Nitpicks (Optional)
💭 **Nit:** Prefer const over let here
💭 **Style:** This could be more concise as...

### Praise
✅ **Nice:** Clean solution to the X problem
✅ **Good:** Thanks for handling the edge case

## Output Format

### Summary
Brief overall assessment (1-2 sentences)

### Must Fix
1. **[Location]** Issue description
   - Why it's a problem
   - Suggested fix

### Should Fix
1. **[Location]** Issue description
   - Why it matters
   - Suggested improvement

### Consider
1. **[Location]** Optional improvement
   - Benefit

### Looks Good
- What was done well
- Patterns worth keeping

### Approved: ✅ / Needs Changes: 🔄



