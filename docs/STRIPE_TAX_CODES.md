# Stripe Tax Codes Guide for SongBird

## Recommended Tax Codes

For SongBird's subscription products, use these tax codes:

### For Both Products (Founding Flock & Monthly)

**Tax Code**: `txcd_10000000` - **Digital Products**

This is Stripe's standard tax code for:
- Digital subscriptions
- Software as a Service (SaaS)
- Online services
- Digital content subscriptions

### Alternative Options

If `txcd_10000000` doesn't work, try:

1. **`txcd_10301000`** - **Software as a Service (SaaS)**
   - Best for subscription software services
   - Most accurate for SongBird

2. **`txcd_10000000`** - **Digital Products**
   - General digital goods/services
   - Good fallback option

3. **`txcd_10301000`** - **Information Services**
   - For data/analytics services
   - If you emphasize the analytics features

## How to Add Tax Codes in Stripe

### Option 1: When Creating Product

1. Go to **Products** → **Add product**
2. Fill in product details
3. In the **Tax** section:
   - Check **"Enable tax collection"**
   - Select **"Use standard tax codes"**
   - Choose: **`txcd_10301000` (Software as a Service)**

### Option 2: Edit Existing Product

1. Go to **Products** → Click your product
2. Scroll to **Tax** section
3. Click **"Edit"**
4. Enable **"Tax collection"**
5. Select tax code: **`txcd_10301000`**

## Recommended Settings

### For Founding Flock Product:
- **Tax Code**: `txcd_10301000` (Software as a Service)
- **Enable Tax Collection**: Yes
- **Tax Behavior**: `exclusive` (tax added on top of price)

### For Monthly Subscription Product:
- **Tax Code**: `txcd_10301000` (Software as a Service)
- **Enable Tax Collection**: Yes
- **Tax Behavior**: `exclusive` (tax added on top of price)

## Important Notes

### Tax Collection Requirements

**You may need to collect tax if:**
- You have nexus in certain states/countries
- Your revenue exceeds thresholds (varies by location)
- You're selling to customers in jurisdictions that require tax

**For most small SaaS apps:**
- You can start without tax collection
- Add it later when you reach thresholds
- Stripe Tax can handle this automatically

### Stripe Tax (Recommended)

If you want Stripe to handle tax automatically:

1. Go to **Settings** → **Tax**
2. Enable **Stripe Tax**
3. Stripe will:
   - Automatically determine tax rates
   - Collect and remit taxes
   - Handle tax reporting

### Tax Behavior Options

- **`exclusive`**: Tax is added on top of the price
  - Example: $24 + tax = $24 + $2.40 = $26.40
  - **Recommended** for subscriptions

- **`inclusive`**: Tax is included in the price
  - Example: $24 includes tax
  - Less common for subscriptions

## Quick Setup

**Simplest approach:**

1. **Enable Stripe Tax** (Settings → Tax)
2. **Don't manually set tax codes** - Stripe Tax handles it
3. **Stripe will automatically**:
   - Determine correct tax codes
   - Calculate tax rates
   - Collect and remit taxes

## If You're Not Sure

**Start without tax codes:**
- You can add them later
- Stripe Tax can be enabled anytime
- Most small apps don't need tax collection initially

**When you're ready:**
- Enable Stripe Tax in dashboard
- It will automatically handle everything
- No need to manually set tax codes

## Summary

**Recommended**: 
- Use **`txcd_10301000`** (Software as a Service) for both products
- OR enable **Stripe Tax** and let it handle everything automatically

**For now**: You can skip tax codes if you're just testing. Add them when you're ready to go live.



