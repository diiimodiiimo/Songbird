# /performance-audit

Perform a performance audit focused on load times, rendering efficiency, and user experience. Act like a performance engineer optimizing for real users.

## Key Metrics

| Metric | Target | Critical |
|--------|--------|----------|
| LCP (Largest Contentful Paint) | < 2.5s | > 4s |
| FID (First Input Delay) | < 100ms | > 300ms |
| CLS (Cumulative Layout Shift) | < 0.1 | > 0.25 |
| TTFB (Time to First Byte) | < 600ms | > 1.5s |

## Frontend Performance

### React Component Optimization

```tsx
// Use React.memo for expensive components
const EntryCard = React.memo(({ entry }: { entry: Entry }) => {
  return <div>{/* ... */}</div>
})

// Use useMemo for expensive calculations
const sortedEntries = useMemo(() => {
  return entries.sort((a, b) => b.date - a.date)
}, [entries])

// Use useCallback for handlers passed to children
const handleVibe = useCallback((entryId: string) => {
  // ...
}, [/* deps */])
```

### Lazy Loading
```tsx
// Dynamic imports for heavy components
const Wrapped = dynamic(() => import('./WrappedTab'), {
  loading: () => <LoadingSkeleton />,
})

// Lazy load images
<Image
  src={albumArt}
  alt={songTitle}
  loading="lazy"
  placeholder="blur"
  blurDataURL={PLACEHOLDER}
/>
```

### Bundle Size
```bash
# Analyze bundle
npm run build
npx @next/bundle-analyzer
```

Watch for:
- Large node_modules (lodash → lodash-es)
- Unused imports
- Heavy libraries (moment → dayjs)

## API Performance

### Response Size
```typescript
// BAD: Fetching all fields
const { data } = await supabase.from('entries').select('*')

// GOOD: Select only needed fields
const { data } = await supabase
  .from('entries')
  .select('id, songTitle, artist, albumArt')
  .limit(50)
```

### Pagination
```typescript
// Implement cursor-based pagination
const { data } = await supabase
  .from('entries')
  .select('*')
  .order('date', { ascending: false })
  .range(offset, offset + pageSize - 1)
```

### Caching
```typescript
// Use Next.js cache for static data
export const revalidate = 3600 // Cache for 1 hour

// Use SWR for client-side caching
const { data } = useSWR('/api/entries', fetcher, {
  revalidateOnFocus: false,
  dedupingInterval: 60000,
})
```

## Database Performance

### Indexes
```sql
-- Essential indexes for common queries
CREATE INDEX idx_entries_user_date ON entries(userId, date);
CREATE INDEX idx_vibes_entry ON vibes(entryId);
CREATE INDEX idx_comments_entry ON comments(entryId);
```

### N+1 Query Detection
```typescript
// BAD: N+1 queries
for (const entry of entries) {
  entry.vibeCount = await getVibeCount(entry.id)
}

// GOOD: Single query with join
const { data } = await supabase
  .from('entries')
  .select(`
    *,
    vibes(count)
  `)
```

### Heavy Field Avoidance
```typescript
// Exclude base64 images from bulk queries
const { data } = await supabase
  .from('users')
  .select('id, username, email')  // NOT image (base64)
```

## Image Optimization

### Next.js Image Component
```tsx
import Image from 'next/image'

<Image
  src={albumArt}
  alt={songTitle}
  width={64}
  height={64}
  className="rounded"
  priority={isAboveFold}
/>
```

### Album Art Caching
- Spotify album art URLs are already CDN-hosted
- Don't store base64 locally
- Use appropriate sizes (64x64 for lists, 300x300 for details)

## Serverless Optimization

### Cold Start Reduction
```typescript
// Minimize imports in API routes
import { getSupabase } from '@/lib/supabase' // Light
// NOT: import * as everything from 'heavy-library'
```

### Edge Functions
```typescript
// Use edge runtime for simple operations
export const runtime = 'edge'

export async function GET() {
  // Lightweight logic only
}
```

## Monitoring Checklist

### Before Changes
- [ ] Measure current performance baseline
- [ ] Identify slowest pages/routes
- [ ] Check Vercel Analytics

### During Development
- [ ] Test with slow 3G throttling
- [ ] Check network waterfall
- [ ] Monitor bundle size changes

### After Deployment
- [ ] Verify Lighthouse scores
- [ ] Check real user metrics
- [ ] Monitor error rates

## Output Format

**Performance Score:** X/100

**Critical Issues:**
1. Issue with impact and fix

**Warnings:**
1. Issue with recommendation

**Opportunities:**
1. Optimization suggestion with expected impact
