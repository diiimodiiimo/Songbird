# Stripe Testing Guide

This guide will help you test the Stripe integration step by step.

## Prerequisites

1. ✅ Stripe account created
2. ✅ Products created in Stripe Dashboard
3. ✅ API keys added to `.env.local`
4. ✅ Webhook endpoint configured (for local testing)

## Step 1: Verify Stripe Configuration

First, let's check if Stripe is properly configured:

1. **Start your dev server**:
   ```bash
   npm run dev
   ```

2. **Check Stripe configuration endpoint**:
   - Visit: `http://localhost:3000/api/checkout/founding-flock` (GET request)
   - Should return: `{"message":"Founding Flock checkout endpoint","configured":true}`

3. **Check environment variables**:
   - Make sure these are in `.env.local`:
     ```env
     STRIPE_SECRET_KEY=sk_test_xxxxx
     NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_xxxxx
     STRIPE_WEBHOOK_SECRET=whsec_xxxxx
     STRIPE_FOUNDING_FLOCK_PRICE_ID=price_xxxxx
     STRIPE_MONTHLY_PRICE_ID=price_xxxxx
     NEXT_PUBLIC_APP_URL=http://localhost:3000
     ```

## Step 2: Set Up Webhook Testing (Local)

For local testing, you need Stripe CLI to forward webhooks:

1. **Install Stripe CLI** (if not installed):
   - Windows: Download from https://github.com/stripe/stripe-cli/releases
   - Mac: `brew install stripe/stripe-cli/stripe`
   - Or use: `npm install -g stripe-cli`

2. **Login to Stripe CLI**:
   ```bash
   stripe login
   ```

3. **Forward webhooks to local server**:
   ```bash
   stripe listen --forward-to localhost:3000/api/webhooks/stripe
   ```

4. **Copy the webhook signing secret** (starts with `whsec_`)
   - Add it to `.env.local` as `STRIPE_WEBHOOK_SECRET`
   - Restart your dev server

## Step 3: Test Checkout Flow

### Test 1: Founding Flock Checkout

1. **Sign in to your app** (or create a test account)

2. **Navigate to Premium page**:
   - Go to: `http://localhost:3000/settings/premium`

3. **Click "Claim Founding Flock"** button

4. **You should be redirected to Stripe Checkout**

5. **Use test card**:
   - Card number: `4242 4242 4242 4242`
   - Expiry: Any future date (e.g., `12/34`)
   - CVC: Any 3 digits (e.g., `123`)
   - ZIP: Any 5 digits (e.g., `12345`)

6. **Complete checkout**

7. **Verify**:
   - ✅ Redirected back to app with success message
   - ✅ User premium status updated in database
   - ✅ Webhook received (check Stripe CLI output)
   - ✅ User sees "You're a Founding Flock member!" message

### Test 2: Monthly Subscription Checkout

1. **Sign in with a different test account** (or use incognito)

2. **Navigate to Premium page**

3. **Click "Subscribe Monthly"** button

4. **Complete checkout with test card**

5. **Verify**:
   - ✅ Redirected back to app
   - ✅ User premium status updated
   - ✅ Webhook received
   - ✅ User sees "You have premium access" message

## Step 4: Test Webhook Events

Watch the Stripe CLI output for webhook events. You should see:

```
--> checkout.session.completed [200]
--> customer.subscription.created [200]
--> invoice.payment_succeeded [200]
```

### Check Webhook Processing

1. **Check server logs** for:
   ```
   [stripe/webhook] Received event: checkout.session.completed
   [stripe/webhook] User [userId] upgraded to Founding Flock
   ```

2. **Verify database**:
   - Check `users` table for:
     - `isPremium = true`
     - `isFoundingMember = true` (for Founding Flock)
     - `subscriptionTier = 'founding_flock'` or `'monthly'`
     - `stripeCustomerId` populated

## Step 5: Test Edge Cases

### Test 3: Cancellation Flow

1. **Go to Stripe Dashboard** → Customers
2. **Find your test customer**
3. **Cancel the subscription**
4. **Verify**:
   - ✅ Webhook received: `customer.subscription.deleted`
   - ✅ Founding Flock members retain premium access
   - ✅ Monthly subscribers lose premium access

### Test 4: Payment Failure

1. **Use test card that declines**: `4000 0000 0000 0002`
2. **Verify**:
   - ✅ Checkout shows error
   - ✅ User not upgraded
   - ✅ Webhook received: `invoice.payment_failed`

### Test 5: Founding Flock Limit

1. **Manually set founding member count to 1000** (in database)
2. **Try to purchase Founding Flock**
3. **Verify**:
   - ✅ Error message: "Founding Flock slots are full"
   - ✅ Monthly option still available

## Step 6: Verify Premium Features

After successful checkout, verify premium features work:

1. **Check premium status API**:
   - Visit: `http://localhost:3000/api/user/subscription`
   - Should return premium status

2. **Test premium features**:
   - Unlimited entries (if implemented)
   - Full history access
   - All bird themes unlocked

## Troubleshooting

### Issue: "Stripe not configured" error

**Solution**:
- Check `STRIPE_SECRET_KEY` is set in `.env.local`
- Restart dev server after adding env vars
- Verify key starts with `sk_test_` or `sk_live_`

### Issue: "Price ID not configured" error

**Solution**:
- Verify `STRIPE_FOUNDING_FLOCK_PRICE_ID` and `STRIPE_MONTHLY_PRICE_ID` are set
- Check price IDs start with `price_`
- Ensure products exist in Stripe Dashboard

### Issue: Webhook not receiving events

**Solution**:
- Verify Stripe CLI is running: `stripe listen --forward-to localhost:3000/api/webhooks/stripe`
- Check webhook secret matches `.env.local`
- Verify endpoint URL is correct
- Check server logs for webhook errors

### Issue: User not upgraded after payment

**Solution**:
- Check webhook is receiving events (Stripe CLI output)
- Verify webhook handler is processing events (server logs)
- Check database for user updates
- Verify `userId` in webhook metadata matches database user

### Issue: Redirect URL incorrect

**Solution**:
- Verify `NEXT_PUBLIC_APP_URL=http://localhost:3000` in `.env.local`
- Check success/cancel URLs in checkout session creation

## Test Checklist

- [ ] Stripe API keys configured
- [ ] Price IDs configured
- [ ] Webhook endpoint set up
- [ ] Founding Flock checkout works
- [ ] Monthly checkout works
- [ ] Webhook receives events
- [ ] User premium status updates
- [ ] Founding Flock members retain access after cancellation
- [ ] Monthly subscribers lose access after cancellation
- [ ] Payment failures handled correctly
- [ ] Founding Flock limit enforced

## Next Steps

Once testing is complete:

1. ✅ Test with real card (can refund immediately)
2. ✅ Set up production webhook endpoint
3. ✅ Switch to live Stripe keys
4. ✅ Test production flow end-to-end



