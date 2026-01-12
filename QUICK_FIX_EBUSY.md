# Quick Fix for File Lock Error

This error happens because Windows/OneDrive has locked files. Here's how to fix it:

## Immediate Fix:

1. **Stop the dev server** - Press `Ctrl+C` in your terminal
2. **Wait 2-3 seconds**
3. **Restart it**: `npm run dev`

## If That Doesn't Work:

Your project is in **OneDrive** (`OneDrive\Pictures\Screenshots 1\sotd`), which can cause file locking issues.

**Option 1: Pause OneDrive Sync (Temporary)**
- Right-click OneDrive icon in system tray
- Click "Pause syncing" → "2 hours"
- Restart dev server

**Option 2: Move Project Out of OneDrive (Recommended)**
Move your project to a regular folder:
- `C:\Dev\sotd` 
- `C:\Projects\sotd`
- `D:\Projects\sotd` (if you have D drive)

Then:
1. Copy the entire `sotd` folder to new location
2. Update your terminal to the new path
3. Run `npm install` in the new location
4. Run `npm run dev`

**Why?** OneDrive constantly syncs files, which can lock them during development. Regular folders don't have this issue.

## Alternative: Exclude from OneDrive Sync
- Right-click `sotd` folder
- OneDrive → "Always keep on this device"
- This reduces but doesn't eliminate sync issues



