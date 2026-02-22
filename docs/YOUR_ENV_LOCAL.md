# Your .env.local File - Stripe Configuration

Copy this template and replace the `xxxxx` values with your actual Stripe values:

```env
# ============================================
# STRIPE CONFIGURATION
# ============================================

# Stripe API Keys (get from: Stripe Dashboard → Developers → API keys)
STRIPE_SECRET_KEY=sk_test_xxxxx
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_xxxxx

# Stripe Webhook Secret (for local testing)
# Run: stripe listen --forward-to localhost:3000/api/webhooks/stripe
# Copy the webhook secret it shows (starts with whsec_)
STRIPE_WEBHOOK_SECRET=whsec_xxxxx

# ============================================
# STRIPE PRICE IDs
# ============================================
# IMPORTANT: These must be PRICE IDs (start with price_), NOT Product IDs (prod_)
# Get these from: Stripe Dashboard → Products → Click product → Copy Price ID

# 1. Founding Flock Special - $39.99 one-time payment
STRIPE_FOUNDING_FLOCK_SPECIAL_PRICE_ID=price_xxxxx

# 2. Founding Flock Yearly - $29.99/year recurring subscription  
STRIPE_FOUNDING_FLOCK_YEARLY_PRICE_ID=price_xxxxx

# 3. Monthly Subscription - $3/month recurring subscription
STRIPE_MONTHLY_PRICE_ID=price_xxxxx

# ============================================
# APP CONFIGURATION
# ============================================

# App URL (for redirects after checkout)
NEXT_PUBLIC_APP_URL=http://localhost:3000

# ============================================
# OPTIONAL: Pricing Constants
# ============================================
# These have defaults, but you can override if needed
FOUNDING_FLOCK_SPECIAL_PRICE_CENTS=3999
FOUNDING_FLOCK_YEARLY_PRICE_CENTS=2999
MONTHLY_PRICE_CENTS=300
FOUNDING_FLOCK_LIMIT=1000
```

## Quick Setup Steps

1. **Create products in Stripe Dashboard:**
   - Founding Flock Special: $39.99, One-time
   - Founding Flock Yearly: $29.99, Recurring Yearly
   - Monthly: $3.00, Recurring Monthly

2. **Copy Price IDs** (they start with `price_`)

3. **Add to `.env.local`** (create file if it doesn't exist)

4. **Get webhook secret:**
   ```bash
   stripe listen --forward-to localhost:3000/api/webhooks/stripe
   ```
   Copy the `whsec_xxxxx` value

5. **Restart dev server:**
   ```bash
   npm run dev
   ```

6. **Test configuration:**
   Visit: `http://localhost:3000/api/test/stripe`
   Should show: `allChecksPassed: true`

## What Each Product Should Be

### Product 1: Founding Flock Special
- **Name**: `SongBird Founding Flock - Lifetime Access`
- **Description**: `Join the Founding Flock and get lifetime premium access for just $39.99 - one payment, forever. Limited to the first 1,000 members. Includes all premium features: unlimited entries, full history access, advanced analytics, all bird themes unlocked, unlimited friends, Wrapped feature, and all future premium features. Be part of the community that started it all.`
- **Pricing**: `One-off` (NOT Recurring)
- **Price**: `$39.99`
- **Tax Code**: `txcd_10301000` (Software as a Service)

### Product 2: Founding Flock Yearly
- **Name**: `SongBird Founding Flock - Annual`
- **Description**: `Founding Flock annual membership at $29.99/year - locked rate forever. Join the first 1,000 members and get lifetime access to this special pricing. Includes all premium features: unlimited entries, full history access, advanced analytics, all bird themes unlocked, unlimited friends, Wrapped feature, and all future premium features. This rate will never increase for founding members.`
- **Pricing**: `Recurring`
- **Price**: `$29.99`
- **Billing period**: `Yearly`
- **Tax Code**: `txcd_10301000` (Software as a Service)

### Product 3: Monthly
- **Name**: `SongBird Premium - Monthly`
- **Description**: `Monthly premium subscription for $3/month. Track your daily songs with unlimited entries, access your full music history, see advanced analytics, unlock all bird themes, connect with unlimited friends, and get your year-end Wrapped summary. Cancel anytime.`
- **Pricing**: `Recurring`
- **Price**: `$3.00`
- **Billing period**: `Monthly`
- **Tax Code**: `txcd_10301000` (Software as a Service)

## After Setup

Once all three products are created and Price IDs are in `.env.local`:

1. ✅ Restart dev server
2. ✅ Test at `/api/test/stripe` - should pass all checks
3. ✅ Visit `/settings/premium` - should see all 3 options
4. ✅ Test checkout flows with test card: `4242 4242 4242 4242`



