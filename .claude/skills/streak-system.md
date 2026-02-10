# /streak-system

Help with the SongBird streak system - implementation, debugging, or extending. Understand the rules and edge cases.

## Streak Rules

### Core Logic
1. **Same-day requirement**: Entry only counts if logged on the SAME calendar day as `entry.date`
2. **One entry per day**: Unique constraint `[userId, date]` on entries
3. **Streak continues**: If user logged yesterday AND logs today
4. **Streak breaks**: If user misses 2+ days without freeze

### Streak Freeze
- Auto-activates if user misses ONE day (covers the gap)
- Each user gets 1 freeze
- Regenerates after 7 consecutive days of logging
- Cannot save 2+ missed days

### Streak Restore
- One free restore per 30 days
- Can restore broken streak (once per month)
- Useful when freeze was already used

## Key Files

- `lib/streak.ts` - Core streak calculation logic
- `lib/birds.ts` - Bird unlocks based on streaks
- `app/api/streak/route.ts` - Streak API endpoint
- `components/AddEntryTab.tsx` - Shows streak in UI

## Code Patterns

### Calculate Streak
```typescript
import { calculateStreak } from '@/lib/streak'

const result = await calculateStreak(userId)
// Returns:
// {
//   currentStreak: number,
//   longestStreak: number,
//   streakFreezeAvailable: boolean,
//   streakFrozenToday: boolean,
//   canRestore: boolean,
//   newBirdUnlocks?: string[],
//   streakMilestoneReached?: number
// }
```

### Restore Streak
```typescript
import { restoreStreak } from '@/lib/streak'

const result = await restoreStreak(userId)
// { success: boolean, message?: string }
```

### Calculate From Entries (Fresh)
```typescript
import { calculateStreakFromEntries } from '@/lib/streak'

const streak = await calculateStreakFromEntries(userId)
```

## Database Fields (User)

```prisma
model User {
  currentStreak         Int       @default(0)
  longestStreak         Int       @default(0)
  lastStreakDate        DateTime?
  streakFreezeAvailable Boolean   @default(true)
  streakFreezeUsedAt    DateTime?
  lastStreakRestoreAt   DateTime?
}
```

## Streak Milestones (Bird Unlocks)

| Milestone | Bird Unlocked |
|-----------|---------------|
| 7 days | Eastern Bluebird |
| 30 days | American Goldfinch |
| 50 days | Indigo Bunting |
| 100 days | Baltimore Oriole |
| 365 days | Painted Bunting (rare) |

## Edge Cases to Handle

1. **Timezone issues**: User in different timezone than server
2. **Backdated entries**: User logging for past date
3. **Multiple entries same day**: Should only count once
4. **Freeze timing**: When exactly does freeze activate?
5. **Month boundary**: For 30-day restore limit

## Common Issues

### "Streak broke unexpectedly"
- Check `lastStreakDate` vs today
- Verify same-day entry validation
- Check timezone handling

### "Freeze didn't activate"
- Was `streakFreezeAvailable` true?
- Was it exactly 1 missed day?
- Check `streakFreezeUsedAt` timestamp

### "Bird didn't unlock"
- Check `checkAndUnlockBirds()` was called
- Verify streak milestone matches requirement
- Check analytics event was tracked

## Testing Checklist

- [ ] Streak continues with consecutive days
- [ ] Streak breaks after 2 missed days
- [ ] Freeze activates on 1 missed day
- [ ] Freeze regenerates after 7 days
- [ ] Restore works once per month
- [ ] Milestones trigger bird unlocks
- [ ] Analytics tracks streak events


