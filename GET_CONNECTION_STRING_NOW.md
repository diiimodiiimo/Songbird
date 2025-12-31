# 🔗 Get Your Connection String - Step by Step

## You're Currently On: Database Page (Schema Visualizer)

## Step 1: Go to Settings
1. **Look at the LEFT SIDEBAR** (where you see "Database" section)
2. **Scroll down** - you should see sections like:
   - Database Management
   - Configuration
   - Platform
3. **Under "CONFIGURATION"** section, click **"Settings"**
4. This will take you to the Settings page

## Step 2: Find Database Connection String
Once in Settings:
1. **Look for "Database"** in the left menu (or tabs at top)
2. **Click "Database"**
3. **Scroll down** - you should see:
   - Database password section
   - Connection pooling
   - **Connection string** section ← THIS IS WHAT YOU NEED!

## Alternative: Check Project Overview

If you still can't find it:
1. **Click your project name** at the very top (where it says "SongBird FREE" or your project name)
2. Look for **"Project Settings"** or **"Settings"**
3. Go to **"Database"** tab
4. Look for **"Connection string"** or **"Connection info"**

## Still Can't Find It? Build It Manually

If Supabase doesn't show the connection string, you can build it:

### What You Need:
1. **Host**: Your project URL (from the top of the page)
   - If your project URL is: `https://xxxxx.supabase.co`
   - Your database host is: `db.xxxxx.supabase.co`
   
2. **Password**: Your database password
   - If you don't know it, go to Settings → Database → "Reset database password"
   - Save the new password!

3. **Build the connection string:**
   ```
   postgresql://postgres:YOUR_PASSWORD@db.xxxxx.supabase.co:5432/postgres?sslmode=require
   ```

### Example:
If your project URL is `https://abcdefghijklmnop.supabase.co` and your password is `MyPass123!`:
```
postgresql://postgres:MyPass123!@db.abcdefghijklmnop.supabase.co:5432/postgres?sslmode=require
```

---

## Quick Check: What's Your Project URL?

Look at the top of your browser - what's the URL?
- It should be something like: `https://xxxxx.supabase.co/project/...`
- The `xxxxx` part is your project reference ID
- Your database host will be: `db.xxxxx.supabase.co`

Tell me your project URL and I can help you build the connection string!


