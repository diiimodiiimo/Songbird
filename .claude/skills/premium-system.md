# /premium-system

Help with SongBird's premium/Founding Flock system - Stripe integration, feature flags, and subscription management.

## Overview

SongBird has a tiered system:
- **Free**: Basic features, limited history
- **Founding Flock**: $29.99 lifetime (early adopters)
- **Premium** (future): Monthly subscription

## Key Files

- `lib/premium.ts` - Premium status checks and feature flags
- `lib/stripe.ts` - Stripe client (currently disabled)
- `lib/birds.ts` - Bird unlocks (premium gets all)
- `app/api/checkout/founding-flock/route.ts` - Checkout session
- `app/api/webhooks/stripe/route.ts` - Stripe webhooks
- `app/api/user/subscription/route.ts` - Subscription status

## Database Fields

```prisma
model User {
  isPremium             Boolean   @default(false)
  isFoundingMember      Boolean   @default(false)
  premiumSince          DateTime?
  stripeCustomerId      String?   @unique
  subscriptionTier      String?   // 'founding_flock' | 'monthly' | null
}
```

## Premium Status Checks

```typescript
import { isPremiumUser, isFoundingMember, getUserPremiumStatus } from '@/lib/premium'

// Check if premium (by Clerk ID)
const isPremium = await isPremiumUser(clerkId)

// Check founding member status
const isFounder = await isFoundingMember(clerkId)

// Get full status
const status = await getUserPremiumStatus(clerkId)
// Returns:
// {
//   isPremium: boolean,
//   isFoundingMember: boolean,
//   premiumSince: Date | null,
//   stripeCustomerId: string | null,
// }
```

## Feature Flags

```typescript
import { getPremiumFeatures } from '@/lib/premium'

const features = getPremiumFeatures(isPremium)
// Returns:
// {
//   allBirdsUnlocked: boolean,     // Premium: all birds
//   bSidesEnabled: boolean,        // Premium: multiple songs/day
//   onThisDayFullHistory: boolean, // Premium: full history
//   analyticsFullHistory: boolean, // Premium: full analytics
//   wrappedEnabled: boolean,       // Premium: Wrapped feature
//   exportEnabled: boolean,        // Premium: data export
//   friendLimit: number,           // Free: 20, Premium: Infinity
// }
```

## Stripe Integration

### Environment Variables
```
STRIPE_SECRET_KEY=sk_test_xxxxx
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_xxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxx
FOUNDING_FLOCK_PRICE_CENTS=2999
FOUNDING_FLOCK_LIMIT=1000
```

### Create Checkout Session
```typescript
// In API route
const session = await stripe.checkout.sessions.create({
  mode: 'payment',
  payment_method_types: ['card'],
  line_items: [{
    price_data: {
      currency: 'usd',
      product_data: { name: 'SongBird Founding Flock' },
      unit_amount: 2999,
    },
    quantity: 1,
  }],
  success_url: `${APP_URL}/settings/premium?success=true`,
  cancel_url: `${APP_URL}/settings/premium?canceled=true`,
  metadata: { userId, clerkId },
})
```

### Webhook Handler
```typescript
// Verify signature
const event = stripe.webhooks.constructEvent(body, sig, WEBHOOK_SECRET)

switch (event.type) {
  case 'checkout.session.completed':
    // Grant premium access
    await supabase.from('users').update({
      isPremium: true,
      isFoundingMember: true,
      premiumSince: new Date().toISOString(),
      stripeCustomerId: session.customer,
    }).eq('id', userId)
    break
}
```

## Founding Flock Benefits

| Feature | Free | Founding Flock |
|---------|------|----------------|
| Daily entries | ✓ | ✓ |
| On This Day | 30 days | Full history |
| Analytics | 4 weeks | Full history |
| Wrapped | ✗ | ✓ |
| All birds | Earn via streaks | All unlocked |
| B-sides | ✗ | ✓ |
| Data export | ✗ | ✓ |
| Friend limit | 20 | Unlimited |
| Founding badge | ✗ | ✓ |

## Current State

**Note**: Stripe is currently disabled (`lib/stripe.ts` exports `null`). All users get Founding Flock access (`isFoundingMember = true` in `lib/birds.ts`).

To enable Stripe:
1. Set environment variables
2. Update `lib/stripe.ts` to create real client
3. Create Stripe products/prices
4. Set up webhook endpoint in Stripe dashboard

## Testing

- Use Stripe test mode keys
- Test cards: `4242 4242 4242 4242`
- See `docs/STRIPE_TESTING_GUIDE.md` for more

## Common Issues

### "Premium not activating"
- Check webhook is receiving events
- Verify signature is correct
- Check user ID in metadata

### "Wrong price shown"
- Check `FOUNDING_FLOCK_PRICE_CENTS` env var
- Verify Stripe product configuration



