# Add Premium Columns Migration

The database needs the premium columns added before we can grant Founding Flock access.

## Run this migration first:

1. **Go to Supabase Dashboard** → **SQL Editor**
2. **Copy and paste** the SQL from `migrations/add-premium-columns.sql`:

```sql
-- Add premium columns if they don't exist
ALTER TABLE users ADD COLUMN IF NOT EXISTS "isPremium" BOOLEAN DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS "isFoundingMember" BOOLEAN DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS "premiumSince" TIMESTAMP;
ALTER TABLE users ADD COLUMN IF NOT EXISTS "stripeCustomerId" TEXT UNIQUE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS "subscriptionTier" TEXT;

-- Create indexes
CREATE INDEX IF NOT EXISTS "users_isPremium_idx" ON "users"("isPremium");
CREATE INDEX IF NOT EXISTS "users_isFoundingMember_idx" ON "users"("isFoundingMember");
CREATE INDEX IF NOT EXISTS "users_stripeCustomerId_idx" ON "users"("stripeCustomerId");
```

3. **Click Run**

## Then run the grant script:

```bash
npm run grant:founding-flock
```

This will update all existing users to have Founding Flock access!


