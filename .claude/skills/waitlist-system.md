# /waitlist-system

Help with SongBird's pre-launch waitlist system.

## Overview

The waitlist allows users to sign up before the app is publicly available:
- Collect emails for launch notification
- Track referral sources (TikTok, Instagram, etc.)
- Grant Founding Flock access to early signups

## Key Files

- `app/waitlist/page.tsx` - Waitlist signup page
- `app/api/waitlist/route.ts` - Waitlist API
- `components/WaitlistForm.tsx` - Signup form
- `docs/WAITLIST_ACCESS_CONTROL.md` - Access logic

## Database Schema

```prisma
model WaitlistEntry {
  id                    String   @id @default(cuid())
  email                 String   @unique
  name                  String?
  source                String?  // TikTok, Instagram, etc.
  referralCode          String?  // For viral tracking
  joinedAt              DateTime @default(now())
  invitedAt             DateTime?
  foundingFlockEligible Boolean  @default(true)

  @@index([email])
  @@index([referralCode])
  @@index([joinedAt])
}
```

## Signup Flow

```typescript
// POST /api/waitlist
export async function POST(request: Request) {
  const { email, name, source, referralCode } = await request.json()
  
  // Check if already on waitlist
  const existing = await supabase
    .from('waitlist_entries')
    .select('id')
    .eq('email', email)
    .maybeSingle()
  
  if (existing.data) {
    return NextResponse.json({ 
      message: "You're already on the list!" 
    })
  }
  
  // Add to waitlist
  await supabase.from('waitlist_entries').insert({
    email,
    name,
    source,
    referralCode,
    foundingFlockEligible: true,
  })
  
  // Track analytics
  await trackEvent({
    event: 'waitlist_signup',
    properties: { source, hasReferral: !!referralCode }
  })
  
  return NextResponse.json({ success: true })
}
```

## Waitlist Form Component

```tsx
export default function WaitlistForm() {
  const [email, setEmail] = useState('')
  const [source, setSource] = useState('')
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    await fetch('/api/waitlist', {
      method: 'POST',
      body: JSON.stringify({ email, source }),
    })
    
    setSubmitted(true)
  }

  if (submitted) {
    return <div>You're on the list! 🎉</div>
  }

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="your@email.com"
        required
      />
      <select value={source} onChange={(e) => setSource(e.target.value)}>
        <option value="">How did you hear about us?</option>
        <option value="tiktok">TikTok</option>
        <option value="instagram">Instagram</option>
        <option value="twitter">Twitter/X</option>
        <option value="friend">Friend</option>
        <option value="other">Other</option>
      </select>
      <button type="submit">Join Waitlist</button>
    </form>
  )
}
```

## Referral System

Each waitlist signup can have a referral code:
- Track viral growth
- Reward referrers (early access, etc.)
- Generate unique links

```typescript
// Generate referral link
const referralCode = generateReferralCode(email)
const referralLink = `https://songbird.app/waitlist?ref=${referralCode}`
```

## Inviting Waitlist Users

When ready to invite:

```typescript
// Mark user as invited
await supabase
  .from('waitlist_entries')
  .update({ invitedAt: new Date().toISOString() })
  .eq('email', email)

// Send invite email (via your email service)
await sendInviteEmail(email, {
  subject: "You're in! 🐦 Welcome to SongBird",
  // ...
})
```

## Access Control

Check if user is allowed in:

```typescript
async function isUserAllowed(email: string): Promise<boolean> {
  // Check waitlist
  const waitlist = await supabase
    .from('waitlist_entries')
    .select('invitedAt, foundingFlockEligible')
    .eq('email', email)
    .maybeSingle()
  
  // Not on waitlist - check if open access
  if (!waitlist.data) {
    return OPEN_ACCESS_ENABLED
  }
  
  // On waitlist - check if invited
  return !!waitlist.data.invitedAt
}
```

## Metrics to Track

| Metric | Query |
|--------|-------|
| Total signups | `COUNT(*)` |
| Signups by source | `GROUP BY source` |
| Referral effectiveness | `COUNT(referralCode)` |
| Conversion rate | `invited / total` |

## Common Patterns

### "Join Waitlist" CTA
```tsx
<button 
  onClick={() => router.push('/waitlist')}
  className="bg-accent text-bg px-6 py-3 rounded-full"
>
  Join the Waitlist
</button>
```

### Show Position
```tsx
const position = await getWaitlistPosition(email)
<p>You're #{position} on the waitlist</p>
```

## Launch Transition

When ready for public launch:
1. Set `OPEN_ACCESS_ENABLED=true`
2. Send final invite batch
3. Update landing page to remove waitlist
4. Keep waitlist data for Founding Flock eligibility


