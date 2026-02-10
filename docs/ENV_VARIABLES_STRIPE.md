# Environment Variables for Stripe Payment Options

Add these to your `.env.local` file:

```env
# Stripe API Keys
STRIPE_SECRET_KEY=sk_test_xxxxx  # Your Stripe secret key (starts with sk_test_ or sk_live_)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_xxxxx  # Your Stripe publishable key (starts with pk_test_ or pk_live_)

# Stripe Webhook Secret (for local testing, get from: stripe listen --forward-to localhost:3000/api/webhooks/stripe)
STRIPE_WEBHOOK_SECRET=whsec_xxxxx

# Stripe Price IDs (get these from Stripe Dashboard → Products → Copy Price ID)
# IMPORTANT: These must be PRICE IDs (start with price_), NOT Product IDs (prod_)

# Founding Flock Special - $39.99 one-time payment
STRIPE_FOUNDING_FLOCK_SPECIAL_PRICE_ID=price_xxxxx

# Founding Flock Yearly - $29.99/year recurring subscription
STRIPE_FOUNDING_FLOCK_YEARLY_PRICE_ID=price_xxxxx

# Monthly Subscription - $3/month recurring subscription
STRIPE_MONTHLY_PRICE_ID=price_xxxxx

# App URL (for redirects)
NEXT_PUBLIC_APP_URL=http://localhost:3000  # Change to your production URL when deploying

# Pricing Constants (optional - defaults are set, but you can override)
FOUNDING_FLOCK_SPECIAL_PRICE_CENTS=3999  # $39.99
FOUNDING_FLOCK_YEARLY_PRICE_CENTS=2999   # $29.99
MONTHLY_PRICE_CENTS=300                   # $3.00
FOUNDING_FLOCK_LIMIT=1000                # Max founding members
```

## How to Get Price IDs

1. **Go to Stripe Dashboard** → **Products**
2. **Click on each product** you created
3. **Find the Pricing section**
4. **Copy the Price ID** (starts with `price_`)
5. **Add to `.env.local`**

## Example .env.local

```env
# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_51AbCdEfGhIjKlMnOpQrStUvWxYz1234567890
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_51AbCdEfGhIjKlMnOpQrStUvWxYz1234567890
STRIPE_WEBHOOK_SECRET=whsec_1234567890abcdefghijklmnopqrstuvwxyz

# Price IDs (replace with your actual price IDs from Stripe)
STRIPE_FOUNDING_FLOCK_SPECIAL_PRICE_ID=price_1AbCdEfGhIjKlMnOpQrStUvW
STRIPE_FOUNDING_FLOCK_YEARLY_PRICE_ID=price_1XyZaBcDeFgHiJkLmNoPqRsTu
STRIPE_MONTHLY_PRICE_ID=price_1MnOpQrStUvWxYzAbCdEfGhIjK

# App URL
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Important Notes

- ⚠️ **Price IDs start with `price_`, NOT `prod_`**
- ⚠️ **Never commit `.env.local` to git** (it should be in `.gitignore`)
- ⚠️ **Restart dev server** after adding/updating environment variables
- ⚠️ **Use test keys** (`sk_test_`, `pk_test_`) for development
- ⚠️ **Switch to live keys** (`sk_live_`, `pk_live_`) for production

## Testing

After setting up your `.env.local`:

1. **Restart dev server**: `npm run dev`
2. **Test configuration**: Visit `http://localhost:3000/api/test/stripe`
3. **Should show**: `allChecksPassed: true`


