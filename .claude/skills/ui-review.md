# /ui-review

Review UI/UX for design system compliance, consistency, and user experience. Act like a senior product designer with SongBird's design philosophy in mind.

## Design Philosophy

> "A robin on a branch at dawn: warm chest, cool surroundings, attentive, personal."

- Warm and personal, not clinical
- Core functionality over flashy features
- Social features are optional

## Color System

SongBird uses CSS variables for theming. Each theme is inspired by a bird:

```css
/* Core variables (all themes) */
--bg: /* Background */
--text: /* Primary text */
--text-secondary: /* Secondary text */
--accent: /* Primary accent */
--accent-hover: /* Accent hover state */
--surface: /* Card/elevated surfaces */
--card: /* Card backgrounds */
```

### Usage in Components
```tsx
// Always use CSS variables, not hardcoded colors
<div className="bg-bg text-text">
  <p className="text-text/60">Secondary text</p>
  <button className="bg-accent text-bg">Primary CTA</button>
  <div className="bg-surface rounded-xl">Card content</div>
</div>
```

## Component Patterns

### Loading States (CRITICAL)
```tsx
// CORRECT: Loading before empty
{loading ? (
  <div className="animate-pulse">Loading...</div>
) : entries.length > 0 ? (
  <div>{/* Show entries */}</div>
) : (
  <div>No entries found</div>
)}

// WRONG: Empty shows before loading completes
{entries.length === 0 ? (
  <div>No entries</div>  // Flashes while loading!
) : (
  <div>{/* Show entries */}</div>
)}
```

### Card Pattern
```tsx
<div className="bg-surface rounded-xl p-4 border border-white/10">
  {/* Card content */}
</div>
```

### Button Patterns
```tsx
// Primary CTA
<button className="bg-accent text-bg px-6 py-3 rounded-full font-medium hover:bg-accent/90 transition-colors">
  Primary Action
</button>

// Secondary button
<button className="bg-surface text-text px-4 py-2 rounded-lg hover:bg-surface/80 transition-colors">
  Secondary
</button>

// Ghost button
<button className="text-text/60 hover:text-text transition-colors">
  Cancel
</button>
```

### Input Pattern
```tsx
<input
  type="text"
  className="w-full bg-surface border border-text/20 rounded-lg px-4 py-3 text-text placeholder:text-text/40 focus:border-accent outline-none transition-colors"
  placeholder="Type here..."
/>
```

## Spacing System

Use Tailwind's spacing scale consistently:
- `p-2`, `p-4`, `p-6` for padding
- `gap-2`, `gap-3`, `gap-4` for flex/grid gaps
- `mb-2`, `mb-4`, `mb-6` for margins
- `rounded-lg` for cards, `rounded-full` for buttons/pills

## Typography

```tsx
// Titles use custom font
<h1 style={{ fontFamily: 'var(--font-title)' }}>Page Title</h1>

// Body uses system fonts via Tailwind
<p className="text-base text-text">Body text</p>
<p className="text-sm text-text/60">Secondary text</p>
<p className="text-xs text-text/40">Tertiary/meta text</p>
```

## Responsive Design

Mobile-first approach:
```tsx
<div className="px-4 sm:px-6 md:px-8">
  <h1 className="text-xl sm:text-2xl md:text-3xl">Responsive Title</h1>
</div>
```

## Dark Mode (Default)

SongBird is dark-mode by default. All themes are dark variations.

## Review Checklist

### Layout & Structure
- [ ] Uses semantic HTML
- [ ] Proper container/padding structure
- [ ] Consistent spacing throughout
- [ ] Mobile-responsive (test at 375px)

### Colors & Theme
- [ ] Uses CSS variables, not hardcoded colors
- [ ] Text has proper contrast
- [ ] Accent used consistently for CTAs
- [ ] Surfaces properly layered (bg → surface → card)

### States
- [ ] Loading states show before empty states
- [ ] Hover states on interactive elements
- [ ] Focus states for accessibility
- [ ] Disabled states where appropriate

### Animations
- [ ] Subtle transitions (not jarring)
- [ ] `animate-pulse` for loading
- [ ] `transition-colors` for hover
- [ ] `hover:scale-105` for interactive cards

### Accessibility
- [ ] Proper heading hierarchy
- [ ] Alt text on images
- [ ] Keyboard navigable
- [ ] Color contrast (4.5:1 minimum)

### SongBird-Specific
- [ ] ThemeBird used where appropriate
- [ ] Spotify attribution visible on song data
- [ ] Streak/bird unlocks celebrated appropriately
- [ ] Warm, personal tone in copy

## Output Format

Rate each area:
- ✅ Excellent (follows all best practices)
- ⚠️ Needs improvement (minor issues)
- ❌ Critical issue (must fix)

Provide specific recommendations with code examples.
