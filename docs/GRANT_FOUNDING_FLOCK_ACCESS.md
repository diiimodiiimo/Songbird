# Grant Founding Flock Access to Existing Users

This guide explains how to grant Founding Flock (premium) access to all existing users in your database.

## What This Does

- Sets `isPremium = true` for all existing users
- Sets `isFoundingMember = true` for all existing users  
- Sets `subscriptionTier = 'founding_flock_yearly'`
- Sets `premiumSince` to current date (if not already set)

## Option 1: SQL Migration (Recommended)

If you have direct database access:

1. **Run the SQL migration:**
   ```bash
   # Connect to your database and run:
   psql $DATABASE_URL -f migrations/grant-founding-flock-to-existing-users.sql
   ```

   Or copy/paste the SQL from `migrations/grant-founding-flock-to-existing-users.sql` into your database client.

## Option 2: Node.js Script

Run the script directly:

```bash
# Make sure you have tsx installed
npm install -g tsx

# Run the script
npx tsx scripts/grant-founding-flock-access.ts
```

The script will:
- Show how many users need updating
- Update them in batches
- Show progress
- Verify the update completed successfully

## Option 3: API Endpoint (One-time)

Call the API endpoint once:

```bash
# Make a POST request to the endpoint
curl -X POST http://localhost:3000/api/admin/grant-founding-flock
```

**⚠️ Security Note:** The API endpoint is currently unprotected. After running it, you should either:
- Remove the endpoint file
- Add authentication/authorization checks
- Add a one-time token system

## Verification

After running any of the above methods, verify the update:

```sql
-- Check how many users have Founding Flock access
SELECT 
  COUNT(*) as total_users,
  COUNT(*) FILTER (WHERE "isPremium" = true) as premium_users,
  COUNT(*) FILTER (WHERE "isFoundingMember" = true) as founding_members
FROM users;
```

All existing users should now have:
- ✅ `isPremium = true`
- ✅ `isFoundingMember = true`
- ✅ `subscriptionTier = 'founding_flock_yearly'`

## What Happens Next

After running this migration:
- All existing users will have full premium access
- They'll see "Founding Flock" status in their settings
- They'll have access to all premium features
- All bird themes will be unlocked for them
- New users will still need to purchase premium (unless they join via waitlist)

## Notes

- This only affects **existing users** (those already in the database)
- New users created after this migration will still need to purchase premium
- The migration is idempotent - safe to run multiple times
- Users who already have premium will be updated to have `isFoundingMember = true`


