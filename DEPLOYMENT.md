# Deployment Guide for SongBird

## Recommended: Deploy to Vercel

### Why Vercel?
- Free tier (perfect for personal projects)
- One-click deploy from GitHub
- Automatic HTTPS
- Built-in Next.js optimization
- Global CDN

## Prerequisites

Before deploying, ensure you have:
- A PostgreSQL database (Supabase recommended)
- Clerk account with API keys
- Spotify Developer credentials

---

## Step 1: Set Up PostgreSQL Database

### Option A: Supabase (Recommended - Free)
1. Go to [supabase.com](https://supabase.com)
2. Create new project
3. Go to **Settings** → **Database**
4. Copy the **Connection string** (URI format)
5. For Vercel serverless, use the **pooler** connection (port 6543):
   ```
   postgresql://postgres.[ref]:[password]@aws-0-us-east-1.pooler.supabase.com:6543/postgres
   ```

### Option B: Railway
1. Go to [railway.app](https://railway.app)
2. Create new project → Add PostgreSQL
3. Copy the `DATABASE_URL`

### Option C: Neon
1. Go to [neon.tech](https://neon.tech)
2. Create new project
3. Copy the connection string

---

## Step 2: Push to GitHub

```bash
git add .
git commit -m "Ready for deployment"
git push origin main
```

---

## Step 3: Deploy to Vercel

1. Go to [vercel.com](https://vercel.com)
2. Sign up/login with GitHub
3. Click **"New Project"**
4. Import your GitHub repository
5. Vercel will auto-detect Next.js

---

## Step 4: Configure Environment Variables

In Vercel project settings → **Environment Variables**, add:

### Database
```
DATABASE_URL=postgresql://postgres.[ref]:[password]@aws-0-us-east-1.pooler.supabase.com:6543/postgres
```

### Clerk Authentication
```
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/
```

### Spotify API
```
SPOTIPY_CLIENT_ID=your-client-id
SPOTIPY_CLIENT_SECRET=your-client-secret
```

**Important:** Set all variables for **Production**, **Preview**, and **Development** environments.

---

## Step 5: Deploy

Click **"Deploy"** and wait for the build to complete.

Your app will be available at: `https://your-project.vercel.app`

---

## Step 6: Update Clerk Settings

1. Go to your Clerk Dashboard
2. Add your Vercel domain to **Allowed Origins**
3. Update redirect URLs if needed

---

## Post-Deployment Checklist

- [ ] Database connection works
- [ ] Clerk authentication works (sign up/sign in)
- [ ] Spotify search works
- [ ] Can create and view entries
- [ ] Social features work (friends, feed)

---

## Alternative Deployment Options

### Railway
- Easy PostgreSQL setup included
- ~$5-10/month after free tier

### Render
- Free tier available
- Easy PostgreSQL setup
- ~$7/month for paid tier

---

## Troubleshooting

### 500 Error on Sign Up/Login
- Check that Clerk keys are correct
- Verify DATABASE_URL is set
- Check Vercel function logs

### Database Connection Failed
- Use the pooler connection string (port 6543) for serverless
- Verify password is URL-encoded if it contains special characters
- Check SSL mode: add `?sslmode=require` if needed

### Build Fails
- Run `npm run build` locally first
- Check for TypeScript errors
- Verify all dependencies are installed

### Environment Variables Not Working
- Redeploy after adding/changing variables
- Make sure variables are set for Production environment
- Check for typos in variable names

---

## Monitoring

### Vercel Dashboard
- View deployment logs
- Monitor function invocations
- Check error rates

### Database Monitoring
- Supabase dashboard shows query performance
- Monitor connection pool usage

---

## Scaling Considerations

For more than 100 users:
- Consider upgrading Supabase plan
- Enable database connection pooling
- Add caching (Redis) for frequent queries
- Monitor Vercel function limits

---

## Support

- [Vercel Docs](https://vercel.com/docs)
- [Clerk Docs](https://clerk.com/docs)
- [Prisma Docs](https://www.prisma.io/docs)
- [Supabase Docs](https://supabase.com/docs)
