# Fix Database Connection for Vercel

## The Problem
Vercel is a serverless platform. Each API route runs in a separate function, and Prisma can have connection issues with PostgreSQL in serverless environments.

## The Solution: Use Supabase Connection Pooler

Supabase provides a connection pooler that works better with serverless. You need to use a different connection string.

### Option 1: Use Supabase Pooler (Recommended)

In Vercel, change your `DATABASE_URL` to use the pooler:

```
postgresql://postgres.undbrbgtjgslmoswqaww:D1modadreamo4979@aws-0-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true
```

**Note:** Replace `undbrbgtjgslmoswqaww` with your actual Supabase project reference if different.

### Option 2: Use Direct Connection with Connection Limit

If the pooler doesn't work, use the direct connection but add connection limits:

```
postgresql://postgres:D1modadreamo4979@db.undbrbgtjgslmoswqaww.supabase.co:5432/postgres?connection_limit=1
```

## How to Find Your Supabase Pooler URL

1. Go to your Supabase project dashboard
2. Go to **Settings** → **Database**
3. Scroll down to **Connection Pooling**
4. Copy the **Connection string** (use the **Session mode** or **Transaction mode** one)
5. It should look like: `postgresql://postgres.[ref]:[password]@aws-0-us-east-1.pooler.supabase.com:6543/postgres`

## Steps to Fix

1. **Get your Supabase pooler URL** (see above)
2. **Update Vercel environment variable:**
   - Go to Vercel → Settings → Environment Variables
   - Update `DATABASE_URL` with the pooler URL
   - Make sure it's set for Production, Preview, and Development
3. **Redeploy** your project

## Alternative: Check Supabase Dashboard

If you can't find the pooler URL:
1. Go to Supabase Dashboard
2. Click on your project
3. Go to **Settings** → **Database**
4. Look for **Connection string** section
5. There should be options for "Direct connection" and "Connection pooling"
6. Use the connection pooling one



