# Quick Test: Is Your Database Actually Reachable?

Let's verify the connection string works. The pooler URL should have:
- Port **6543** (not 5432)
- Domain ending in **pooler.supabase.com** (not just supabase.co)

## Your Current Connection String Should Be:

```
postgresql://postgres.undbrbgtjgslmoswqaww:D1modadreamo4979@aws-0-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true
```

**Key differences from direct connection:**
- `postgres.undbrbgtjgslmoswqaww` (with dot after postgres)
- `pooler.supabase.com` (not `db.undbrbgtjgslmoswqaww.supabase.co`)
- Port `6543` (not `5432`)
- `?pgbouncer=true` at the end

## If Supabase Shows the Same String:

Sometimes Supabase's UI shows the same format. Try this:

1. **Check the port number** - it MUST be 6543 for pooler
2. **Check the domain** - it should say `pooler.supabase.com`
3. **If it's still port 5432**, manually change it to 6543 and add `?pgbouncer=true`

## Alternative: Try Transaction Mode Pooler

If Session mode doesn't work, try Transaction mode. The connection string format is the same but use Transaction mode instead.

## Last Resort: Check Vercel Logs

1. Go to Vercel Dashboard
2. Click on your project
3. Go to **Functions** tab
4. Click on a failed function (like `/api/auth/signup`)
5. Check the **Logs** tab
6. Look for the actual error message

This will tell us exactly what's failing.

