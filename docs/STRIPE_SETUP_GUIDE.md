# Stripe Setup Guide for SongBird

This guide will help you set up Stripe products and prices for SongBird's subscription plans.

## Prerequisites

1. Stripe account (sign up at https://stripe.com)
2. Access to Stripe Dashboard

## Step 1: Create Products in Stripe

### 1.1 Founding Flock Product

1. Go to Stripe Dashboard → **Products**
2. Click **"Add product"**
3. Fill in:
   - **Name**: `SongBird Founding Flock`
   - **Description**: `Lifetime premium access - All birds unlocked, unlimited entries, full history, advanced analytics, Wrapped, and all future features forever. Limited to 1,000 founding members.`
   - **Pricing model**: `Recurring`
   - **Price**: `$24.00`
   - **Billing period**: `Yearly`
   - **Currency**: `USD`
4. Click **"Save product"**
5. **Copy the Price ID** (starts with `price_`) - you'll need this for `STRIPE_FOUNDING_FLOCK_PRICE_ID`

### 1.2 Monthly Subscription Product

1. Click **"Add product"** again
2. Fill in:
   - **Name**: `SongBird Premium Monthly`
   - **Description**: `Monthly premium subscription - All premium features including unlimited entries, full history access, advanced analytics, unlimited friends, and Wrapped.`
   - **Pricing model**: `Recurring`
   - **Price**: `$3.00`
   - **Billing period**: `Monthly`
   - **Currency**: `USD`
3. Click **"Save product"**
4. **Copy the Price ID** (starts with `price_`) - you'll need this for `STRIPE_MONTHLY_PRICE_ID`

## Step 2: Get Stripe API Keys

1. Go to Stripe Dashboard → **Developers** → **API keys**
2. Copy your **Publishable key** (starts with `pk_test_` or `pk_live_`)
3. Copy your **Secret key** (starts with `sk_test_` or `sk_live_`)
   - ⚠️ **Important**: Click "Reveal test key" to see it
   - ⚠️ **Never commit secret keys to git!**

## Step 3: Set Up Webhook Endpoint

### For Local Development (Testing)

1. Install Stripe CLI: https://stripe.com/docs/stripe-cli
2. Login: `stripe login`
3. Forward webhooks to local server:
   ```bash
   stripe listen --forward-to localhost:3000/api/webhooks/stripe
   ```
4. Copy the webhook signing secret (starts with `whsec_`) - use this for `STRIPE_WEBHOOK_SECRET` in `.env.local`

### For Production

1. Go to Stripe Dashboard → **Developers** → **Webhooks**
2. Click **"Add endpoint"**
3. Enter endpoint URL: `https://yourdomain.com/api/webhooks/stripe`
4. Select events to listen for:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
5. Click **"Add endpoint"**
6. Copy the **Signing secret** (starts with `whsec_`) - use this for `STRIPE_WEBHOOK_SECRET` in production environment variables

## Step 4: Environment Variables

Add these to your `.env.local` (for development) and Vercel environment variables (for production):

```env
# Stripe API Keys
STRIPE_SECRET_KEY=sk_test_xxxxx  # or sk_live_xxxxx for production
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_xxxxx  # or pk_live_xxxxx for production

# Stripe Webhook Secret
STRIPE_WEBHOOK_SECRET=whsec_xxxxx

# Stripe Price IDs (from Step 1)
STRIPE_FOUNDING_FLOCK_PRICE_ID=price_xxxxx
STRIPE_MONTHLY_PRICE_ID=price_xxxxx

# App URL (for redirects)
NEXT_PUBLIC_APP_URL=http://localhost:3000  # or https://yourdomain.com for production

# Founding Flock Settings
FOUNDING_FLOCK_PRICE_CENTS=2400  # $24.00
FOUNDING_FLOCK_LIMIT=1000
MONTHLY_PRICE_CENTS=300  # $3.00
```

## Step 5: Test the Integration

### Test Cards (Test Mode Only)

Use these test card numbers in Stripe Checkout:

- **Success**: `4242 4242 4242 4242`
- **Decline**: `4000 0000 0000 0002`
- **Requires Authentication**: `4000 0025 0000 3155`
- **Any future expiry date** (e.g., 12/34)
- **Any 3-digit CVC** (e.g., 123)

### Testing Checklist

1. ✅ Test Founding Flock checkout flow
2. ✅ Test Monthly subscription checkout flow
3. ✅ Verify webhook receives events
4. ✅ Check that user premium status updates correctly
5. ✅ Test subscription cancellation
6. ✅ Verify Founding Flock members retain access after cancellation

## Step 6: Switch to Live Mode

When ready for production:

1. **Switch Stripe to Live Mode** in dashboard
2. **Get live API keys** (different from test keys)
3. **Create live products** (same process as Step 1, but in Live Mode)
4. **Set up production webhook** (Step 3)
5. **Update environment variables** in Vercel with live keys
6. **Test with real card** (can refund immediately)

## Troubleshooting

### Webhook Not Receiving Events

- Check webhook endpoint URL is correct
- Verify webhook secret matches
- Check Stripe Dashboard → Webhooks → Events for errors
- Ensure endpoint is publicly accessible (not localhost)

### Checkout Not Working

- Verify price IDs are correct
- Check API keys are set correctly
- Ensure `NEXT_PUBLIC_APP_URL` is set
- Check browser console for errors

### Premium Status Not Updating

- Check webhook is receiving events
- Verify webhook handler is processing events correctly
- Check database for user updates
- Review server logs for errors

## Security Notes

- ⚠️ **Never commit secret keys to git**
- ⚠️ **Use test keys for development**
- ⚠️ **Always verify webhook signatures**
- ⚠️ **Use HTTPS in production**
- ⚠️ **Keep webhook secrets secure**

## Support

If you encounter issues:
1. Check Stripe Dashboard → Logs for API errors
2. Review webhook event logs
3. Check application server logs
4. Refer to Stripe documentation: https://stripe.com/docs


