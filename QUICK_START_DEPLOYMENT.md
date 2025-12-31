# 🚀 Quick Start: Deploy SongBird for 50 Users

## Step-by-Step Guide (15-20 minutes)

### Step 1: Create PostgreSQL Database (5 min)

**👉 See `HOW_TO_GET_DATABASE_URL.md` for detailed screenshots and step-by-step instructions!**

**Option A: Supabase (Recommended - Easiest)**
1. Go to [supabase.com](https://supabase.com) → Sign up (free)
2. Click "New Project"
3. Fill in:
   - Name: `songbird-db`
   - Database Password: (save this!)
   - Region: Choose closest to you
4. Wait ~2 minutes for database to create
5. Go to **Settings** → **Database**
6. Find **Connection string** → **URI** tab
7. Copy the connection string (looks like: `postgresql://postgres:[YOUR-PASSWORD]@db.xxx.supabase.co:5432/postgres`)
8. **IMPORTANT:** Replace `[YOUR-PASSWORD]` with the actual password you created in step 3!

**Option B: Railway**
1. Go to [railway.app](https://railway.app) → Sign up
2. New Project → Add PostgreSQL
3. Copy the `DATABASE_URL` from the service

---

### Step 2: Update Your Code (2 min)

✅ **Already done!** The Prisma schema has been updated to PostgreSQL.

---

### Step 3: Set Up Environment Variables (3 min)

Update your `.env` file:

```env
# PostgreSQL (from Step 1)
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@db.xxx.supabase.co:5432/postgres?sslmode=require"

# NextAuth (generate a new secret)
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-new-secret-here

# Spotify API (keep your existing ones)
SPOTIPY_CLIENT_ID=your-client-id
SPOTIPY_CLIENT_SECRET=your-client-secret
```

**Generate NEXTAUTH_SECRET:**
```bash
# Windows PowerShell:
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Minimum 0 -Maximum 256 }))

# Mac/Linux:
openssl rand -base64 32
```

---

### Step 4: Initialize PostgreSQL Database (2 min)

```bash
# Generate Prisma client for PostgreSQL
npx prisma generate

# Create tables in PostgreSQL
npx prisma db push
```

You should see: `✔ Your database is now in sync with your schema.`

---

### Step 5: Test Locally (3 min)

```bash
npm run dev
```

1. Open http://localhost:3000
2. Sign up with a new account (or migrate your data - see below)
3. Add a test entry
4. Verify everything works

---

### Step 6: Migrate Your Data (Optional - 5 min)

If you want to keep your existing SQLite data:

**Simple Method:**
1. Keep your SQLite database file (`dev.db`)
2. Use Prisma Studio to manually copy important data, OR
3. Start fresh (users sign up again)

**Advanced Method:**
- See `scripts/migrate-to-postgresql.md` for detailed migration steps
- The migration script requires some setup

---

### Step 7: Deploy to Vercel (5 min)

1. **Push to GitHub:**
   ```bash
   git init
   git add .
   git commit -m "Ready for deployment"
   git remote add origin https://github.com/YOUR_USERNAME/songbird.git
   git push -u origin main
   ```

2. **Deploy to Vercel:**
   - Go to [vercel.com](https://vercel.com)
   - Sign up with GitHub
   - Click **"New Project"**
   - Import your repository
   - Add environment variables:
     - `DATABASE_URL` (from Step 1)
     - `NEXTAUTH_URL` (will be auto-filled, but update to your Vercel URL)
     - `NEXTAUTH_SECRET` (same as Step 3)
     - `SPOTIPY_CLIENT_ID`
     - `SPOTIPY_CLIENT_SECRET`
   - Click **"Deploy"**

3. **After Deployment:**
   - Vercel will give you a URL like `https://songbird.vercel.app`
   - Update `NEXTAUTH_URL` in Vercel settings to this URL
   - Update Spotify redirect URIs in Spotify Developer Dashboard:
     - Add: `https://songbird.vercel.app/api/auth/callback/credentials`

4. **Run Database Migration on Vercel:**
   - Go to Vercel project → Settings → Environment Variables
   - Make sure `DATABASE_URL` is set
   - In Vercel dashboard, go to Deployments → Click on latest deployment → View Function Logs
   - Or use Vercel CLI:
     ```bash
     npx vercel env pull
     npx prisma db push
     ```

---

## ✅ You're Done!

Share your Vercel URL with your 50 users:
- `https://your-app.vercel.app`

They can:
- Access from any device
- Add to home screen (works like an app)
- Use it on mobile browsers

---

## Troubleshooting

### "Can't reach database server"
- Check your `DATABASE_URL` is correct
- Make sure PostgreSQL database is running
- Check firewall settings

### "Relation does not exist"
- Run `npx prisma db push` again
- Check you're connected to the right database

### "Invalid credentials" on Vercel
- Make sure all environment variables are set in Vercel
- Redeploy after adding variables

---

## Next Steps

- Monitor usage in Vercel dashboard
- Set up error tracking (optional)
- Consider adding PWA features for offline support

