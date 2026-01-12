# SongBird Animation Specifications

## Design Philosophy
**Gentle, respectful, never distracting** | **Emotion-first motion** | **Premium but warm**

All animations must respect `prefers-reduced-motion` and should feel alive but never block or distract from content.

---

## Animation Principles

1. **Duration**: Never exceed 2-3 seconds for interactions, 4-5 for ambient
2. **Easing**: Always use ease-in-out or ease-out (never linear)
3. **Performance**: Use CSS transforms (not position changes)
4. **Accessibility**: Respect `prefers-reduced-motion: reduce`
5. **Subtlety**: Motion should enhance, not dominate

---

## 1. Bird Idle Animation

### Purpose
Make the bird feel alive without being distracting.

### Specification
- **Duration**: 3-4 seconds (loop)
- **Easing**: `ease-in-out`
- **Motion**:
  - Gentle chest expansion/contraction: 2-3px vertical movement
  - Slight head bob: 1-2px vertical, 1° rotation
  - Very slow, barely perceptible
- **Implementation**: CSS keyframes

### CSS Example
```css
@keyframes birdIdle {
  0%, 100% {
    transform: translateY(0) rotate(0deg);
  }
  50% {
    transform: translateY(-2px) rotate(1deg);
  }
}

.bird-idle {
  animation: birdIdle 3.5s ease-in-out infinite;
}

@media (prefers-reduced-motion: reduce) {
  .bird-idle {
    animation: none;
  }
}
```

### Usage
- Default state when bird is visible
- Applied to mood bird assets
- Can be paused on hover/interaction

---

## 2. Post-Entry Save Reaction

### Purpose
Provide gentle feedback when user saves an entry.

### Specification
- **Duration**: 1-1.5 seconds total
- **Easing**: `ease-out` for reaction, `ease-in` for return
- **Motion**:
  1. Bird tilts head slightly (5-10° rotation, 0-0.3s)
  2. Small music note appears and fades (0.2-0.8s)
  3. Gentle glow pulse (0-0.6s)
  4. Returns to idle (0.8-1.5s)
- **Implementation**: CSS transitions + keyframes

### CSS Example
```css
@keyframes saveReaction {
  0% {
    transform: rotate(0deg);
  }
  30% {
    transform: rotate(8deg);
  }
  100% {
    transform: rotate(0deg);
  }
}

@keyframes noteAppear {
  0% {
    opacity: 0;
    transform: translateY(10px) scale(0.8);
  }
  50% {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
  100% {
    opacity: 0;
    transform: translateY(-10px) scale(0.8);
  }
}

.bird-save-reaction {
  animation: saveReaction 1.2s ease-out;
}

.note-feedback {
  animation: noteAppear 0.8s ease-out;
}
```

### Usage
- Triggered on successful entry save
- Can be reused for other positive actions
- Should feel rewarding but not loud

---

## 3. Loading State: Flying

### Purpose
Indicate loading with bird in motion.

### Specification
- **Duration**: 2-3 seconds (loop)
- **Easing**: `ease-in-out`
- **Motion**:
  - Bird moves in gentle arc (horizontal or circular path)
  - Wings animate subtly (if sprite sheet available)
  - Returns to start position
- **Implementation**: CSS keyframes or Lottie

### CSS Example
```css
@keyframes birdFlying {
  0% {
    transform: translateX(0) translateY(0) rotate(0deg);
  }
  25% {
    transform: translateX(20px) translateY(-10px) rotate(5deg);
  }
  50% {
    transform: translateX(40px) translateY(0) rotate(0deg);
  }
  75% {
    transform: translateX(20px) translateY(10px) rotate(-5deg);
  }
  100% {
    transform: translateX(0) translateY(0) rotate(0deg);
  }
}

.bird-loading-flying {
  animation: birdFlying 2.5s ease-in-out infinite;
}
```

### Usage
- Initial page load
- Data fetching operations
- Long-running processes

---

## 4. Loading State: Whistling

