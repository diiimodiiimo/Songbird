# SongBird Visual System — Asset Specifications

## Design Philosophy
**Playful, calm, personal notebook** | **Emotion-first, never loud** | **Gentle delight, not hype** | **Premium but warm**

---

## 1. Bottom Navigation Icons

### Style Requirements
- Minimal line icons (1-2px stroke weight)
- Expressive variance allowed (icons don't need to be identical)
- No emojis
- Must feel part of SongBird universe (musical, memory-related, organic)
- Dark UI optimized (light lines on dark background)
- 1:1 aspect ratio
- 24x24px base size (scale to 48x48px for @2x)

### Icon Set

#### Today Icon
**Concept**: Calendar page with subtle music note or bird silhouette
**Usage**: Active tab indicator for "Today" view

**Midjourney Prompt:**
```
minimal line icon, calendar page with single date, subtle music note in corner, thin line art, dark mode optimized, 1:1 aspect ratio, transparent background, fine grain texture, warm but muted tones, SongBird aesthetic, --style raw --ar 1:1
```

**Asset Name**: `icon-today.png` / `icon-today-active.png`

---

#### Feed Icon
**Concept**: Stacked cards or flowing lines suggesting timeline/stream
**Usage**: Navigation to social feed

**Midjourney Prompt:**
```
minimal line icon, stacked cards or flowing timeline, subtle bird silhouette between layers, thin line art, dark mode optimized, 1:1 aspect ratio, transparent background, fine grain texture, warm but muted tones, SongBird aesthetic, --style raw --ar 1:1
```

**Asset Name**: `icon-feed.png` / `icon-feed-active.png`

---

#### Memory Icon
**Concept**: Branch with music notes or journal page with bird perched
**Usage**: Navigation to memory archive

**Midjourney Prompt:**
```
minimal line icon, tree branch with small music notes, or journal page with bird silhouette, thin line art, dark mode optimized, 1:1 aspect ratio, transparent background, fine grain texture, warm but muted tones, SongBird aesthetic, --style raw --ar 1:1
```

**Asset Name**: `icon-memory.png` / `icon-memory-active.png`

---

#### Insights Icon
**Concept**: Gentle chart or graph with bird perched on line
**Usage**: Navigation to analytics/insights

**Midjourney Prompt:**
```
minimal line icon, gentle line chart or graph, small bird silhouette perched on line, thin line art, dark mode optimized, 1:1 aspect ratio, transparent background, fine grain texture, warm but muted tones, SongBird aesthetic, --style raw --ar 1:1
```

**Asset Name**: `icon-insights.png` / `icon-insights-active.png`

---

#### Profile Icon
**Concept**: Bird silhouette in circle or gentle profile outline
**Usage**: Navigation to user profile

**Midjourney Prompt:**
```
minimal line icon, bird silhouette in gentle circle, or soft profile outline with bird accent, thin line art, dark mode optimized, 1:1 aspect ratio, transparent background, fine grain texture, warm but muted tones, SongBird aesthetic, --style raw --ar 1:1
```

**Asset Name**: `icon-profile.png` / `icon-profile-active.png`

---

### Icon Implementation Notes
- **Format**: PNG with transparent background (SVG optimization later)
- **Sizes**: 24x24px (base), 48x48px (@2x), 72x72px (@3x)
- **Active State**: Slightly thicker stroke or subtle glow (same icon, different weight)
- **Color**: Use CSS filters or tinting for active/inactive states
- **Location**: `/public/icons/navigation/`

---

## 2. Mood Bird Assets

### Style Requirements
- One canonical bird in multiple emotional poses
- Fine-grain / print-like texture (match existing logo)
- Mostly dark UI background
- Subtle accessories (music note, tilt, droop, glow)
- No emoji faces — emotion felt, not cartooned
- 1:1 aspect ratio (can be cropped to 4:3 for specific uses)
- Bird must never block content (positioned thoughtfully)

### Mood Set

#### Happy Bird
**Pose**: Upright, slight head tilt, wings slightly raised
**Accessory**: Small music note floating near head
**Color**: Warm, gentle glow (amber/gold tones)

**Midjourney Prompt:**
```
SongBird bird character, upright pose, slight head tilt, wings slightly raised, small music note floating near head, gentle warm glow, fine grain texture, print-like quality, dark background, calm and playful, emotion-first design, no emoji, premium but warm, 1:1 aspect ratio, transparent background, --style raw --ar 1:1
```

**Asset Name**: `bird-mood-happy.png`

---

#### Sad Bird
**Pose**: Slightly drooped, head down, wings closer to body
**Accessory**: Subtle droop or single note falling
**Color**: Cooler tones, muted

**Midjourney Prompt:**
```
SongBird bird character, slightly drooped pose, head down, wings closer to body, subtle droop, single music note falling, muted cool tones, fine grain texture, print-like quality, dark background, calm and gentle, emotion-first design, no emoji, premium but warm, 1:1 aspect ratio, transparent background, --style raw --ar 1:1
```

**Asset Name**: `bird-mood-sad.png`

---

#### Calm Bird
**Pose**: Still, balanced, eyes closed or gentle gaze
**Accessory**: Minimal, perhaps a soft glow or stillness
**Color**: Neutral, balanced tones

**Midjourney Prompt:**
```
SongBird bird character, still and balanced pose, eyes closed or gentle gaze, minimal accessory, soft subtle glow, fine grain texture, print-like quality, dark background, calm and peaceful, emotion-first design, no emoji, premium but warm, 1:1 aspect ratio, transparent background, --style raw --ar 1:1
```

**Asset Name**: `bird-mood-calm.png`

---

#### Nostalgic Bird
**Pose**: Looking back or upward, contemplative
**Accessory**: Vintage music note or gentle fade effect
**Color**: Sepia tones, warm but faded

**Midjourney Prompt:**
```
SongBird bird character, looking back or upward pose, contemplative, vintage music note or gentle fade effect, sepia warm tones, fine grain texture, print-like quality, dark background, calm and reflective, emotion-first design, no emoji, premium but warm, 1:1 aspect ratio, transparent background, --style raw --ar 1:1
```

**Asset Name**: `bird-mood-nostalgic.png`

---

#### Tired Bird
**Pose**: Lowered, wings relaxed, head slightly down
**Accessory**: Subtle droop or soft shadow
**Color**: Muted, softer tones

**Midjourney Prompt:**
```
SongBird bird character, lowered pose, wings relaxed, head slightly down, subtle droop or soft shadow, muted soft tones, fine grain texture, print-like quality, dark background, calm and gentle, emotion-first design, no emoji, premium but warm, 1:1 aspect ratio, transparent background, --style raw --ar 1:1
```

**Asset Name**: `bird-mood-tired.png`

---

#### Hype Bird (Restrained)
**Pose**: Slightly elevated, wings more open, but still calm
**Accessory**: Small sparkle or gentle lift effect
**Color**: Slightly brighter but still warm, not neon

**Midjourney Prompt:**
```
SongBird bird character, slightly elevated pose, wings more open but still calm, small sparkle or gentle lift effect, slightly brighter warm tones but not neon, fine grain texture, print-like quality, dark background, calm but energetic, emotion-first design, no emoji, premium but warm, 1:1 aspect ratio, transparent background, --style raw --ar 1:1
```

**Asset Name**: `bird-mood-hype.png`

---

### Mood Bird Implementation Notes
- **Format**: PNG with transparent background
- **Sizes**: 120x120px (base), 240x240px (@2x), 360x360px (@3x)
- **Usage**: Tab loading states, mood selection, entry reactions
- **Location**: `/public/birds/moods/`
- **SVG Optimization**: Consider SVG for later if animations needed

---

## 3. Empty State Illustrations

### Style Requirements
- Design concepts (not full scenes)
- Minimal, suggestive rather than detailed
- Fine-grain texture
- Dark UI optimized
- 9:16 or 4:3 aspect ratio (can be cropped)
- Bird can appear but must not dominate

### Empty States

#### No Song Yet
**Concept**: Empty music staff or journal page with bird perched, waiting

**Midjourney Prompt:**
```
minimal illustration concept, empty music staff or journal page, SongBird bird perched waiting, fine grain texture, print-like quality, dark background, calm and gentle, suggestive not detailed, 9:16 aspect ratio, transparent background, premium but warm, --style raw --ar 9:16
```

**Asset Name**: `empty-no-song.png`

---

#### No Memories Yet
**Concept**: Empty branch or timeline with bird looking back

**Midjourney Prompt:**
```
minimal illustration concept, empty branch or timeline, SongBird bird looking back, fine grain texture, print-like quality, dark background, calm and gentle, suggestive not detailed, 9:16 aspect ratio, transparent background, premium but warm, --style raw --ar 9:16
```

**Asset Name**: `empty-no-memories.png`

---

#### No Friends Yet
**Concept**: Single bird with space for others, or empty nest

**Midjourney Prompt:**
```
minimal illustration concept, single SongBird bird with space for others, or empty nest, fine grain texture, print-like quality, dark background, calm and gentle, suggestive not detailed, 9:16 aspect ratio, transparent background, premium but warm, --style raw --ar 9:16
```

**Asset Name**: `empty-no-friends.png`

---

### Empty State Implementation Notes
- **Format**: PNG with transparent background
- **Sizes**: 300x533px (base 9:16), 600x1066px (@2x)
- **Usage**: Empty state screens, onboarding
- **Location**: `/public/illustrations/empty-states/`

---

## 4. Motion & Interaction Concepts (Conceptual)

### Bird Idle Animation
**Concept**: Subtle breathing / stillness
- **Duration**: 3-4 second loop
- **Motion**: 
  - Gentle chest expansion/contraction (2-3px vertical movement)
  - Slight head bob (1-2px)
  - Very slow, barely perceptible
- **Easing**: Ease-in-out, smooth
- **Implementation**: CSS keyframes or Lottie (if complex)
- **Note**: Should feel alive but respectful, never distracting

---

### Post-Entry Save Reaction
**Concept**: Bird reacts to successful save
- **Duration**: 1-1.5 seconds
- **Motion**:
  - Bird tilts head slightly (5-10°)
  - Small music note appears and fades
  - Gentle glow pulse
  - Returns to idle
- **Easing**: Ease-out for reaction, ease-in for return
- **Implementation**: CSS transitions or Lottie
- **Note**: Celebration should be gentle, not loud

---

### Loading State Concepts

#### Flying Loading
**Concept**: Bird flies in gentle loop
- **Duration**: 2-3 second loop
- **Motion**:
  - Bird moves in gentle arc (horizontal or circular)
  - Wings animate subtly
  - Returns to start
- **Usage**: Initial page load, data fetching
- **Implementation**: Lottie or CSS keyframes

#### Whistling Loading
**Concept**: Bird perched, subtle music notes appear
- **Duration**: 2 second loop
- **Motion**:
  - Bird remains still
  - Music notes appear and fade in sequence
  - Gentle glow pulse
- **Usage**: Quick actions, form submissions
- **Implementation**: CSS keyframes

#### Waiting Loading
**Concept**: Bird in calm pose, very subtle movement
- **Duration**: 4-5 second loop
- **Motion**:
  - Minimal movement (breathing only)
  - Soft glow pulse
- **Usage**: Long-running operations
- **Implementation**: CSS keyframes

---

### On-This-Day Nostalgic State
**Concept**: Bird in nostalgic pose with gentle fade effect
- **Duration**: 3-4 second loop
- **Motion**:
  - Bird in nostalgic pose (looking back/upward)
  - Gentle sepia fade overlay pulses
  - Vintage music note appears/disappears
- **Usage**: "On This Day" memory feature
- **Implementation**: CSS keyframes + overlay

---

### Interaction Reactions

#### Tap Reaction
- **Duration**: 0.3 seconds
- **Motion**: Bird slightly bobs down (2-3px), returns
- **Usage**: Button presses, card taps

#### Streak Milestone
- **Duration**: 2 seconds
- **Motion**: Bird briefly elevates, gentle sparkle, returns to idle
- **Usage**: Streak achievements (very restrained)

---

### Motion Implementation Notes
- **All animations**: Should respect `prefers-reduced-motion`
- **Performance**: Use CSS transforms (not position changes)
- **Timing**: Never exceed 2-3 seconds for interactions, 4-5 for ambient
- **Easing**: Always use ease-in-out or ease-out (never linear)
- **Documentation**: Create separate animation spec document for developers

---

## Asset Naming Conventions

### Structure
```
/public
  /icons
    /navigation
      icon-today.png
      icon-today-active.png
      icon-feed.png
      icon-feed-active.png
      icon-memory.png
      icon-memory-active.png
      icon-insights.png
      icon-insights-active.png
      icon-profile.png
      icon-profile-active.png
  /birds
    /moods
      bird-mood-happy.png
      bird-mood-sad.png
      bird-mood-calm.png
      bird-mood-nostalgic.png
      bird-mood-tired.png
      bird-mood-hype.png
    /animations
      (future: Lottie files or sprite sheets)
  /illustrations
    /empty-states
      empty-no-song.png
      empty-no-memories.png
      empty-no-friends.png
```

### Naming Pattern
- **Icons**: `icon-[name]-[state?].png`
- **Birds**: `bird-[type]-[mood/state].png`
- **Empty States**: `empty-[context].png`
- **States**: `-active`, `-hover`, `-loading` suffixes

---

## Aspect Ratios Summary

| Asset Type | Aspect Ratio | Base Size | @2x Size | @3x Size |
|------------|--------------|-----------|----------|----------|
| Navigation Icons | 1:1 | 24x24px | 48x48px | 72x72px |
| Mood Birds | 1:1 | 120x120px | 240x240px | 360x360px |
| Empty States | 9:16 | 300x533px | 600x1066px | - |

---

## Color Palette Reference

Based on existing UI tokens:
- **Background**: `bg-bg` (dark)
- **Surface**: `bg-surface` (slightly lighter dark)
- **Text**: `text-text` (light)
- **Accent**: `text-accent` (warm accent color)

**For Assets**:
- Icons: Light lines (matching `text-text`)
- Birds: Warm tones (amber, gold, sepia) with fine grain
- Empty States: Muted, warm but not bright

---

## SVG Optimization (Future)

Consider converting to SVG for:
- Icons (better scaling, smaller file size)
- Simple bird poses (if no complex texture needed)
- Loading animations (if using CSS animations)

**Keep as PNG**:
- Mood birds with fine-grain texture
- Empty state illustrations with texture
- Complex gradients or effects

---

## Implementation Checklist

- [ ] Generate all Midjourney prompts
- [ ] Create asset directory structure
- [ ] Export assets at all required sizes
- [ ] Test on dark background
- [ ] Verify transparency
- [ ] Create animation spec document (separate)
- [ ] Document CSS classes for states
- [ ] Test with `prefers-reduced-motion`

---

## Notes for Developers

1. **Icons**: Use Next.js `Image` component with proper sizing
2. **Birds**: Can be used as `<img>` or background images
3. **Animations**: Start with CSS, upgrade to Lottie if needed
4. **States**: Use CSS filters or separate assets for active states
5. **Performance**: Lazy load empty states, preload navigation icons
6. **Accessibility**: Always include `alt` text, respect motion preferences

---

**End of Asset Specifications**


