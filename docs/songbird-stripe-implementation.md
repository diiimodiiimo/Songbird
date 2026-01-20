# SongBird Founding Flock - Stripe Implementation Guide

> **For Cursor**: This document outlines everything needed to implement Stripe payments for SongBird's Founding Flock lifetime membership. Follow each section in order.

---

## Context & Business Logic

**What we're building:**
- One-time $29.99 payment for lifetime "Founding Flock" membership
- Uses Stripe Checkout (hosted payment page) - simplest approach
- Webhook confirms payment → flips user flags in database
- No subscription logic needed yet (that comes later)

**Pricing Model:**
- $29.99 one-time (2999 cents)
- 1000 founding slots available (not shown publicly)
- Friends get manually granted via script (no payment)

---

## 1. Environment Setup

**Install:**
```bash
npm install stripe
```

**Add to `.env.local`:**
```
STRIPE_SECRET_KEY=sk_test_xxxxx
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_xxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxx
FOUNDING_FLOCK_PRICE_CENTS=2999
FOUNDING_FLOCK_LIMIT=1000
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

Get keys from: https://dashboard.stripe.com/apikeys

---

## 2. Database Schema Changes

**Add these fields to the User model in Prisma:**

| Field | Type | Default | Purpose |
|-------|------|---------|---------|
| `isPremium` | Boolean | false | Gates premium features |
| `isFoundingMember` | Boolean | false | Tracks founding status (for badge, exclusive bird) |
| `premiumSince` | DateTime? | null | When they upgraded |
| `stripeCustomerId` | String? | null | Links to Stripe customer (unique) |

Run migration after adding fields.

---

## 3. Files to Create

### `lib/stripe.ts`
- Initialize Stripe client with secret key
- Export constants for price (2999 cents) and limit (1000)
- Throw error if STRIPE_SECRET_KEY not set

### `lib/premium.ts`
- `isPremiumUser(clerkId)` → returns boolean
- `isFoundingMember(clerkId)` → returns boolean  
- `getUserPremiumStatus(clerkId)` → returns object with all premium fields

### `app/api/checkout/founding-flock/route.ts`
**POST handler that:**
1. Authenticates user via Clerk
2. Gets user from database
3. Returns error if already premium
4. Checks founding slots remaining (count where isFoundingMember = true)
5. Returns error if >= 1000 founding members
6. Creates or retrieves Stripe customer (store stripeCustomerId)
7. Creates Stripe Checkout Session with:
   - `mode: 'payment'` (NOT subscription)
   - Product name: "SongBird Founding Flock"
   - Description: "Lifetime premium access - All birds unlocked, B-sides, unlimited friends, full analytics, Wrapped, and all future features forever."
   - Amount: 2999 cents USD
   - success_url: `/settings/premium?success=true&session_id={CHECKOUT_SESSION_ID}`
   - cancel_url: `/settings/premium?canceled=true`
   - metadata: `{ clerkId, songbirdUserId, type: 'founding_flock' }`
8. Returns `{ url: session.url }` for redirect

### `app/api/webhooks/stripe/route.ts`
**POST handler that:**
1. Gets raw body and stripe-signature header
2. Verifies webhook signature with STRIPE_WEBHOOK_SECRET
3. Handles `checkout.session.completed` event:
   - Check metadata.type === 'founding_flock'
   - Check payment_status === 'paid'
   - Get songbirdUserId from metadata
   - Update user: `isPremium: true, isFoundingMember: true, premiumSince: new Date()`
4. Also handle `checkout.session.async_payment_succeeded` (same logic)
5. Return `{ received: true }`

**Important:** This route needs raw body access - don't parse JSON. Next.js App Router handles this automatically with `req.text()`.

### `app/api/founding-slots/route.ts`
**GET handler that:**
1. Counts users where isFoundingMember = true
2. Returns `{ total: 1000, claimed: count, remaining: 1000-count, available: boolean }`

### `components/FoundingFlockButton.tsx`
**Client component that:**
1. Has loading state
2. On click: POST to `/api/checkout/founding-flock`
3. Handle errors (already premium, slots full)
4. On success: `window.location.href = data.url` (redirect to Stripe)
5. Button text: "Claim My Spot — $29.99"

### `scripts/grant-founding-member.ts`
**CLI script for granting friends free access:**
- Takes email as command line argument
- Finds user by email
- Sets `isPremium: true, isFoundingMember: true, premiumSince: new Date()`
- Run with: `npx ts-node scripts/grant-founding-member.ts friend@email.com`

---

## 4. Feature Gating Logic

Use `isPremiumUser()` or `isFoundingMember()` checks in these places:

| Feature | Free | Premium | How to Gate |
|---------|------|---------|-------------|
| B-sides | ❌ | ✅ | Check isPremium before allowing additional songs per day |
| Friends | 20 max | Unlimited | Count friends, block if >= 20 and not premium |
| On This Day | 30 days back | Full history | Filter query date range based on premium status |
| Analytics | Basic stats | Full history | Limit data range in queries |
| Bird themes | Earn via streaks | All unlocked + Goldfinch | Return all birds if premium, else check streak |

---

## 5. Testing Locally

**Set up Stripe CLI for webhooks:**
```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

This gives you a webhook secret (whsec_...) - add to .env.local

**Test card numbers:**
- Success: 4242 4242 4242 4242
- Decline: 4000 0000 0000 0002
- Requires auth: 4000 0025 0000 3155

---

## 6. Production Checklist

- [ ] Switch to live Stripe keys (sk_live_, pk_live_)
- [ ] Create webhook endpoint in Stripe Dashboard pointing to `/api/webhooks/stripe`
- [ ] Add webhook secret from Dashboard to production env vars
- [ ] Set NEXT_PUBLIC_APP_URL to production domain
- [ ] Test full flow with real card (can refund immediately)

---

## 7. Important Notes

**Stripe Checkout mode:**
- Use `mode: 'payment'` for one-time purchase
- NOT `mode: 'subscription'` - we don't need recurring billing yet

**Webhook security:**
- Always verify signature
- Don't trust client-side success redirects alone
- Webhook is source of truth for payment confirmation

**Metadata:**
- Store clerkId and songbirdUserId in checkout session metadata
- This is how webhook knows which user to upgrade

**Customer creation:**
- Create Stripe customer on first checkout attempt
- Store stripeCustomerId for future use (when you add subscriptions later)

---

## Summary of User Flows

**Happy path:**
1. User clicks "Claim My Spot — $29.99"
2. Frontend POSTs to `/api/checkout/founding-flock`
3. Backend creates Stripe session, returns URL
4. User redirected to Stripe Checkout
5. User pays with card
6. Stripe sends webhook to `/api/webhooks/stripe`
7. Webhook updates user to premium
8. User redirected to success page
9. User now has all premium features

**Friend path:**
1. Friend signs up for SongBird (free)
2. You run: `npx ts-node scripts/grant-founding-member.ts friend@email.com`
3. Friend now has premium + founding badge
    