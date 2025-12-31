# Migration Guide: SQLite → PostgreSQL

## Step 1: Create PostgreSQL Database

Choose one of these free options:

### Option A: Supabase (Recommended - Easiest)
1. Go to [supabase.com](https://supabase.com)
2. Sign up (free)
3. Create new project
4. Wait for database to be created (~2 minutes)
5. Go to Settings → Database
6. Copy the "Connection string" (URI format)
   - It looks like: `postgresql://postgres:[PASSWORD]@db.xxx.supabase.co:5432/postgres`

### Option B: Railway
1. Go to [railway.app](https://railway.app)
2. Sign up
3. Create new project → Add PostgreSQL
4. Copy the DATABASE_URL from the service

### Option C: Render
1. Go to [render.com](https://render.com)
2. Sign up
3. Create new PostgreSQL database
4. Copy the Internal Database URL

---

## Step 2: Backup Your SQLite Data

**IMPORTANT:** Backup your current database before migrating!

```bash
# Copy your SQLite database file
cp dev.db dev.db.backup

# Or if using a different path, copy that file
```

---

## Step 3: Update Environment Variables

Create or update your `.env` file:

```env
# OLD (SQLite) - Comment out or remove
# DATABASE_URL="file:./dev.db"

# NEW (PostgreSQL) - Add your connection string
DATABASE_URL="postgresql://user:password@host:5432/dbname?sslmode=require"

# Make sure these are set too
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-here
SPOTIPY_CLIENT_ID=your-client-id
SPOTIPY_CLIENT_SECRET=your-client-secret
```

---

## Step 4: Generate Prisma Client

```bash
npx prisma generate
```

---

## Step 5: Push Schema to PostgreSQL

This will create all tables in your PostgreSQL database:

```bash
npx prisma db push
```

---

## Step 6: Migrate Your Data

You have two options:

### Option A: Manual Migration (If you have a lot of data)

Use the migration script: `scripts/migrate-data-to-postgresql.ts`

```bash
npm run migrate:data
```

### Option B: Start Fresh (If you don't mind losing data)

Just start using the new PostgreSQL database. Users will need to sign up again.

---

## Step 7: Verify Migration

```bash
# Open Prisma Studio to view your data
npx prisma studio
```

Check that:
- Users table has your users
- Entries table has your entries
- All relationships are intact

---

## Step 8: Test Your App

```bash
npm run dev
```

Test:
- Sign in
- View entries
- Add new entry
- Check analytics

---

## Troubleshooting

### Error: "relation does not exist"
- Make sure you ran `npx prisma db push`
- Check your DATABASE_URL is correct

### Error: "connection refused"
- Check your PostgreSQL database is running
- Verify DATABASE_URL connection string
- Check firewall/network settings

### Data not showing up
- Make sure you ran the data migration script
- Check Prisma Studio to verify data exists
- Check your user ID matches

---

## Rollback (If Something Goes Wrong)

If you need to go back to SQLite:

1. Update `prisma/schema.prisma`:
   ```prisma
   datasource db {
     provider = "sqlite"
     url      = env("DATABASE_URL")
   }
   ```

2. Update `.env`:
   ```env
   DATABASE_URL="file:./dev.db"
   ```

3. Restore your backup:
   ```bash
   cp dev.db.backup dev.db
   ```

4. Regenerate Prisma client:
   ```bash
   npx prisma generate
   ```


