# SongBird Animation Guide

This guide covers how to create animations for your bird PNGs.

---

## Part 1: CSS-Only Animations (Already Implemented)

These work with your **single PNG per bird** - no additional assets needed!

### Currently Available States in ThemeBird Component

```tsx
<ThemeBird size={64} state="bounce" />  // Bouncing
<ThemeBird size={64} state="sing" />    // Pulsing + music note
<ThemeBird size={64} state="curious" /> // Head tilt (rotation)
<ThemeBird size={64} state="happy" />   // Excited bounce
<ThemeBird size={64} state="sleepy" />  // Lowered opacity
<ThemeBird size={64} state="proud" />   // Slightly larger
<ThemeBird size={64} state="fly" />     // Flying animation
```

### CSS Animations We Can Add

| Animation | CSS Technique | Effect |
|-----------|--------------|--------|
| Gentle bob | `translateY` keyframes | Bird bobs up and down |
| Head tilt | `rotate` | Bird tilts head curiously |
| Wing flap | `scaleX` alternating | Simulates wing movement |
| Hop | `translateY` with `ease-out` | Quick jump |
| Shake/ruffle | `rotate` oscillation | Bird shakes feathers |
| Float | `translateY` + `rotate` | Gentle floating |
| Breathe | `scale` subtle | Subtle size pulse |
| Fly across | `translateX` + `rotate` | Bird flies across screen |

---

## Part 2: Creating Additional Bird Assets

### Option A: Transparent Background Fixes

**Problem:** Midjourney adds backgrounds
**Solutions:**

1. **Remove.bg** (Free, instant)
   - Upload your Midjourney output
   - Download transparent PNG
   - Works great for simple subjects

2. **Photopea.com** (Free Photoshop alternative)
   - Open image → Magic Wand tool → Select background → Delete
   - Or use: Select → Subject → Invert → Delete

3. **Midjourney Prompts for Transparency:**
   ```
   [your bird description], isolated on pure white background, 
   no shadows, product photography style, centered --v 6
   ```
   Then use Remove.bg on the result.

4. **Recraft.ai** (Recommended for icons)
   - Specifically designed for icons/logos
   - Better at maintaining transparency
   - Has "Icon" mode

### Option B: Creating Bird Pose Variations

For proper animations (wing up, wing down, etc.), you need multiple poses:

**Midjourney Prompt Template:**
```
American Robin songbird, [POSE], simple flat illustration style, 
side view, isolated on solid white #FFFFFF background, 
no shadows, vector art style, clean edges --v 6 --style raw
```

**Poses to generate:**
1. `wings folded, resting pose`
2. `wings slightly raised, alert pose`  
3. `wings spread wide, flying pose`
4. `head tilted right, curious pose`
5. `beak open, singing pose`
6. `eyes closed, sleepy pose`

### Option C: AI Animation Tools

1. **Pika Labs** (pika.art)
   - Upload your PNG
   - Add motion with text prompts
   - "Make the bird bob up and down"
   - Exports as video/GIF

2. **Runway ML** (runwayml.com)
   - "Gen-2" can animate images
   - Upload bird PNG
   - Describe the motion

3. **LeiaPix** (leiapix.com)
   - Converts images to 3D-ish animations
   - Good for subtle depth movement

4. **CapCut** (Free video editor)
   - Import PNG
   - Use keyframe animation
   - Export as GIF or video

---

## Part 3: Sprite Sheet Animation

If you create multiple poses, combine them into a sprite sheet:

### Creating a Sprite Sheet

1. **Arrange poses horizontally** (all same size, e.g., 100x100 each)
2. **Name frames:** bird_frame1.png, bird_frame2.png, etc.
3. **Combine using:**
   - Photopea: New document (frames × width, height) → paste each frame
   - Online tool: spritesheetpacker.com

### CSS Sprite Animation

```css
.bird-sprite {
  width: 100px;
  height: 100px;
  background: url('/bird-spritesheet.png');
  animation: flap 0.5s steps(4) infinite;
}

@keyframes flap {
  from { background-position: 0 0; }
  to { background-position: -400px 0; } /* 4 frames × 100px */
}
```

---

## Part 4: Lottie Animations (Professional Quality)

Lottie = JSON-based animations, very smooth and lightweight.

### Creating Lottie from PNGs

1. **After Effects Method:**
   - Import PNG sequence
   - Animate with keyframes
   - Export with Bodymovin plugin
   - Get JSON file

2. **LottieFiles Creator** (lottiefiles.com/creator)
   - Upload your PNG
   - Use their animation tools
   - No After Effects needed
   - Export as JSON

3. **Rive** (rive.app) - Best for Interactive
   - Import PNG as image
   - Rig with bones
   - Create state machine
   - Export for web

### Using Lottie in React

```bash
npm install lottie-react
```

```tsx
import Lottie from 'lottie-react'
import birdAnimation from './bird-animation.json'

<Lottie animationData={birdAnimation} loop={true} />
```

---

## Part 5: Quick Wins with Current PNGs

### Accessories via CSS Pseudo-elements

```css
/* Santa hat overlay */
.bird-christmas::after {
  content: '🎅';
  position: absolute;
  top: -10px;
  left: 50%;
  transform: translateX(-50%);
  font-size: 20px;
}

/* Music notes when singing */
.bird-singing::before {
  content: '♪';
  position: absolute;
  top: -15px;
  right: -10px;
  animation: float-up 1s infinite;
}
```

### Particle Effects (Hearts, Notes, Sparkles)

Use CSS-only particles that appear around the bird:
- Hearts when vibing
- Music notes when singing
- Sparkles for achievements
- Confetti for milestones

---

## Recommended Workflow

### For Quick Results (Today):
1. ✅ Use enhanced CSS animations (I'll implement these now)
2. ✅ Add particle effects with CSS

### For Better Animations (This Week):
1. Go to **Rive.app** (free tier available)
2. Import your robin PNG
3. Create 3-4 simple animations:
   - Idle (subtle bob)
   - Sing (beak open, notes)
   - Fly (wing movement)
   - Happy (bounce)
4. Export and use in app

### For Professional Quality (Later):
1. Generate pose variations in Midjourney
2. Clean up with Remove.bg
3. Create sprite sheets or Lottie animations
4. Or hire a motion designer on Fiverr ($50-150)

---

## Resources

| Tool | Use For | Link |
|------|---------|------|
| Remove.bg | Background removal | remove.bg |
| Photopea | Free Photoshop | photopea.com |
| Rive | Interactive animations | rive.app |
| LottieFiles | Lottie creation | lottiefiles.com |
| Pika Labs | AI animation | pika.art |
| CapCut | Video/GIF editing | capcut.com |

---

## Current Implementation

The ThemeBird component in `/components/ThemeBird.tsx` already supports:
- Multiple animation states
- Interactive click-to-fly
- Tooltip on hover
- Special glow for Painted Bunting

See `/app/globals.css` for the animation keyframes.







