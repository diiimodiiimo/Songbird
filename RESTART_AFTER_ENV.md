# Important: Restart Server After Adding Environment Variables

## Why You Need to Restart:

Environment variables are **only loaded when the server starts**. If you add or change environment variables while the server is running, it won't see them until you restart.

## Steps:

1. **Stop the server** - Press `Ctrl+C` in the terminal
2. **Wait 2-3 seconds** - Let it fully stop
3. **Start it again** - Run `npm run dev`

## After Restart:

The server will load all environment variables from `.env` (or `.env.local`) and Clerk should be able to find your keys.

## Quick Check:

After restarting, look for:
- ✅ No "Missing publishableKey" error
- ✅ Server starts successfully
- ✅ You can access the home page at `http://localhost:3000/home`