### Purpose
Quick loading indicator for fast actions.

### Specification
- **Duration**: 2 seconds (loop)
- **Easing**: `ease-in-out`
- **Motion**:
  - Bird remains still (perched)
  - Music notes appear and fade in sequence (3-4 notes)
  - Gentle glow pulse
- **Implementation**: CSS keyframes

### CSS Example
```css
@keyframes noteSequence {
  0% {
    opacity: 0;
    transform: translateY(5px) scale(0.5);
  }
  20% {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
  40% {
    opacity: 0;
    transform: translateY(-5px) scale(0.5);
  }
  100% {
    opacity: 0;
  }
}

.note-1 { animation: noteSequence 2s ease-in-out infinite 0s; }
.note-2 { animation: noteSequence 2s ease-in-out infinite 0.3s; }
.note-3 { animation: noteSequence 2s ease-in-out infinite 0.6s; }
.note-4 { animation: noteSequence 2s ease-in-out infinite 0.9s; }

@keyframes glowPulse {
  0%, 100% {
    opacity: 0.3;
  }
  50% {
    opacity: 0.6;
  }
}

.bird-loading-whistling {
  filter: drop-shadow(0 0 8px rgba(255, 200, 100, 0.3));
  animation: glowPulse 2s ease-in-out infinite;
}
```

### Usage
- Form submissions
- Quick API calls
- Button actions

---

## 5. Loading State: Waiting

### Purpose
Calm loading state for long operations.

### Specification
- **Duration**: 4-5 seconds (loop)
- **Easing**: `ease-in-out`
- **Motion**:
  - Minimal movement (breathing only, same as idle)
  - Soft glow pulse
  - Very subtle, barely noticeable
- **Implementation**: CSS keyframes

### CSS Example
```css
@keyframes waitingGlow {
  0%, 100% {
    opacity: 0.2;
    filter: drop-shadow(0 0 4px rgba(255, 200, 100, 0.2));
  }
  50% {
    opacity: 0.4;
    filter: drop-shadow(0 0 8px rgba(255, 200, 100, 0.4));
  }
}

.bird-loading-waiting {
  animation: waitingGlow 4.5s ease-in-out infinite;
}
```

### Usage
- Long-running operations
- Background sync
- Heavy data processing

---

## 6. On-This-Day Nostalgic State

### Purpose
Create nostalgic atmosphere for memory features.

### Specification
- **Duration**: 3-4 seconds (loop)
- **Easing**: `ease-in-out`
- **Motion**:
  - Bird in nostalgic pose (looking back/upward)
  - Gentle sepia fade overlay pulses
  - Vintage music note appears/disappears
- **Implementation**: CSS keyframes + overlay

### CSS Example
```css
@keyframes nostalgicPulse {
  0%, 100% {
    filter: sepia(0.3) brightness(0.9);
    opacity: 1;
  }
  50% {
    filter: sepia(0.5) brightness(0.85);
    opacity: 0.95;
  }
}

@keyframes vintageNote {
  0%, 100% {
    opacity: 0;
    transform: scale(0.8) rotate(-5deg);
  }
  50% {
    opacity: 0.6;
    transform: scale(1) rotate(0deg);
  }
}

.bird-nostalgic {
  animation: nostalgicPulse 3.5s ease-in-out infinite;
}

.vintage-note {
  animation: vintageNote 3.5s ease-in-out infinite;
}
```

### Usage
- "On This Day" memory feature
- Historical entry views
- Archive browsing

---

## 7. Interaction Reactions

### Tap Reaction

**Purpose**: Provide immediate feedback on tap/press.

**Specification**:
- **Duration**: 0.3 seconds
- **Easing**: `ease-out`
- **Motion**: Bird slightly bobs down (2-3px), returns
- **Implementation**: CSS transition

**CSS Example**:
```css
.bird-tap-reaction {
  transition: transform 0.3s ease-out;
}

.bird-tap-reaction:active {
  transform: translateY(3px);
}
```

