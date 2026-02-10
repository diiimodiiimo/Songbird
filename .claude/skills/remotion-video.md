# /remotion-video

Help with Remotion video generation for SongBird Wrapped feature.

## Overview

SongBird uses [Remotion](https://remotion.dev) to generate personalized year-end "Wrapped" videos showing:
- Top songs of the year
- Longest streaks
- Most listened artists
- Memory highlights

## Project Structure

```
remotion/
├── compositions/
│   ├── WrappedIntro.tsx      # Opening animation
│   ├── TopSongs.tsx          # Top 5 songs display
│   ├── TopArtists.tsx        # Artist podium
│   ├── StreakHighlight.tsx   # Streak celebration
│   └── WrappedOutro.tsx      # Closing screen
├── components/
│   ├── AnimatedText.tsx      # Text animations
│   ├── AlbumArtStack.tsx     # Stacked album art effect
│   ├── BirdAnimation.tsx     # Animated bird
│   ├── ProgressBar.tsx       # Video progress
│   ├── Transition.tsx        # Scene transitions
│   └── ThemeBackground.tsx   # Themed backgrounds
├── Root.tsx                  # Composition registry
├── index.ts                  # Entry point
└── remotion.config.ts        # Remotion config
```

## Key Concepts

### Composition
A composition is a video component with defined duration and dimensions:

```tsx
// Root.tsx
import { Composition } from 'remotion'

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="WrappedVideo"
        component={WrappedVideo}
        durationInFrames={900}  // 30 seconds at 30fps
        fps={30}
        width={1080}
        height={1920}  // 9:16 for mobile/stories
        defaultProps={{
          userData: defaultUserData,
        }}
      />
    </>
  )
}
```

### useCurrentFrame
Access the current frame for animations:

```tsx
import { useCurrentFrame, interpolate } from 'remotion'

export default function AnimatedElement() {
  const frame = useCurrentFrame()
  
  const opacity = interpolate(
    frame,
    [0, 30],   // From frame 0 to 30
    [0, 1],    // Opacity 0 to 1
    { extrapolateRight: 'clamp' }
  )
  
  return <div style={{ opacity }}>Fade In</div>
}
```

### Sequence
Play components in sequence:

```tsx
import { Sequence } from 'remotion'

export default function WrappedVideo({ userData }) {
  return (
    <>
      <Sequence from={0} durationInFrames={90}>
        <WrappedIntro user={userData} />
      </Sequence>
      
      <Sequence from={90} durationInFrames={180}>
        <TopSongs songs={userData.topSongs} />
      </Sequence>
      
      <Sequence from={270} durationInFrames={180}>
        <TopArtists artists={userData.topArtists} />
      </Sequence>
    </>
  )
}
```

### Spring Animations
```tsx
import { spring, useCurrentFrame, useVideoConfig } from 'remotion'

const frame = useCurrentFrame()
const { fps } = useVideoConfig()

const scale = spring({
  frame,
  fps,
  from: 0,
  to: 1,
  config: { damping: 10, stiffness: 100 }
})

return <div style={{ transform: `scale(${scale})` }} />
```

## User Data Interface

```typescript
interface WrappedData {
  year: number
  user: {
    username: string
    birdId: string
  }
  topSongs: {
    rank: number
    title: string
    artist: string
    albumArt: string
    playCount: number
  }[]
  topArtists: {
    rank: number
    name: string
    songCount: number
  }[]
  stats: {
    totalEntries: number
    longestStreak: number
    uniqueArtists: number
    uniqueSongs: number
  }
  highlights: {
    date: string
    song: string
    artist: string
    note: string
  }[]
}
```

## Rendering Videos

### Development Preview
```bash
npx remotion preview remotion/index.ts
```

### Render Locally
```bash
npx remotion render remotion/index.ts WrappedVideo out/wrapped.mp4
```

### Render with Data
```bash
npx remotion render remotion/index.ts WrappedVideo out/wrapped.mp4 --props='{"userData": {...}}'
```

### Lambda Rendering (Production)
```typescript
import { renderMediaOnLambda } from '@remotion/lambda'

const { bucketName, renderId } = await renderMediaOnLambda({
  composition: 'WrappedVideo',
  inputProps: { userData },
  codec: 'h264',
  // ...
})
```

## Styling

Remotion supports:
- Inline styles (most common)
- CSS-in-JS (styled-components, emotion)
- Tailwind (with config)

```tsx
// Inline styles (recommended for Remotion)
const style: React.CSSProperties = {
  fontFamily: 'Inter, sans-serif',
  fontSize: 48,
  fontWeight: 'bold',
  color: 'white',
}

return <div style={style}>Text</div>
```

## Common Patterns

### Loading Remote Images
```tsx
import { Img } from 'remotion'

<Img src={albumArtUrl} style={{ width: 200, height: 200 }} />
```

### Audio
```tsx
import { Audio } from 'remotion'

<Audio src={previewUrl} volume={0.5} />
```

## Performance Tips

1. Pre-load images with `delayRender()`
2. Keep compositions lightweight
3. Use `staticFile()` for bundled assets
4. Optimize images before rendering

## Common Issues

### "Frame drop in preview"
- Reduce complexity
- Check for expensive calculations per frame

### "Image not loading"
- Use absolute URLs
- Add to `delayRender()` / `continueRender()`

### "Wrong aspect ratio"
- Check composition width/height
- Match social media specs (9:16 for stories)


