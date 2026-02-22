# /blocking-reporting

Help with SongBird's user safety features - blocking and reporting systems.

## Blocking System

### Key Files
- `lib/blocking.ts` - Blocking utilities
- `app/api/users/[username]/block/route.ts` - Block/unblock API
- `components/ReportModal.tsx` - Report UI

### Database Schema

```prisma
model BlockedUser {
  id        String   @id @default(cuid())
  blockerId String   // User who blocked
  blockedId String   // User who is blocked
  createdAt DateTime @default(now())

  blocker User @relation("Blocker", fields: [blockerId], references: [id])
  blocked User @relation("Blocked", fields: [blockedId], references: [id])

  @@unique([blockerId, blockedId])
}
```

### Blocking Functions

```typescript
import { isUserBlocked, getBlockedUserIds, getBlockStatus } from '@/lib/blocking'

// Check if user A blocked user B
const blocked = await isUserBlocked(blockerUserId, blockedUserId)

// Get all blocked user IDs for a user
const blockedIds = await getBlockedUserIds(userId)

// Check mutual block status
const status = await getBlockStatus(userId1, userId2)
// Returns:
// {
//   user1BlockedUser2: boolean,
//   user2BlockedUser1: boolean,
// }
```

### What Blocking Does

When user A blocks user B:
1. B is removed from A's friend list
2. B cannot see A's entries in feed
3. B cannot view A's profile
4. B cannot send friend requests to A
5. A's entries don't appear in B's feed
6. Mentions of A are hidden from B

### Filtering Blocked Users

```typescript
// In feed API
const blockedIds = await getBlockedUserIds(userId)

// Filter entries from blocked users
const entries = await supabase
  .from('entries')
  .select('*')
  .not('userId', 'in', `(${blockedIds.join(',')})`)
```

## Reporting System

### Database Schema

```prisma
model Report {
  id                String   @id @default(cuid())
  reporterId        String
  reportedUserId    String?
  reportedEntryId   String?
  reportedCommentId String?
  type              String   // 'user', 'entry', 'comment'
  reason            String   // 'harassment', 'spam', 'inappropriate', 'other'
  description       String?
  status            String   @default("pending")
  createdAt         DateTime @default(now())
  reviewedAt        DateTime?
  reviewedBy        String?
}
```

### Report Reasons

| Reason | Description |
|--------|-------------|
| `harassment` | Bullying, threats, targeted abuse |
| `spam` | Promotional content, repetitive posts |
| `inappropriate` | NSFW, offensive content |
| `other` | Other violations (requires description) |

### Report Types

| Type | What's Reported |
|------|-----------------|
| `user` | User profile/behavior |
| `entry` | Specific song entry |
| `comment` | Comment on an entry |

### Creating a Report

```typescript
const report = await supabase.from('reports').insert({
  reporterId: currentUserId,
  reportedUserId: targetUserId,
  type: 'user',
  reason: 'harassment',
  description: 'Optional details...',
})
```

### Admin Review

Reports should be reviewed by admins:
1. View pending reports
2. Investigate reported content
3. Take action (warn, ban, dismiss)
4. Mark report as reviewed

## UI Components

### Block Button
```tsx
<button onClick={() => handleBlock(userId)}>
  {isBlocked ? 'Unblock' : 'Block'}
</button>
```

### Report Modal
```tsx
import ReportModal from '@/components/ReportModal'

<ReportModal
  isOpen={showReport}
  onClose={() => setShowReport(false)}
  type="user"
  targetId={userId}
/>
```

## API Routes

| Route | Method | Description |
|-------|--------|-------------|
| `/api/users/[username]/block` | POST | Block user |
| `/api/users/[username]/block` | DELETE | Unblock user |
| `/api/reports` | POST | Create report |
| `/api/reports` | GET | List reports (admin) |
| `/api/reports/[id]` | PUT | Review report (admin) |

## Privacy Considerations

1. **Reporter anonymity**: Don't expose who reported
2. **Block privacy**: Don't tell blocked user they're blocked
3. **Report confidentiality**: Keep report details private
4. **Data retention**: How long to keep reports?

## Common Issues

### "Blocked user still visible"
- Check all queries filter blocked users
- Verify `getBlockedUserIds()` returns correct IDs
- Check blocking is bidirectional where needed

### "Reports not saving"
- Verify reporter ID is set
- Check required fields are provided
- Validate report type is valid



