# /accessibility-check

Review the current component or page for accessibility compliance and inclusive design. Act like an accessibility specialist ensuring WCAG 2.1 AA compliance.

## Keyboard Navigation

- [ ] All interactive elements are focusable
- [ ] Focus order is logical (follows visual order)
- [ ] Focus states are visible
- [ ] No keyboard traps
- [ ] Skip links for repetitive content
- [ ] Escape key closes modals/dropdowns

## Screen Reader Support

### Semantic HTML
- [ ] Proper heading hierarchy (h1 → h2 → h3)
- [ ] Landmarks used (`main`, `nav`, `header`, `footer`)
- [ ] Lists for list content (`ul`, `ol`, `li`)
- [ ] Buttons for actions, links for navigation
- [ ] Tables with proper headers

### ARIA
- [ ] `aria-label` for icon-only buttons
- [ ] `aria-hidden="true"` for decorative images
- [ ] `aria-live` for dynamic content updates
- [ ] `role` attributes where semantic HTML isn't possible
- [ ] `aria-expanded` for collapsible content
- [ ] `aria-describedby` for form errors

### Images & Icons
- [ ] Meaningful `alt` text for informative images
- [ ] Empty `alt=""` for decorative images
- [ ] Icon buttons have text labels (visible or `aria-label`)
- [ ] SVG icons have `role="img"` and `aria-label`

## Visual Accessibility

### Color Contrast
- [ ] Text contrast ratio ≥ 4.5:1 (normal text)
- [ ] Text contrast ratio ≥ 3:1 (large text, 18px+)
- [ ] UI component contrast ≥ 3:1
- [ ] Don't rely on color alone to convey information

### Text
- [ ] Minimum 16px base font size
- [ ] Text resizable up to 200% without breaking layout
- [ ] Line height ≥ 1.5 for body text
- [ ] Adequate spacing between paragraphs

### Motion
- [ ] Respects `prefers-reduced-motion`
- [ ] No auto-playing animations
- [ ] User can pause/stop animations
- [ ] No flashing content (seizure risk)

## Forms

- [ ] All inputs have visible labels
- [ ] Required fields clearly indicated
- [ ] Error messages are descriptive
- [ ] Error messages linked to inputs (`aria-describedby`)
- [ ] Form validation on submit, not just on blur
- [ ] Autocomplete attributes for common fields

## Touch & Mobile

- [ ] Touch targets ≥ 44x44px
- [ ] Adequate spacing between targets
- [ ] No hover-only interactions on touch devices
- [ ] Pinch-to-zoom not disabled

## SongBird-Specific Checks

### Music Content
- [ ] Song titles/artists readable by screen readers
- [ ] Album art has descriptive alt text
- [ ] Audio previews have controls

### Navigation
- [ ] Bottom nav accessible via keyboard
- [ ] Tab icons have labels
- [ ] Active state announced

### Feed & Social
- [ ] Entry cards have proper structure
- [ ] User mentions are linked properly
- [ ] Time-relative text is clear ("2 hours ago")

## Testing Recommendations

1. **Keyboard-only**: Navigate entire UI without mouse
2. **Screen reader**: Test with VoiceOver (Mac) or NVDA (Windows)
3. **Color blindness**: Use simulator tools
4. **Zoom**: Test at 200% zoom
5. **Reduced motion**: Enable and verify

## Output Format

**Critical (Barriers):**
- Issues that prevent access for some users

**Serious (Significant):**
- Issues that cause difficulty

**Moderate:**
- Issues that cause some frustration

**Minor:**
- Best practice improvements

Include specific code fixes for each issue.



