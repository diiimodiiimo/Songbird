# Fix Vercel Auth - Quick Steps

## The Problem
401 errors on login means NextAuth can't authenticate. This is usually:
1. Missing NEXTAUTH_SECRET
2. Wrong NEXTAUTH_URL
3. Database connection issues

## Fix It Now:

### 1. Check Vercel Environment Variables

Go to Vercel → Settings → Environment Variables and make sure you have:

**REQUIRED:**
```
DATABASE_URL=postgresql://postgres.undbrbgtjgslmoswqaww:D1modadreamo4979@aws-0-us-east-1.pooler.supabase.com:6543/postgres

NEXTAUTH_URL=https://songbiiird.vercel.app

NEXTAUTH_SECRET=tOe/HVIY2ViDgs+QKvUxsLVknrjcrMJxR3qn4K9gZH0=
```

**OPTIONAL (for migrations only):**
```
DIRECT_URL=postgresql://postgres:D1modadreamo4979@db.undbrbgtjgslmoswqaww.supabase.co:5432/postgres
```

### 2. Make Sure All Are Set For:
- ✅ Production
- ✅ Preview  
- ✅ Development

### 3. Redeploy

After setting variables, go to Deployments → Click three dots → Redeploy

### 4. Test Login

Go to https://songbiiird.vercel.app/auth/signin

**Credentials:**
- Email: dimotesi44@gmail.com
- Password: password123

## If Still Not Working:

Check Vercel Function Logs for the exact error. The 401 usually means:
- NEXTAUTH_SECRET is missing/wrong
- NEXTAUTH_URL doesn't match your domain

