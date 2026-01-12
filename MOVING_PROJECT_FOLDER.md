# Moving Your Project Folder - What to Know

## ✅ Safe to Move

Moving your Next.js project folder is **generally safe** and won't break anything because:

1. **No Hard-coded Paths** - Next.js uses relative paths, not absolute paths
2. **Environment Variables** - Stored in `.env.local` (moves with the folder)
3. **Node Modules** - Re-install if needed, but can copy `node_modules` too
4. **Database** - SQLite file (if using) moves with the folder
5. **Git** - If using git, it's folder-based, moves fine

## ⚠️ Things to Watch Out For:

1. **Environment Variables in IDE/Terminal**
   - If your IDE (Cursor) has the folder path saved, you'll need to open the new folder
   - Terminal will need to `cd` to the new location

2. **Git Remote** (if using)
   - Git remote URLs are fine, but check if you have any absolute path hooks

3. **Database Connection Strings** (if absolute paths)
   - Check your `.env.local` - if DATABASE_URL uses absolute paths, update them
   - Usually it's relative or a connection string (fine to move)

4. **Vercel Connection** (if connected)
   - Vercel tracks by git repo, not folder location
   - Moving the folder won't affect Vercel deployments
   - Just make sure git still works after moving

## 📋 Steps to Move Safely:

1. **Stop the dev server** (if running)
2. **Copy the entire `sotd` folder** to new location (don't cut, copy first to be safe)
3. **Open terminal in new location**
4. **Test it works**: 
   ```bash
   cd C:\Dev\sotd  # or wherever you moved it
   npm run dev
   ```
5. **If everything works, delete old folder**

## 🎯 Recommended New Locations:

- `C:\Dev\sotd`
- `C:\Projects\sotd`
- `D:\Projects\sotd` (if you have D drive)

**Bottom line:** Moving is safe! Next.js projects are designed to be portable.




