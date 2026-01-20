# /ui-review

Review the current component or page for UI/UX quality, design system compliance, and visual polish. Act like a senior product designer with a keen eye for detail.

## Design System Compliance

### Colors (Check against theme tokens)
- Background: `bg-bg` (not hardcoded colors)
- Surfaces/Cards: `bg-surface`
- Text: `text-text`, `text-text/60` for muted
- Accent: `text-accent`, `bg-accent`
- Avoid: hardcoded hex values, generic Tailwind colors like `bg-gray-900`

### Typography
- Consistent type scale (h1: 2rem, h2: 1.5rem, h3: 1.125rem, body: 1rem)
- Proper hierarchy (don't skip heading levels)
- Use design system fonts (Inter for body, Crimson Text for headings)

### Spacing
- Consistent padding: `p-3` (12px), `p-5` (20px), `p-8` (32px)
- Consistent gaps: `gap-2`, `gap-3`, `gap-4`
- Card radius: `rounded-xl` (16px) or `rounded-lg` (8px)

## UX Patterns

### Loading States
- Check: Loading appears BEFORE empty states
- Pattern: `loading ? <Loading /> : data.length > 0 ? <Content /> : <Empty />`
- Use `animate-pulse` or spinners consistently

### Empty States
- Centered, friendly messaging
- Actionable (tell user what to do)
- Use `text-text/60` (muted) color

### Error States
- Clear, user-friendly error messages
- Suggest what to do next
- Don't expose technical details

### Responsive Design
- Mobile-first approach
- Use `sm:`, `md:`, `lg:` breakpoints properly
- Bottom nav friendly spacing (safe area)

## Accessibility

- Check color contrast ratios
- Proper focus states
- Meaningful alt text on images
- Keyboard navigation support

## Visual Polish

- Consistent shadows and borders
- Proper image handling (Next.js Image component)
- Smooth transitions (`transition-colors`, etc.)
- No layout shifts during loading

## Output Format

Rate overall: ⭐⭐⭐⭐⭐ (out of 5)

List issues by priority:
1. **Must Fix** - Broken or severely non-compliant
2. **Should Fix** - Noticeable quality issues
3. **Nice to Have** - Polish and refinements

Provide specific code fixes for each issue.

