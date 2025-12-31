# 🚀 Quick Deployment for 50 Users Tomorrow

## Step 1: Push to GitHub (5 minutes)

```bash
git add .
git commit -m "Ready for deployment"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/songbird.git
git push -u origin main
```

(Replace `YOUR_USERNAME` with your GitHub username, or create a new repo first)

## Step 2: Deploy to Vercel (10 minutes)

1. Go to [vercel.com](https://vercel.com) and sign up/login with GitHub
2. Click **"New Project"**
3. Import your GitHub repository
4. Vercel will auto-detect Next.js - click **"Deploy"**

## Step 3: Add Environment Variables in Vercel (5 minutes)

After deployment, go to your project → **Settings** → **Environment Variables** and add:

```
DATABASE_URL=postgresql://postgres:D1modadreamo4979@db.undbrbgtjgslmoswqaww.supabase.co:5432/postgres

NEXTAUTH_URL=https://your-app-name.vercel.app
(Replace with your actual Vercel URL - Vercel will show it after deployment)

NEXTAUTH_SECRET=generate-this-with: openssl rand -base64 32

SPOTIPY_CLIENT_ID=e419e60b293c4c13b7c67ab86780c2ef

SPOTIPY_CLIENT_SECRET=your-secret-here
```

## Step 4: Run Database Migration (2 minutes)

After setting environment variables, go to **Deployments** → Click the three dots on latest deployment → **Redeploy**

OR use Vercel CLI:
```bash
npm i -g vercel
vercel login
vercel env pull .env.local
npx prisma db push
```

## Step 5: Update Spotify Redirect URI

1. Go to [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
2. Edit your app settings
3. Add redirect URI: `https://your-app-name.vercel.app/api/auth/callback/spotify`

## ✅ Your URL Will Be:
`https://your-app-name.vercel.app`

Share this with your 50 test users!

---

## ⚠️ Important Notes:

- **Database**: You're already using PostgreSQL (good!)
- **Data Migration**: If you have data in SQLite (`prisma/dev.db`), you'll need to migrate it. Run:
  ```bash
  npm run migrate:data
  ```
- **NEXTAUTH_SECRET**: Generate a new one for production (don't use your dev secret)
- **Free Tier**: Vercel free tier handles 50 users easily

## 🆘 If Something Goes Wrong:

1. Check Vercel deployment logs
2. Verify all environment variables are set
3. Make sure `DATABASE_URL` is correct
4. Check that Prisma schema has `provider = "postgresql"`

