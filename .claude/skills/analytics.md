# /analytics

Help with the SongBird analytics system - event tracking, user properties, and insights.

## Key Files

- `lib/analytics.ts` - Server-side analytics (database storage)
- `lib/analytics-client.ts` - Client-side analytics (if exists)
- `app/api/analytics/event/route.ts` - Event tracking API

## Event Categories

### Authentication & Onboarding
```typescript
AnalyticsEvents.USER_SIGNED_UP
AnalyticsEvents.USER_LOGGED_IN
AnalyticsEvents.ONBOARDING_STARTED
AnalyticsEvents.ONBOARDING_STEP_COMPLETED
AnalyticsEvents.ONBOARDING_SKIPPED
AnalyticsEvents.ONBOARDING_COMPLETED
```

### Core Loop (Song Entries)
```typescript
AnalyticsEvents.ENTRY_STARTED
AnalyticsEvents.ENTRY_SONG_SEARCHED
AnalyticsEvents.ENTRY_SONG_SELECTED
AnalyticsEvents.ENTRY_NOTE_ADDED
AnalyticsEvents.ENTRY_CREATED
AnalyticsEvents.ENTRY_EDITED
AnalyticsEvents.ENTRY_DELETED
```

### Engagement
```typescript
AnalyticsEvents.APP_OPENED
AnalyticsEvents.TAB_VIEWED
AnalyticsEvents.MEMORY_VIEWED
AnalyticsEvents.MEMORY_SONG_PLAYED
```

### Social
```typescript
AnalyticsEvents.FRIEND_REQUEST_SENT
AnalyticsEvents.FRIEND_REQUEST_ACCEPTED
AnalyticsEvents.VIBE_GIVEN
AnalyticsEvents.COMMENT_CREATED
AnalyticsEvents.PROFILE_VIEWED
```

### Invites
```typescript
AnalyticsEvents.INVITE_LINK_GENERATED
AnalyticsEvents.INVITE_LINK_SHARED
AnalyticsEvents.INVITE_CONVERTED
```

### Streaks & Milestones
```typescript
AnalyticsEvents.STREAK_CONTINUED
AnalyticsEvents.STREAK_FREEZE_ACTIVATED
AnalyticsEvents.STREAK_BROKEN
AnalyticsEvents.STREAK_MILESTONE_REACHED
AnalyticsEvents.BIRD_UNLOCKED
```

### Premium
```typescript
AnalyticsEvents.CHECKOUT_STARTED
AnalyticsEvents.CHECKOUT_COMPLETED
AnalyticsEvents.PREMIUM_ACTIVATED
```

## Usage Patterns

### Track Event (Server-Side)
```typescript
import { trackEvent, AnalyticsEvents } from '@/lib/analytics'

await trackEvent({
  userId: userId,
  event: AnalyticsEvents.ENTRY_CREATED,
  properties: {
    songTitle: 'Yesterday',
    artist: 'The Beatles',
    hasNotes: true,
    hasPeople: false,
  }
})
```

### Track Multiple Events
```typescript
import { trackEvents } from '@/lib/analytics'

await trackEvents([
  { userId, event: AnalyticsEvents.ENTRY_CREATED, properties: { ... } },
  { userId, event: AnalyticsEvents.STREAK_CONTINUED, properties: { streak: 7 } },
])
```

### Get User Properties
```typescript
import { getUserProperties } from '@/lib/analytics'

const props = await getUserProperties(userId)
// Returns:
// {
//   totalEntries: number,
//   currentStreak: number,
//   longestStreak: number,
//   friendCount: number,
//   selectedBird: string,
//   hasCompletedOnboarding: boolean,
//   isPremium: boolean,
//   isFoundingMember: boolean,
//   createdAt: Date,
// }
```

## Database Schema

```prisma
model AnalyticsEvent {
  id         String   @id @default(cuid())
  userId     String?  // Nullable for anonymous events
  event      String   // Event name (snake_case)
  properties Json?    // Additional event properties
  createdAt  DateTime @default(now())

  @@index([userId])
  @@index([event])
  @@index([createdAt])
}
```

## Best Practices

### Event Naming
- Use snake_case
- Past tense verbs (`entry_created`, not `create_entry`)
- Specific and descriptive

### Properties
- Include relevant context
- Don't include PII in properties
- Keep properties flat (avoid deep nesting)

### When to Track
- User actions (clicks, submissions)
- System events (unlocks, milestones)
- Errors (for debugging, not personal data)

### Don't Track
- Passwords or tokens
- Full notes content (privacy)
- Excessive detail (performance)

## Querying Analytics

```typescript
import { getEventCount, getRecentEvents } from '@/lib/analytics'

// Get count of specific event
const signups = await getEventCount(AnalyticsEvents.USER_SIGNED_UP, {
  startDate: new Date('2024-01-01'),
  endDate: new Date('2024-12-31'),
})

// Get recent events for user
const events = await getRecentEvents(userId, 50)
```

## Key Metrics to Track

| Metric | Events |
|--------|--------|
| Activation | ONBOARDING_COMPLETED, ENTRY_CREATED (first) |
| Retention | APP_OPENED, ENTRY_CREATED (repeat) |
| Engagement | VIBE_GIVEN, COMMENT_CREATED, MEMORY_VIEWED |
| Growth | INVITE_LINK_SHARED, INVITE_CONVERTED |
| Revenue | CHECKOUT_COMPLETED, PREMIUM_ACTIVATED |



