# Implementing Song Previews & Theatrics Mode

## Overview
The theatrics mode toggle has been added to Profile settings (stored in localStorage). Now we need to implement the actual song preview playback feature.

## Current Status
✅ **Completed:**
- Theatrics toggle in Profile edit mode (localStorage)
- State accessible via: `localStorage.getItem('theatricsEnabled')`
- UI toggle with smooth animation

⏳ **Pending Implementation:**
- Spotify preview URL fetching
- Audio playback with entrance animations
- Visual effects for theatrics mode

## Spotify Preview URLs

### Where to Get Preview URLs
1. **During song search** - [app/api/songs/search/route.ts](app/api/songs/search/route.ts)
   - Spotify API response includes `preview_url` field (30-second MP3)
   - Add to song selection results

2. **From existing entries** - Need to fetch from Spotify Track API
   - Use `trackId` from entry
   - Call `spotifyApi.getTrack(trackId)` to get `preview_url`

### Example Spotify API Response:
\`\`\`json
{
  "id": "spotify:track:123",
  "name": "Song Title",
  "preview_url": "https://p.scdn.co/mp3-preview/...",
  "duration_ms": 210000
}
\`\`\`

## Implementation Plan

### 1. Store Preview URLs in Database
Update Prisma schema:
\`\`\`prisma
model Entry {
  // ... existing fields
  previewUrl   String?  // Add this field
}
\`\`\`

Then run: `npx prisma migrate dev --name add_preview_url`

### 2. Update AddEntryTab to Store Preview URL
[components/AddEntryTab.tsx](components/AddEntryTab.tsx):
\`\`\`typescript
// When selecting a song from search results
setFormData({
  ...formData,
  // ... existing fields
  previewUrl: selectedSong.preview_url || null
})

// Include in API POST request
fetch('/api/entries', {
  method: 'POST',
  body: JSON.stringify({
    // ... existing fields
    previewUrl: formData.previewUrl
  })
})
\`\`\`

### 3. Create Audio Player Component
Create [components/SongPreviewPlayer.tsx](components/SongPreviewPlayer.tsx):
\`\`\`typescript
'use client'

import { useState, useRef, useEffect } from 'react'

interface SongPreviewPlayerProps {
  previewUrl: string | null
  songTitle: string
  artist: string
  albumArt: string | null
  autoPlay?: boolean
  showEntranceAnimation?: boolean
}

export default function SongPreviewPlayer({
  previewUrl,
  songTitle,
  artist,
  albumArt,
  autoPlay = false,
  showEntranceAnimation = false
}: SongPreviewPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [progress, setProgress] = useState(0)
  const [showAnimation, setShowAnimation] = useState(false)

  useEffect(() => {
    // Check theatrics mode
    const theatricsEnabled = localStorage.getItem('theatricsEnabled') === 'true'
    if (autoPlay && theatricsEnabled && previewUrl) {
      handlePlay()
      if (showEntranceAnimation) {
        setShowAnimation(true)
        setTimeout(() => setShowAnimation(false), 3000)
      }
    }
  }, [])

  const handlePlay = () => {
    if (audioRef.current) {
      audioRef.current.play()
      setIsPlaying(true)
    }
  }

  const handlePause = () => {
    if (audioRef.current) {
      audioRef.current.pause()
      setIsPlaying(false)
    }
  }

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      const percent = (audioRef.current.currentTime / audioRef.current.duration) * 100
      setProgress(percent)
    }
  }

  if (!previewUrl) return null

  return (
    <div className={\`relative \${showAnimation ? 'animate-slide-in' : ''}\`}>
      {showAnimation && (
        <div className="absolute inset-0 bg-gradient-to-r from-accent/20 via-accent/40 to-accent/20 animate-pulse rounded-lg" />
      )}
      
      <audio
        ref={audioRef}
        src={previewUrl}
        onTimeUpdate={handleTimeUpdate}
        onEnded={() => setIsPlaying(false)}
      />

      <div className="flex items-center gap-3 bg-surface rounded-lg p-3 relative z-10">
        {/* Play/Pause Button */}
        <button
          onClick={isPlaying ? handlePause : handlePlay}
          className="w-10 h-10 rounded-full bg-accent text-bg flex items-center justify-center hover:bg-accent/90 transition-all hover:scale-105"
        >
          {isPlaying ? '⏸' : '▶'}
        </button>

        {/* Progress Bar */}
        <div className="flex-1">
          <div className="h-1 bg-bg rounded-full overflow-hidden">
            <div
              className="h-full bg-accent transition-all"
              style={{ width: \`\${progress}%\` }}
            />
          </div>
        </div>

        {/* Preview Label */}
        <div className="text-xs text-text/60">30s preview</div>
      </div>
    </div>
  )
}
\`\`\`

### 4. Add Entrance Animation CSS
[app/globals.css](app/globals.css):
\`\`\`css
@keyframes slide-in {
  from {
    opacity: 0;
    transform: translateY(20px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.animate-slide-in {
  animation: slide-in 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
}

@keyframes spotlight {
  0%, 100% {
    box-shadow: 0 0 0 0 rgba(182, 90, 42, 0);
  }
  50% {
    box-shadow: 0 0 40px 10px rgba(182, 90, 42, 0.4);
  }
}

.animate-spotlight {
  animation: spotlight 2s ease-in-out;
}
\`\`\`

### 5. Use in Entry Cards
Update [components/TodayTab.tsx](components/TodayTab.tsx), [components/HistoryTab.tsx](components/HistoryTab.tsx), etc:
\`\`\`typescript
import SongPreviewPlayer from './SongPreviewPlayer'

// Inside entry card
<SongPreviewPlayer
  previewUrl={entry.previewUrl}
  songTitle={entry.songTitle}
  artist={entry.artist}
  albumArt={entry.albumArt}
  autoPlay={true}  // Auto-play when card is shown
  showEntranceAnimation={true}  // Show dramatic entrance
/>
\`\`\`

## Theatrics Mode Features

When theatrics is **enabled**:
- ✨ Auto-play song previews when entry cards appear
- 🎭 Entrance animations (slide-in, spotlight effect)
- 💫 Bounce animations on medals/badges
- 🌟 Glowing effects on album art
- 🎨 Enhanced color transitions

When theatrics is **disabled**:
- Manual play button only
- No auto-play
- Minimal animations
- Clean, simple UI

## Mobile Considerations
- ⚠️ **iOS Safari** blocks auto-play - require user tap first
- Use `canAutoPlay` detection:
  \`\`\`typescript
  const canAutoPlay = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)
  if (!canAutoPlay) {
    // Show play button instead of auto-playing
  }
  \`\`\`

## Testing Checklist
- [ ] Preview URLs saved to database
- [ ] Audio player loads and plays 30-second clips
- [ ] Theatrics toggle persists across sessions
- [ ] Entrance animations trigger correctly
- [ ] Mobile fallback works (manual play)
- [ ] Progress bar updates smoothly
- [ ] Audio stops when navigating away
- [ ] Multiple previews don't overlap (pause others)

## Next Steps
1. Add `previewUrl` field to Prisma schema
2. Run migration
3. Update song search API to include preview URLs
4. Create `SongPreviewPlayer` component
5. Add CSS animations
6. Integrate into entry cards with theatrics mode check
7. Test on mobile devices