**Usage**: Button presses, card taps, interactive elements

---

### Streak Milestone

**Purpose**: Celebrate streak achievements (very restrained).

**Specification**:
- **Duration**: 2 seconds
- **Easing**: `ease-out` for elevation, `ease-in` for return
- **Motion**:
  1. Bird briefly elevates (5-8px, 0-0.5s)
  2. Gentle sparkle appears (0.3-1s)
  3. Returns to idle (1-2s)
- **Implementation**: CSS keyframes

**CSS Example**:
```css
@keyframes streakCelebration {
  0% {
    transform: translateY(0);
  }
  25% {
    transform: translateY(-8px);
  }
  100% {
    transform: translateY(0);
  }
}

@keyframes sparkle {
  0%, 100% {
    opacity: 0;
    transform: scale(0);
  }
  50% {
    opacity: 1;
    transform: scale(1);
  }
}

.bird-streak-milestone {
  animation: streakCelebration 2s ease-out;
}

.sparkle-effect {
  animation: sparkle 1s ease-out;
}
```

**Usage**: Streak achievements, milestones, special moments

---

## Animation Performance Guidelines

### Best Practices

1. **Use `transform` and `opacity` only**
   - These properties are GPU-accelerated
   - Avoid animating `width`, `height`, `top`, `left`

2. **Use `will-change` sparingly**
   ```css
   .bird-animated {
     will-change: transform;
   }
   ```
   - Only apply to elements actively animating
   - Remove when animation completes

3. **Limit simultaneous animations**
   - Maximum 2-3 animated elements per view
   - Prioritize user-initiated animations

4. **Test on low-end devices**
   - Ensure 60fps on mid-range devices
   - Reduce complexity if needed

---

## Accessibility Considerations

### Reduced Motion

Always respect `prefers-reduced-motion`:

```css
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

### Alternative States

For users with motion sensitivity:
- Provide static bird states
- Use opacity changes instead of movement
- Offer toggle in settings

---

## Implementation Checklist

- [ ] Create CSS keyframe definitions
- [ ] Implement `prefers-reduced-motion` support
- [ ] Test all animations at 60fps
- [ ] Verify on mobile devices
- [ ] Add animation state classes
- [ ] Document React component usage
- [ ] Create animation utility functions
- [ ] Test with screen readers

---

## React Component Example

```typescript
'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'

interface BirdProps {
  mood?: 'happy' | 'sad' | 'calm' | 'nostalgic' | 'tired' | 'hype'
  animation?: 'idle' | 'loading' | 'save' | 'nostalgic'
  className?: string
}

export function Bird({ mood = 'calm', animation = 'idle', className }: BirdProps) {
  const [reducedMotion, setReducedMotion] = useState(false)

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    setReducedMotion(mediaQuery.matches)
    
    const handler = (e: MediaQueryListEvent) => setReducedMotion(e.matches)
    mediaQuery.addEventListener('change', handler)
    return () => mediaQuery.removeEventListener('change', handler)
  }, [])

  const animationClass = reducedMotion ? '' : `bird-${animation}`
  const src = `/birds/moods/bird-mood-${mood}.png`

  return (
    <Image
      src={src}
      alt={`SongBird ${mood} mood`}
      width={120}
      height={120}
      className={`${animationClass} ${className}`}
    />
  )
}
```

---

## Animation Timing Reference

| Animation | Duration | Easing | Loop |
|-----------|----------|--------|------|
| Idle | 3-4s | ease-in-out | Yes |
| Save Reaction | 1-1.5s | ease-out | No |
| Flying Loading | 2-3s | ease-in-out | Yes |
| Whistling Loading | 2s | ease-in-out | Yes |
| Waiting Loading | 4-5s | ease-in-out | Yes |
| Nostalgic | 3-4s | ease-in-out | Yes |
| Tap Reaction | 0.3s | ease-out | No |
| Streak Milestone | 2s | ease-out | No |

---

**End of Animation Specifications**


