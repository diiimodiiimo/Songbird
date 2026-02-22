# /bird-system

Help with SongBird's bird/avatar system - unlocks, milestones, and theming.

## Overview

Each user has a bird avatar that:
- Changes the app's color theme
- Is earned through milestones
- Represents their SongBird journey

## Available Birds

| Bird | Theme ID | How to Unlock |
|------|----------|---------------|
| American Robin | `american-robin` | Default (everyone) |
| House Finch | `house-finch` | First entry |
| Eastern Bluebird | `eastern-bluebird` | 7-day streak |
| American Goldfinch | `american-goldfinch` | 30-day streak |
| Indigo Bunting | `indigo-bunting` | 50-day streak |
| Baltimore Oriole | `baltimore-oriole` | 100-day streak |
| Cedar Waxwing | `cedar-waxwing` | 25 entries |
| Northern Cardinal | `cardinal` | Premium |
| Painted Bunting | `painted-bunting` | 365-day streak (legendary) |
| Black-capped Chickadee | `black-chickadee` | Premium |

## Key Files

- `lib/birds.ts` - Bird definitions and unlock logic
- `components/ThemeBird.tsx` - Bird avatar component
- `components/aviary/` - Aviary visualization
- `app/api/aviary/route.ts` - Aviary API
- `docs/SONGBIRD_THEME_COLORS.md` - Color definitions

## Database Schema

```prisma
model UnlockedBird {
  id         String   @id @default(cuid())
  userId     String
  birdId     String   // Theme ID
  unlockedAt DateTime @default(now())
  method     String   // 'milestone', 'purchased', 'premium', 'default'

  @@unique([userId, birdId])
  @@index([userId])
}

model User {
  theme String @default("american-robin")  // Currently selected bird
}
```

## Unlock Logic

```typescript
// lib/birds.ts
export async function checkAndUnlockBirds(userId: string): Promise<string[]> {
  const newUnlocks: string[] = []
  
  // Get user stats
  const stats = await getUserStats(userId)
  
  // Check milestone-based unlocks
  const milestones = [
    { birdId: 'house-finch', check: () => stats.totalEntries >= 1 },
    { birdId: 'eastern-bluebird', check: () => stats.currentStreak >= 7 },
    { birdId: 'american-goldfinch', check: () => stats.currentStreak >= 30 },
    { birdId: 'indigo-bunting', check: () => stats.currentStreak >= 50 },
    { birdId: 'baltimore-oriole', check: () => stats.currentStreak >= 100 },
    { birdId: 'cedar-waxwing', check: () => stats.totalEntries >= 25 },
    { birdId: 'painted-bunting', check: () => stats.currentStreak >= 365 },
  ]
  
  for (const { birdId, check } of milestones) {
    if (check() && !stats.unlockedBirds.includes(birdId)) {
      await unlockBird(userId, birdId, 'milestone')
      newUnlocks.push(birdId)
    }
  }
  
  return newUnlocks
}
```

## Theme Colors

Each bird has a complete color palette:

```typescript
const birdThemes = {
  'american-robin': {
    bg: '#1a1c2e',
    text: '#f0eee6',
    accent: '#e07b53',
    surface: '#252840',
    card: '#2a2d48',
  },
  'cardinal': {
    bg: '#1c1a1a',
    text: '#f5f0eb',
    accent: '#c41e3a',
    surface: '#2d2626',
    card: '#362e2e',
  },
  // ... more themes in SONGBIRD_THEME_COLORS.md
}
```

## ThemeBird Component

```tsx
import ThemeBird from '@/components/ThemeBird'

// Basic usage
<ThemeBird />

// With options
<ThemeBird 
  size={64}
  showTooltip
  interactive
  birdId="cardinal"  // Override user's theme
/>
```

## Aviary Feature

The Aviary shows a visual "flock" of the user's friends:

```tsx
interface AviaryBird {
  userId: string
  username: string
  birdId: string  // Their theme/bird
  latestSong: {
    title: string
    artist: string
    albumArt: string
  }
  position: { x: number; y: number }  // Visual placement
}
```

## Changing Birds

```typescript
// User selects a new bird (must be unlocked)
await supabase
  .from('users')
  .update({ theme: 'cardinal' })
  .eq('id', userId)

// Track the change
await trackEvent({
  userId,
  event: AnalyticsEvents.BIRD_CHANGED,
  properties: { birdId: 'cardinal' }
})
```

## Premium Birds

Premium users get instant access to all birds:

```typescript
if (user.isPremium || user.isFoundingMember) {
  // All birds unlocked
  return BIRD_IDS
}
```

## Milestone Celebration

When a user unlocks a new bird:

```tsx
import MilestoneModal from '@/components/MilestoneModal'

{newBirdUnlock && (
  <MilestoneModal
    bird={newBirdUnlock}
    onClose={() => setNewBirdUnlock(null)}
    onSelect={() => {
      selectBird(newBirdUnlock.id)
      setNewBirdUnlock(null)
    }}
  />
)}
```

## Common Issues

### "Bird not unlocking"
- Check `checkAndUnlockBirds()` is called after entry creation
- Verify streak is calculated correctly
- Check for existing unlock record

### "Theme not changing"
- Verify user's `theme` field is updated
- Check CSS variables are being applied
- Force refresh of theme context

### "Wrong bird showing"
- Check `theme` field vs `unlockedBirds`
- Verify component is receiving correct `birdId`



