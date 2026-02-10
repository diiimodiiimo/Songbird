# Grant Founding Flock Access - Quick Guide

Since the project uses Supabase, the easiest way is to run the SQL migration directly.

## Option 1: Run SQL in Supabase Dashboard (Easiest)

1. Go to your Supabase Dashboard
2. Navigate to **SQL Editor**
3. Copy and paste the SQL from `migrations/grant-founding-flock-to-existing-users.sql`
4. Click **Run**

## Option 2: Use psql command line

```bash
psql "your-database-connection-string" -f migrations/grant-founding-flock-to-existing-users.sql
```

## Option 3: Use the API endpoint

If your dev server is running:

```bash
curl -X POST http://localhost:3000/api/admin/grant-founding-flock
```

The SQL migration will:
- Update all users to have `isPremium = true`
- Set `isFoundingMember = true`
- Set `subscriptionTier = 'founding_flock_yearly'`
- Set `premiumSince` to current date if not already set

After running, all 38 existing users will have Founding Flock access!


