# /performance-audit

Analyze the current file, component, or feature for performance issues and optimization opportunities. Think like a performance engineer preparing for production load.

## React/Next.js Performance

### Component Rendering
- Unnecessary re-renders (missing `useMemo`, `useCallback`)
- Large components that should be split
- Missing React.memo for pure components
- State updates triggering cascading renders

### Data Fetching
- Multiple sequential requests that could be parallel
- Missing loading states (causes layout shift)
- Over-fetching (requesting more data than needed)
- Missing error boundaries

### Bundle Size
- Large imports that could be dynamic
- Heavy libraries with smaller alternatives
- Unused code and dead imports

### Images
- Missing Next.js `Image` component
- No size optimization
- Missing lazy loading
- Base64 images in bulk data

## Database/API Performance

### Query Optimization
- N+1 query patterns
- Missing database indexes for common queries
- Fetching all fields instead of using `select`
- Count queries that could use `.length`
- Pagination for large datasets

### API Response Size
- Returning more data than needed
- Base64 images in bulk responses
- Missing compression
- Duplicate data in responses

### Connection Management
- Prisma connection pooling for serverless
- Database connection reuse

## Client-Side Performance

### Loading & Rendering
- Blocking renders during data fetch
- Layout shift from loading states
- Flash of empty state before data loads

### State Management
- Excessive useState calls
- Missing derived state (computing instead of storing)
- Redundant state across components

### Animations
- Janky animations (not using transforms)
- Missing `will-change` for animated elements
- Animations running during scroll

## Vercel/Serverless Considerations

- Cold start optimization
- Function timeout risks (large queries)
- Edge-compatible code where possible
- Proper caching headers

## Metrics to Consider

- Time to First Byte (TTFB)
- First Contentful Paint (FCP)
- Largest Contentful Paint (LCP)
- Cumulative Layout Shift (CLS)
- Total Blocking Time (TBT)

## Output Format

🔴 **Critical** - Impacts user experience significantly
🟡 **Warning** - Noticeable performance impact  
🟢 **Optimization** - Nice to have improvements

For each issue:
1. Problem description
2. Impact assessment
3. Specific fix with code
4. Expected improvement

