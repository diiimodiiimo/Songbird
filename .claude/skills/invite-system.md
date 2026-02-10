# /invite-system

Help with SongBird's friend invite system - viral growth and referral tracking.

## Overview

The invite system enables:
- Generating shareable invite links
- Tracking referrals
- Auto-friending on signup
- Viral growth metrics

## Key Files

- `app/api/invites/route.ts` - Invite generation
- `app/api/invites/accept/route.ts` - Accept invite
- `app/join/[code]/page.tsx` - Invite landing page
- `components/InviteFriendsCTA.tsx` - Share UI

## Database Schema

```prisma
model User {
  inviteCode String? @unique  // User's personal invite code
}

model Invite {
  id         String    @id @default(cuid())
  code       String    @unique
  senderId   String
  receiverId String?
  status     String    @default("pending") // pending, accepted, expired
  createdAt  DateTime  @default(now())
  usedAt     DateTime?

  sender   User  @relation("InviteSender", fields: [senderId], references: [id])
  receiver User? @relation("InviteReceiver", fields: [receiverId], references: [id])

  @@index([code])
  @@index([senderId])
}
```

## Invite Code Generation

```typescript
// Generate unique invite code
function generateInviteCode(): string {
  return nanoid(8).toUpperCase()  // e.g., "BIRD4K2Y"
}

// Create invite
const invite = await supabase.from('invites').insert({
  code: generateInviteCode(),
  senderId: userId,
}).select().single()
```

## Invite Link Format

```
https://songbird.app/join/BIRD4K2Y
```

Alternative formats:
- `/join?code=BIRD4K2Y`
- `/invite/BIRD4K2Y`

## Invite Flow

### 1. Generate Invite
```typescript
// POST /api/invites
export async function POST(request: Request) {
  const { userId } = await auth()
  
  const invite = await supabase.from('invites').insert({
    code: generateInviteCode(),
    senderId: userId,
  }).select().single()
  
  // Track analytics
  await trackEvent({
    userId,
    event: AnalyticsEvents.INVITE_LINK_GENERATED,
  })
  
  return NextResponse.json({ 
    code: invite.data.code,
    link: `${APP_URL}/join/${invite.data.code}`,
  })
}
```

### 2. Share Link
```tsx
// InviteFriendsCTA.tsx
const shareInvite = async () => {
  const res = await fetch('/api/invites', { method: 'POST' })
  const { link } = await res.json()
  
  // Use Web Share API if available
  if (navigator.share) {
    await navigator.share({
      title: 'Join me on SongBird! 🐦',
      text: 'Track your daily songs and share music with friends',
      url: link,
    })
    
    trackEvent({ event: AnalyticsEvents.INVITE_LINK_SHARED })
  } else {
    // Fallback: copy to clipboard
    await navigator.clipboard.writeText(link)
    trackEvent({ event: AnalyticsEvents.INVITE_LINK_COPIED })
  }
}
```

### 3. Click Link (Landing Page)
```tsx
// app/join/[code]/page.tsx
export default async function InvitePage({ params }) {
  const { code } = params
  
  // Lookup invite
  const invite = await supabase
    .from('invites')
    .select('*, sender:senderId(username, theme)')
    .eq('code', code)
    .eq('status', 'pending')
    .single()
  
  if (!invite.data) {
    return <ExpiredInvitePage />
  }
  
  return (
    <div>
      <h1>{invite.data.sender.username} invited you!</h1>
      <SignUpButton inviteCode={code} />
    </div>
  )
}
```

### 4. Accept on Signup
```typescript
// During user registration
async function handleSignupWithInvite(userId: string, inviteCode: string) {
  // Mark invite as accepted
  const invite = await supabase
    .from('invites')
    .update({
      receiverId: userId,
      status: 'accepted',
      usedAt: new Date().toISOString(),
    })
    .eq('code', inviteCode)
    .select()
    .single()
  
  if (invite.data) {
    // Auto-create friend request (accepted)
    await supabase.from('friend_requests').insert({
      senderId: invite.data.senderId,
      receiverId: userId,
      status: 'accepted',
    })
    
    // Track analytics
    await trackEvent({
      userId,
      event: AnalyticsEvents.INVITE_CONVERTED,
      properties: { inviterId: invite.data.senderId }
    })
  }
}
```

## Sharing UI

```tsx
<button
  onClick={shareInvite}
  className="flex items-center gap-2 bg-accent text-bg px-4 py-2 rounded-lg"
>
  <ShareIcon />
  Invite Friends
</button>
```

## Metrics to Track

| Metric | Events |
|--------|--------|
| Links Generated | `INVITE_LINK_GENERATED` |
| Links Shared | `INVITE_LINK_SHARED` |
| Conversion Rate | `INVITE_CONVERTED / INVITE_LINK_GENERATED` |
| Auto-friendships | Friend requests with invite source |

## Expiration

Optionally expire old invites:
```typescript
// Expire invites older than 30 days
await supabase
  .from('invites')
  .update({ status: 'expired' })
  .eq('status', 'pending')
  .lt('createdAt', thirtyDaysAgo)
```

## Common Issues

### "Invite code not found"
- Code is case-sensitive (uppercase)
- Invite already used or expired
- Check `status` field

### "Friend request not created"
- Check sender/receiver IDs
- Verify invite was marked accepted
- Check for existing friend relationship


