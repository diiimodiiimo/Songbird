# SongBird Design System — Overview

## Quick Start

This design system provides visual assets and motion concepts for SongBird, a personal music journaling app. The system is designed to feel **playful, calm, personal, and premium** — like a quiet songbird that remembers things.

---

## Documentation Structure

1. **[design-system-assets.md](./design-system-assets.md)** — Complete asset specifications
   - Navigation icons
   - Mood bird assets
   - Empty state illustrations
   - Asset naming conventions
   - Implementation notes

2. **[animation-specifications.md](./animation-specifications.md)** — Motion concepts
   - Bird idle animation
   - Loading states
   - Interaction reactions
   - Performance guidelines
   - Accessibility considerations

3. **[midjourney-prompts.md](./midjourney-prompts.md)** — Quick reference
   - Copy-paste ready prompts
   - Generation tips
   - Quality checklist

---

## Core Principles

### Visual Language
- **Minimal line icons** — Expressive but consistent
- **Fine-grain texture** — Print-like quality
- **Dark UI optimized** — Light elements on dark background
- **Warm but muted tones** — No neon, no harsh contrast

### The Bird
- **One canonical bird** — Multiple emotional states
- **Never blocks content** — Positioned thoughtfully
- **Alive but respectful** — Subtle motion, never distracting
- **Emotion-first** — Felt, not cartooned

### Motion
- **Gentle and subtle** — Never loud or celebratory
- **Performance-first** — GPU-accelerated transforms
- **Accessible** — Respects `prefers-reduced-motion`
- **Purposeful** — Each animation has clear intent

---

## Asset Categories

### 1. Navigation Icons (5 icons)
- Today, Feed, Memory, Insights, Profile
- 24x24px base, 1:1 aspect ratio
- Active states included

### 2. Mood Birds (6 moods)
- Happy, Sad, Calm, Nostalgic, Tired, Hype
- 120x120px base, 1:1 aspect ratio
- Fine-grain texture, emotional poses

### 3. Empty States (3 illustrations)
- No song yet, No memories yet, No friends yet
- 300x533px base, 9:16 aspect ratio
- Minimal, suggestive concepts

### 4. Motion Concepts (8 animations)
- Idle, Save reaction, Loading states, Interactions
- CSS keyframes or Lottie
- Conceptual specifications only

---

## File Structure

```
/public
  /icons
    /navigation
      icon-today.png (+ active)
      icon-feed.png (+ active)
      icon-memory.png (+ active)
      icon-insights.png (+ active)
      icon-profile.png (+ active)
  /birds
    /moods
      bird-mood-happy.png
      bird-mood-sad.png
      bird-mood-calm.png
      bird-mood-nostalgic.png
      bird-mood-tired.png
      bird-mood-hype.png
  /illustrations
    /empty-states
      empty-no-song.png
      empty-no-memories.png
      empty-no-friends.png
```

---

## Implementation Workflow

1. **Generate Assets** (Midjourney)
   - Use prompts from `midjourney-prompts.md`
   - Generate base set
   - Refine for consistency

2. **Export & Optimize**
   - Export at all required sizes (base, @2x, @3x)
   - Ensure transparent backgrounds
   - Verify dark mode optimization

3. **Implement Icons**
   - Add to `/public/icons/navigation/`
   - Use Next.js `Image` component
   - Create active state variants

4. **Implement Birds**
   - Add to `/public/birds/moods/`
   - Create React component (see animation-specifications.md)
   - Apply animation classes

5. **Implement Empty States**
   - Add to `/public/illustrations/empty-states/`
   - Use in empty state components
   - Lazy load for performance

6. **Add Animations**
   - Create CSS keyframes
   - Implement React components
   - Test with `prefers-reduced-motion`

---

## Color Reference

Based on existing UI tokens:
- **Background**: `bg-bg` (dark)
- **Surface**: `bg-surface` (slightly lighter dark)
- **Text**: `text-text` (light)
- **Accent**: `text-accent` (warm accent)

**For Assets**:
- Icons: Light lines (matching `text-text`)
- Birds: Warm tones (amber, gold, sepia)
- Empty States: Muted, warm but not bright

---

## Constraints (Non-Negotiable)

❌ **No emojis**
❌ **No bright neon palettes**
❌ **No heavy gamification visuals**
❌ **No full character redesign**
❌ **No UI layout changes**
❌ **No blocking UI elements**
❌ **No constant motion**
❌ **No loud celebratory effects**

✅ **Minimal line icons**
✅ **Fine-grain texture**
✅ **Dark UI optimized**
✅ **Warm but muted tones**
✅ **Emotion-first design**
✅ **Gentle, subtle motion**
✅ **Premium but warm feel**

---

## Success Criteria

The design system is successful when:

1. **Emotionally consistent** across all assets
2. **Bird feels alive** but respectful of content
3. **Implementable** without rewriting UI
4. **Scalable** into v1.5 and v2
5. **Performance-optimized** (60fps animations)
6. **Accessible** (motion preferences respected)
7. **Premium feel** without being sterile

---

## Next Steps

1. Generate all Midjourney assets
2. Export at required sizes
3. Create asset directory structure
4. Implement navigation icons
5. Implement mood bird system
6. Add empty state illustrations
7. Create animation CSS
8. Build React components
9. Test on devices
10. Document usage in codebase

---

## Questions?

Refer to:
- **Asset specs**: `design-system-assets.md`
- **Animation details**: `animation-specifications.md`
- **Prompt reference**: `midjourney-prompts.md`

---

**Design System v1.0** | SongBird Project


