# Quick Fix Guide - Stripe Price IDs

## Issue Found

You're using a **Product ID** (`prod_TrH1sFuViJmbA5`) instead of a **Price ID** (`price_xxxxx`).

## How to Fix

### Step 1: Get the Correct Price ID for Founding Flock

1. Go to Stripe Dashboard → **Products**
2. Click on your "SongBird Founding Flock" product
3. Look for the **Pricing** section
4. You'll see a **Price ID** (starts with `price_`) - this is what you need!
5. Copy that Price ID

### Step 2: Create Monthly Subscription Product

1. Go to Stripe Dashboard → **Products**
2. Click **"Add product"**
3. Fill in:
   - **Name**: `SongBird Premium Monthly`
   - **Description**: `Monthly premium subscription`
   - **Pricing model**: `Recurring`
   - **Price**: `$3.00`
   - **Billing period**: `Monthly`
   - **Currency**: `USD`
4. Click **"Save product"**
5. Copy the **Price ID** (starts with `price_`)

### Step 3: Update .env.local

Add/update these in your `.env.local` file:

```env
# Replace with your actual Price IDs (they start with price_, not prod_)
STRIPE_FOUNDING_FLOCK_PRICE_ID=price_xxxxx  # Replace xxxxx with your actual price ID
STRIPE_MONTHLY_PRICE_ID=price_xxxxx  # Replace xxxxx with your monthly price ID
```

### Step 4: Restart Dev Server

After updating `.env.local`, restart your dev server:
```bash
# Stop the server (Ctrl+C) and restart
npm run dev
```

### Step 5: Test Again

Visit: `http://localhost:3000/api/test/stripe`

You should see:
- ✅ `allChecksPassed: true`
- ✅ `status: "READY"`
- ✅ No errors

## Visual Guide: Finding Price ID

In Stripe Dashboard:
```
Product: SongBird Founding Flock
├── Product ID: prod_TrH1sFuViJmbA5  ← This is what you have (wrong)
└── Pricing:
    └── Price ID: price_xxxxxxxxxxxxx  ← This is what you need!
```

## Still Having Issues?

If you can't find the Price ID:
1. The product might not have a price yet
2. Go to the product → Click "Add price" or edit existing price
3. Make sure it's set to "Recurring" → "Yearly" → "$24.00"
4. Save and copy the Price ID



