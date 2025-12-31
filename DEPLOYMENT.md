# Deployment Guide for SongBird

## 🚨 Critical: Don't Share Your Local IP

Sharing your local IP address is **NOT recommended** for production use. Here's why and what to do instead.

## Why Not Local IP?

- ❌ Requires your computer to be on 24/7
- ❌ Security risk (exposes your local network)
- ❌ SQLite can't handle 50+ concurrent users
- ❌ No HTTPS (required for many features)
- ❌ Unreliable (goes down if computer restarts)

## Recommended Deployment Options

### Option 1: Vercel (Recommended - Easiest)

**Pros:**
- Free tier (perfect for 50 users)
- One-click deploy from GitHub
- Automatic HTTPS
- Built-in Next.js optimization
- Global CDN

**Steps:**
1. Push your code to GitHub
2. Go to [vercel.com](https://vercel.com)
3. Import your GitHub repository
4. Add environment variables
5. Deploy!

**Cost:** Free for personal projects

---

### Option 2: Railway

**Pros:**
- Free tier available
- Easy PostgreSQL setup
- Simple deployment
- Good for Next.js apps

**Steps:**
1. Go to [railway.app](https://railway.app)
2. Create new project
3. Add PostgreSQL database
4. Deploy from GitHub
5. Set environment variables

**Cost:** ~$5-10/month after free tier

---

### Option 3: Render

**Pros:**
- Free tier available
- Easy PostgreSQL setup
- Simple deployment

**Steps:**
1. Go to [render.com](https://render.com)
2. Create new Web Service
3. Connect GitHub repository
4. Add PostgreSQL database
5. Set environment variables

**Cost:** Free tier available, then ~$7/month

---

## Database Migration: SQLite → PostgreSQL

**CRITICAL:** You MUST upgrade from SQLite to PostgreSQL for 50+ users.

### Step 1: Create PostgreSQL Database

Choose one:
- **Railway**: Automatic when you create a project
- **Render**: Add PostgreSQL service
- **Supabase**: Free PostgreSQL (recommended for easy setup)
- **Neon**: Free PostgreSQL

### Step 2: Update Prisma Schema

Change `prisma/schema.prisma`:

```prisma
datasource db {
  provider = "postgresql"  // Changed from "sqlite"
  url      = env("DATABASE_URL")
}
```

### Step 3: Update Environment Variables

Your `.env` should have:

```env
# PostgreSQL connection string (from your database provider)
DATABASE_URL="postgresql://user:password@host:5432/dbname?sslmode=require"

# NextAuth
NEXTAUTH_URL=https://your-app.vercel.app  # Your deployed URL
NEXTAUTH_SECRET=your-secret-key-here

# Spotify API
SPOTIPY_CLIENT_ID=your-spotify-client-id
SPOTIPY_CLIENT_SECRET=your-spotify-client-secret
```

### Step 4: Migrate Data

```bash
# Generate Prisma client
npx prisma generate

# Push schema to PostgreSQL
npx prisma db push

# (Optional) Migrate existing SQLite data to PostgreSQL
# You may need a migration script for this
```

---

## Mobile App vs Web App

### Current Status: Web App (Works on Mobile)

Your app already works on mobile browsers! Users can:
- Add to home screen (iOS/Android)
- Use it like an app
- Works offline (with service workers)

### Should You Make a Native App?

**Probably Not Needed:**
- Your web app already works great on mobile
- Native apps require:
  - App Store approval ($99/year for iOS)
  - More development time
  - Separate codebase (React Native)
  - More maintenance

**Consider PWA (Progressive Web App):**
- Add a `manifest.json` file
- Add service worker for offline support
- Users can "Install" it on their phone
- Feels like a native app

---

## Deployment Checklist

### Before Deploying:

- [ ] Upgrade database to PostgreSQL
- [ ] Update `DATABASE_URL` in environment variables
- [ ] Update `NEXTAUTH_URL` to your production URL
- [ ] Generate new `NEXTAUTH_SECRET` (don't use dev secret)
- [ ] Update Spotify redirect URIs in Spotify Developer Dashboard
- [ ] Test locally with production database
- [ ] Run `npm run build` to check for errors

### Environment Variables Needed:

```env
# Database
DATABASE_URL=postgresql://...

# NextAuth
NEXTAUTH_URL=https://your-app.vercel.app
NEXTAUTH_SECRET=generate-new-secret

# Spotify
SPOTIPY_CLIENT_ID=your-client-id
SPOTIPY_CLIENT_SECRET=your-client-secret
```

---

## Quick Start: Deploy to Vercel (15 minutes)

1. **Push to GitHub:**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/yourusername/songbird.git
   git push -u origin main
   ```

2. **Create PostgreSQL Database:**
   - Go to [supabase.com](https://supabase.com) (free)
   - Create new project
   - Copy connection string

3. **Deploy to Vercel:**
   - Go to [vercel.com](https://vercel.com)
   - Sign up with GitHub
   - Click "New Project"
   - Import your repository
   - Add environment variables:
     - `DATABASE_URL` (from Supabase)
     - `NEXTAUTH_URL` (will be auto-filled)
     - `NEXTAUTH_SECRET` (generate: `openssl rand -base64 32`)
     - `SPOTIPY_CLIENT_ID`
     - `SPOTIPY_CLIENT_SECRET`
   - Click "Deploy"

4. **Update Prisma Schema:**
   - Change `provider = "sqlite"` to `provider = "postgresql"`
   - Push to GitHub
   - Vercel will auto-deploy

5. **Run Migration:**
   ```bash
   # In Vercel dashboard, go to your project → Settings → Environment Variables
   # Add DATABASE_URL
   # Then in Vercel Functions or via CLI:
   npx prisma db push
   ```

---

## Testing with 50 Users

Once deployed:
1. Share the Vercel URL (e.g., `https://songbird.vercel.app`)
2. Users can access from any device
3. Monitor performance in Vercel dashboard
4. Check database connection pool settings

---

## Support

If you need help with deployment, check:
- [Vercel Docs](https://vercel.com/docs)
- [Prisma Migration Guide](https://www.prisma.io/docs/guides/migrate-to-prisma)
- [Next.js Deployment](https://nextjs.org/docs/deployment)


