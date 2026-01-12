# Fixing File Lock Error (EBUSY)

This error happens on Windows when files are locked by another process (often OneDrive).

## Quick Fixes (try in order):

### 1. Stop and Restart Dev Server
- Press `Ctrl+C` in the terminal to stop the dev server
- Wait 2-3 seconds
- Run `npm run dev` again

### 2. Close File Editors
- Close any editors that might have the files open
- Close VS Code/Cursor if you have the files open

### 3. OneDrive Issue (Your project is in OneDrive)
Since your project is in `OneDrive\Pictures\Screenshots 1\sotd`, OneDrive might be syncing and locking files.

**Quick fix:**
- Right-click the `sotd` folder in File Explorer
- Select "Always keep on this device" (this stops constant syncing)
- Or pause OneDrive sync temporarily

**Better long-term solution:**
- Move your project OUT of OneDrive to a regular folder like:
  - `C:\Dev\sotd`
  - `C:\Projects\sotd`
  - `D:\Projects\sotd`

### 4. Windows File Lock
If the above doesn't work:
- Close ALL terminal windows
- Close ALL code editors
- Wait 10 seconds
- Open a NEW terminal
- Run `npm run dev`

### 5. Nuclear Option
- Restart your computer (clears all file locks)

## Most Likely Cause:
Since you're in OneDrive, it's probably OneDrive syncing. Try option 3 first!




