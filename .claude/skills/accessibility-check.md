# /accessibility-check

Review features for WCAG 2.1 AA compliance and inclusive design. Act like an accessibility specialist.

## Key Standards

- **WCAG 2.1 Level AA** - Target standard
- **Color contrast** - 4.5:1 for text, 3:1 for large text
- **Keyboard navigation** - All interactive elements reachable
- **Screen readers** - Semantic HTML and ARIA

## Checklist

### Semantic HTML
- [ ] Proper heading hierarchy (h1 → h2 → h3)
- [ ] `<nav>` for navigation
- [ ] `<main>` for primary content
- [ ] `<button>` for actions, `<a>` for links
- [ ] `<label>` associated with form inputs

### Keyboard Navigation
- [ ] All interactive elements focusable
- [ ] Tab order is logical
- [ ] Focus visible (outline/ring)
- [ ] No keyboard traps
- [ ] Escape closes modals

### Focus States
```tsx
// SongBird pattern
<button className="focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-bg">
  Click Me
</button>

// Form inputs
<input className="focus:border-accent focus:ring-1 focus:ring-accent outline-none" />
```

### Color Contrast
```tsx
// Good: High contrast on dark background
<p className="text-text">Primary text</p>        // ~15:1 contrast
<p className="text-text/60">Secondary text</p>   // ~9:1 contrast

// Check: Use WebAIM Contrast Checker
// Avoid: text-text/40 for important info (may fail)
```

### Images & Media
```tsx
// Always provide alt text
<Image 
  src={albumArt} 
  alt={`${songTitle} by ${artist} album cover`}
/>

// Decorative images
<Image src={decoration} alt="" aria-hidden="true" />

// Audio controls
<audio controls aria-label="Song preview">
  <source src={previewUrl} type="audio/mpeg" />
</audio>
```

### ARIA Labels
```tsx
// Icon-only buttons
<button aria-label="Add to favorites">
  <HeartIcon />
</button>

// Loading states
<div aria-busy="true" aria-label="Loading entries">
  <Spinner />
</div>

// Live regions
<div aria-live="polite">
  Entry saved successfully!
</div>
```

### Form Accessibility
```tsx
// Labels
<label htmlFor="notes" className="block mb-2">
  Notes
</label>
<textarea 
  id="notes"
  aria-describedby="notes-help"
/>
<p id="notes-help" className="text-text/60 text-sm">
  Optional: Add thoughts about this song
</p>

// Required fields
<input 
  required
  aria-required="true"
  aria-invalid={hasError}
  aria-describedby={hasError ? "error-msg" : undefined}
/>
```

### Modal Accessibility
```tsx
// Focus trap
<dialog 
  role="dialog"
  aria-modal="true"
  aria-labelledby="modal-title"
>
  <h2 id="modal-title">Add Entry</h2>
  {/* Focus first focusable element on open */}
  {/* Return focus to trigger on close */}
</dialog>
```

### Motion & Animations
```tsx
// Respect reduced motion preference
<div className="motion-safe:animate-pulse motion-reduce:opacity-50">
  Loading...
</div>

// CSS approach
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

## Testing Tools

### Automated
- **axe DevTools** - Browser extension
- **Lighthouse** - Accessibility audit
- **WAVE** - Web accessibility evaluation

### Manual
- **Keyboard-only navigation** - Tab through entire page
- **Screen reader** - NVDA (Windows), VoiceOver (Mac/iOS)
- **Zoom 200%** - Content should remain usable

## SongBird-Specific Issues

### Album Art
- Always include song/artist in alt text
- Use empty alt for purely decorative images

### Spotify Button
```tsx
<a 
  href={spotifyUrl}
  target="_blank"
  rel="noopener noreferrer"
  aria-label={`Listen to ${songTitle} on Spotify (opens in new tab)`}
>
  <SpotifyIcon aria-hidden="true" />
  Listen on Spotify
</a>
```

### Theme Bird
```tsx
<ThemeBird 
  aria-label={`Your bird: ${birdName}`}
  role="img"
/>
```

### Empty States
```tsx
// Announce to screen readers
<div role="status">
  No entries yet. Add your first song!
</div>
```

## Output Format

Rate each area:
- ✅ Compliant
- ⚠️ Partial compliance (fix recommended)  
- ❌ Non-compliant (must fix)

Provide specific fixes with code examples.
