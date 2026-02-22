# App Store Readiness - Next Steps Guide

This guide walks you through completing the setup for all the new features we just implemented.

---

## Step 1: Run Database Migrations

We need to add two new fields to your database:
1. **Notification preferences** to the `users` table
2. **Mood field** to the `entries` table

### Option A: Using Supabase SQL Editor (Recommended)

1. **Go to your Supabase Dashboard**
   - Navigate to [supabase.com](https://supabase.com)
   - Sign in and select your project

2. **Open SQL Editor**
   - Click on **"SQL Editor"** in the left sidebar
   - Click **"New query"**

3. **Run First Migration - Notification Preferences**
   - Copy the entire contents of `migrations/add-notification-preferences.sql`
   - Paste it into the SQL editor
   - Click **"Run"** (or press Ctrl+Enter)
   - You should see: "Success. No rows returned"

4. **Run Second Migration - Mood Field**
   - Copy the entire contents of `migrations/add-mood-field.sql`
   - Paste it into a new query
   - Click **"Run"**
   - You should see: "Success. No rows returned"

5. **Verify the migrations worked**
   - Go to **"Table Editor"** in the left sidebar
   - Click on the `users` table
   - Scroll down - you should see new columns like `notificationsEnabled`, `reminderTime`, etc.
   - Click on the `entries` table
   - You should see a `mood` column

### Option B: Using Prisma Migrate (Alternative)

If you prefer using Prisma migrations:

```bash
# Create a new migration
npx prisma migrate dev --name add_notification_preferences_and_mood

# This will prompt you to apply the migration - type 'y' and press Enter
```

**Note:** Prisma migrate will detect the schema changes and create the migration automatically.

---

## Step 2: Update Prisma Client

After the database migrations, update your Prisma client to match the new schema:

```bash
# Generate the Prisma client with new types
npx prisma generate

# Push schema changes (if using db push instead of migrations)
npx prisma db push
```

**What this does:**
- Regenerates the Prisma client with TypeScript types for the new fields
- Your code will now recognize `mood` on entries and notification preferences on users

---

## Step 3: Set Up Stripe (Required for Premium Features)

Stripe is now fully integrated. You need to set up your Stripe account and get the necessary keys.

### 3.1 Create Stripe Account

1. **Sign up for Stripe**
   - Go to [stripe.com](https://stripe.com)
   - Click **"Start now"** and create an account
   - Complete the account setup (you can use test mode for development)

2. **Get Your API Keys**
   - In Stripe Dashboard, go to **"Developers"** → **"API keys"**
   - Copy your **"Secret key"** (starts with `sk_test_` for test mode)
   - Copy your **"Publishable key"** (starts with `pk_test_` for test mode)
   - **Note:** We only need the secret key for the backend

### 3.2 Create a Product and Price

1. **Create Founding Flock Product**
   - In Stripe Dashboard, go to **"Products"** → **"Add product"**
   - Name: `Founding Flock`
   - Description: `Annual subscription for SongBird premium features`
   - Pricing model: **Recurring**
   - Price: `$24.00` (or your preferred price)
   - Billing period: **Yearly**
   - Click **"Save product"**

2. **Copy the Price ID**
   - After creating the product, you'll see a **Price ID** (starts with `price_`)
   - Copy this Price ID - you'll need it for the environment variable

### 3.3 Set Up Webhook Endpoint

1. **Create Webhook Endpoint**
   - In Stripe Dashboard, go to **"Developers"** → **"Webhooks"**
   - Click **"Add endpoint"**
   - Endpoint URL: `https://your-domain.com/api/webhooks/stripe`
     - For local testing: Use [ngrok](https://ngrok.com) or Stripe CLI
     - For production: Use your Vercel deployment URL
   - Select events to listen to:
     - `checkout.session.completed`
     - `customer.subscription.created`
     - `customer.subscription.updated`
     - `customer.subscription.deleted`
     - `invoice.payment_succeeded`
     - `invoice.payment_failed`
   - Click **"Add endpoint"**

2. **Get Webhook Signing Secret**
   - After creating the endpoint, click on it
   - Copy the **"Signing secret"** (starts with `whsec_`)
   - This is your `STRIPE_WEBHOOK_SECRET`

### 3.4 Local Testing with Stripe CLI (Optional but Recommended)

For local development, use Stripe CLI to forward webhooks:

```bash
# Install Stripe CLI (if not installed)
# macOS: brew install stripe/stripe-cli/stripe
# Windows: Download from https://stripe.com/docs/stripe-cli

# Login to Stripe
stripe login

# Forward webhooks to local server
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

This will give you a webhook signing secret that starts with `whsec_` - use this for local development.

---

## Step 4: Update Environment Variables

Add the new environment variables to your `.env.local` file (and Vercel for production).

### 4.1 Local Development (.env.local)

Open or create `.env.local` in your project root and add:

```env
# Existing variables (keep these)
DATABASE_URL="postgresql://postgres:[PASSWORD]@db.[REF].supabase.co:5432/postgres"
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
SPOTIPY_CLIENT_ID=your-spotify-client-id
SPOTIPY_CLIENT_SECRET=your-spotify-client-secret

# NEW: Stripe Configuration
STRIPE_SECRET_KEY=sk_test_...                    # From Stripe Dashboard → API Keys
STRIPE_FOUNDING_FLOCK_PRICE_ID=price_...         # From Stripe Dashboard → Products
STRIPE_WEBHOOK_SECRET=whsec_...                  # From Stripe Dashboard → Webhooks

# NEW: Optional - Cron Secret (for push reminders)
# Generate a random string: openssl rand -hex 32
CRON_SECRET=your-random-secret-string-here

# NEW: Optional - App URL (auto-detected on Vercel)
NEXT_PUBLIC_APP_URL=http://localhost:3000        # For local dev
```

### 4.2 Production (Vercel)

1. **Go to Vercel Dashboard**
   - Navigate to your project
   - Click **"Settings"** → **"Environment Variables"**

2. **Add New Variables**
   - Click **"Add New"** for each variable:
     - `STRIPE_SECRET_KEY` = `sk_live_...` (use live key for production)
     - `STRIPE_FOUNDING_FLOCK_PRICE_ID` = `price_...`
     - `STRIPE_WEBHOOK_SECRET` = `whsec_...` (from production webhook endpoint)
     - `CRON_SECRET` = (generate a random secret)
     - `NEXT_PUBLIC_APP_URL` = `https://your-domain.vercel.app`

3. **Redeploy**
   - After adding variables, go to **"Deployments"**
   - Click the **"..."** menu on the latest deployment
   - Click **"Redeploy"** to apply the new environment variables

---

## Step 5: Test Everything

After completing the above steps, test each feature:

### 5.1 Test Notification Preferences

1. **Start your dev server:**
   ```bash
   npm run dev
   ```

2. **Navigate to Profile Tab**
   - Sign in to your app
   - Go to the Profile tab
   - Scroll down to **"Notification Settings"**
   - Click to expand it
   - Toggle some preferences on/off
   - Verify changes save (check browser console for errors)

### 5.2 Test Mood Tracking

1. **Add a new entry**
   - Go to the "Add Entry" tab
   - Search for a song and select it
   - Click **"Add mood"** and select an emoji
   - Save the entry
   - Verify the mood appears after saving

2. **Check database**
   - Go to Supabase → Table Editor → `entries`
   - Find your new entry
   - Verify the `mood` column has the emoji you selected

### 5.3 Test Stripe Checkout (Test Mode)

1. **Try to purchase Founding Flock**
   - Navigate to where the checkout button is (if you have one in UI)
   - Or make a test API call:
     ```bash
     curl -X POST http://localhost:3000/api/checkout/founding-flock \
       -H "Cookie: your-auth-cookie"
     ```
   - Should redirect to Stripe checkout page

2. **Use Stripe Test Card**
   - Card number: `4242 4242 4242 4242`
   - Expiry: Any future date
   - CVC: Any 3 digits
   - Complete the checkout

3. **Verify Webhook**
   - Check Stripe Dashboard → **"Developers"** → **"Webhooks"** → **"Events"**
   - You should see `checkout.session.completed` event
   - Check your database - user should have `isPremium: true` and `isFoundingMember: true`

### 5.4 Test Rate Limiting

1. **Make rapid API calls**
   ```bash
   # Test search endpoint (20 requests/minute limit)
   for i in {1..25}; do
     curl http://localhost:3000/api/songs/search?q=test
   done
   ```
   - After 20 requests, you should get a `429 Too Many Requests` response
   - Response headers should include `X-RateLimit-Remaining` and `X-RateLimit-Reset`

### 5.5 Test Spotify Attribution

1. **Check all song displays**
   - Navigate through different tabs (Today, Memory, History, Wrapped)
   - Verify you see "Powered by Spotify" attribution on all song displays
   - Should appear as a small text link or badge

---

## Step 6: Verify Database Schema

Double-check that all fields were added correctly:

### Check Users Table
```sql
-- Run in Supabase SQL Editor
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'users'
AND column_name IN (
  'notificationsEnabled',
  'pushNotificationsEnabled',
  'reminderTime',
  'reminderEnabled',
  'notifyOnVibe',
  'notifyOnComment',
  'notifyOnMention',
  'notifyOnFriendRequest',
  'notifyOnFriendAccepted',
  'notifyOnThisDay'
);
```

### Check Entries Table
```sql
-- Run in Supabase SQL Editor
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'entries'
AND column_name = 'mood';
```

---

## Troubleshooting

### Migration Errors

**Problem:** "column already exists" error
- **Solution:** The column might already exist. Check the table structure first, or use `IF NOT EXISTS` (which we already included)

**Problem:** Prisma client out of sync
- **Solution:** Run `npx prisma generate` again

### Stripe Errors

**Problem:** "Stripe not configured" error
- **Solution:** Check that `STRIPE_SECRET_KEY` is set in `.env.local` and restart dev server

**Problem:** Webhook not receiving events
- **Solution:** 
  - For local: Use Stripe CLI (`stripe listen --forward-to localhost:3000/api/webhooks/stripe`)
  - For production: Verify webhook URL is correct and endpoint is active in Stripe Dashboard

### Notification Preferences Not Saving

**Problem:** Preferences don't persist
- **Solution:** 
  - Check browser console for API errors
  - Verify database columns exist (run Step 6 verification)
  - Check that Prisma client was regenerated

### Mood Not Saving

**Problem:** Mood emoji doesn't appear after saving
- **Solution:**
  - Check browser console for errors
  - Verify `mood` column exists in `entries` table
  - Check API response - should include `mood` field

---

## Summary Checklist

- [ ] Database migrations run successfully
- [ ] Prisma client regenerated (`npx prisma generate`)
- [ ] Stripe account created and configured
- [ ] Stripe product and price created
- [ ] Stripe webhook endpoint configured
- [ ] Environment variables added to `.env.local`
- [ ] Environment variables added to Vercel (for production)
- [ ] Notification preferences UI tested
- [ ] Mood tracking tested
- [ ] Stripe checkout tested (test mode)
- [ ] Rate limiting tested
- [ ] Spotify attribution visible on all song displays

Once all items are checked, your app is ready for App Store submission! 🎉




