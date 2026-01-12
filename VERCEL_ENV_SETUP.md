# Vercel Environment Variables Setup

## Required Environment Variables

You MUST set these in Vercel for the app to work:

1. **Go to Vercel Dashboard** → Your Project → **Settings** → **Environment Variables**

2. **Add these variables:**

### Database
```
DATABASE_URL=postgresql://postgres:D1modadreamo4979@db.undbrbgtjgslmoswqaww.supabase.co:5432/postgres
```

### NextAuth (CRITICAL!)
```
NEXTAUTH_URL=https://songbiiird.vercel.app
NEXTAUTH_SECRET=<generate a new secret>
```

To generate NEXTAUTH_SECRET, run:
```bash
openssl rand -base64 32
```

Or use this online tool: https://generate-secret.vercel.app/32

### Spotify API (if you have them)
```
SPOTIPY_CLIENT_ID=your-client-id
SPOTIPY_CLIENT_SECRET=your-client-secret
```

3. **Make sure to:**
   - Set each variable for **Production**, **Preview**, and **Development**
   - Click **Save** after adding each one
   - **Redeploy** your project after adding variables

4. **After setting variables, redeploy:**
   - Go to **Deployments** tab
   - Click the **three dots** (⋯) on the latest deployment
   - Click **Redeploy**

## Common Issues

### 500 Error on Signup/Login
- Check that `DATABASE_URL` is set correctly
- Make sure there are no extra spaces or quotes
- Verify the database is accessible

### 401 Unauthorized
- Check that `NEXTAUTH_SECRET` is set
- Make sure `NEXTAUTH_URL` matches your actual domain
- Clear browser cookies and try again

### Database Connection Failed
- Verify `DATABASE_URL` format is correct
- Check that Supabase database is running
- Make sure SSL mode is included: `?sslmode=require` (if needed)



