# Clerk Authentication - Troubleshooting Guide & Lessons Learned

This document captures all the errors and issues encountered during the Clerk migration attempt to prevent repeating the same mistakes.

## Critical Issues Encountered

### 1. Environment Variable Loading Issues

**Problem:** Clerk couldn't find the publishable key even though it was in `.env.local`

**Errors:**
```
Error: @clerk/nextjs: Missing publishableKey
[Clerk]: You are running in keyless mode
```

**Root Causes:**
- Next.js reads `.env.local` but Prisma CLI only reads `.env` by default
- Having keys in both `.env` and `.env.local` can cause conflicts
- Server needs full restart after changing environment variables
- Cache can hold old environment variable values

**Solutions:**
- Only use `.env.local` for Clerk keys (not `.env`)
- Always restart server after changing `.env.local`
- Clear `.next` cache: `rm -rf .next` or `Remove-Item -Recurse -Force .next`
- Hardcode keys in code as temporary workaround (not recommended for production)

**Prevention:**
- Use only `.env.local` for local development
- Document which file should contain which variables
- Always restart server after env changes

---

### 2. Wrong Clerk Application Keys

**Problem:** Using keys from deleted/wrong Clerk application

**Errors:**
```
Error: Invalid host
Error: We were unable to attribute this request to an instance running on Clerk
Console Error: ClerkJS: Something went wrong initializing Clerk
```

**Root Causes:**
- Multiple Clerk applications in dashboard (skilled-jackal vs charming-kiwi)
- Deleted application keys still in code/environment
- Keys from wrong application being used
- Browser cache holding old keys

**How to Identify:**
- Error URLs show wrong app: `skilled-jackal-10.clerk.accounts.dev`
- Decode publishable key base64 to see app name
- Check Clerk Dashboard to see which app is active

**Solutions:**
- Always verify keys match the active Clerk application
- Delete old keys from all files when switching apps
- Clear all caches (`.next`, `node_modules/.cache`, npm cache)
- Use debug page to verify which app keys are loaded

**Prevention:**
- Only have ONE active Clerk application per project
- Document which Clerk app name corresponds to which project
- Delete unused Clerk applications immediately
- Never mix keys from different applications

---

### 3. Component Migration Issues

**Problem:** Components still using NextAuth's `useSession` after switching to Clerk

**Errors:**
```
Error: [next-auth]: `useSession` must be wrapped in a <SessionProvider />
Error: Clerk: auth() and currentUser() are only supported in App Router
```

**Root Causes:**
- Partial migration - some components updated, others not
- Multiple components using different auth systems
- Sub-components also need updating

**Files That Needed Updates:**
- `components/Navigation.tsx` - useSession → useUser
- `components/AddEntryTab.tsx` - useSession → useUser
- `components/FeedTab.tsx` - useSession → useUser
- `components/HistoryTab.tsx` - useSession → useUser (including sub-components)
- `components/FullHistoryTab.tsx` - useSession → useUser
- `components/ProfileTab.tsx` - useSession → useUser
- `components/Notifications.tsx` - useSession → useUser
- `components/AnalyticsTab.tsx` - useSession → useUser
- `components/WrappedTab.tsx` - useSession → useUser
- `components/FriendsTab.tsx` - useSession → useUser
- `components/MemoryTab.tsx` - useSession → useUser
- `app/archive/page.tsx` - getServerSession → auth()
- `app/profile/edit/page.tsx` - getServerSession → auth()
- All API routes - getServerSession → auth()

**Migration Pattern:**

**Client Components:**
```tsx
// Before (NextAuth)
import { useSession } from 'next-auth/react'
const { data: session } = useSession()
if (!session) return null

// After (Clerk)
import { useUser } from '@clerk/nextjs'
const { user, isLoaded, isSignedIn } = useUser()
if (!isLoaded || !isSignedIn) return null
```

**Server Components:**
```tsx
// Before (NextAuth)
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
const session = await getServerSession(authOptions)
if (!session) redirect('/sign-in')

// After (Clerk)
import { auth } from '@clerk/nextjs/server'
const { userId } = await auth()
if (!userId) redirect('/sign-in')
```

**API Routes:**
```tsx
// Before (NextAuth)
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
const session = await getServerSession(authOptions)
if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
const userId = session.user.id

// After (Clerk)
import { auth } from '@clerk/nextjs/server'
const { userId } = await auth()
if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
```

**Prevention:**
- Migrate ALL components at once, not incrementally
- Use grep to find all instances: `grep -r "useSession"` and `grep -r "getServerSession"`
- Test each component after migration
- Update sub-components within files too

---

### 4. Next.js 16 Async API Changes

**Problem:** Next.js 16 requires `headers()`, `cookies()`, `params`, `searchParams` to be awaited

**Errors:**
```
Error: Route "/_not-found" used `headers()` - must be awaited
Error: Route "/_not-found" used `headers().append` - must be awaited
TypeError: Request constructor: init.headers is a symbol
```

**Root Causes:**
- Next.js 16 made dynamic APIs async
- Clerk middleware might be calling these synchronously
- Old code patterns don't work in Next.js 16

**Solutions:**
- Update all `headers()` calls to `await headers()`
- Update all `cookies()` calls to `await cookies()`
- Update params: `{ params }: { params: Promise<{ id: string }> }` then `await params`
- Update searchParams similarly

**Prevention:**
- Check Next.js version compatibility before migration
- Update all dynamic API usage before switching auth systems
- Test middleware thoroughly

---

### 5. Middleware Configuration Issues

**Problem:** Middleware deprecation warnings and routing issues

**Errors:**
```
Warning: The "middleware" file convention is deprecated. Please use "proxy" instead.
```

**Root Causes:**
- Next.js 16 deprecating middleware convention
- Clerk still uses middleware pattern
- Routing conflicts between public/protected routes

**Solutions:**
- Ignore deprecation warning for now (Clerk will update)
- Ensure public routes are correctly defined
- Test redirects work correctly

**Prevention:**
- Keep middleware simple
- Document which routes should be public
- Test authentication flow end-to-end

---

### 6. Cache Persistence Issues

**Problem:** Old code/keys persisted in cache even after changes

**Root Causes:**
- `.next` build cache holding old code
- `node_modules/.cache` holding old values
- npm cache
- Browser cache

**Solutions:**
```bash
# Kill all processes
pkill -f node || Get-Process node | Stop-Process -Force

# Delete all caches
rm -rf .next
rm -rf node_modules/.cache
npm cache clean --force

# Restart
npm run dev
```

**Prevention:**
- Always clear cache when switching auth systems
- Document cache clearing steps
- Use version control to track changes

---

### 7. User ID Mismatch Issues

**Problem:** Clerk user IDs don't match database user IDs

**Root Causes:**
- Clerk uses IDs like `user_2abc123`
- Database uses CUIDs like `cmjqgfbat00005pw4bx0gpv7m`
- Need mapping between Clerk IDs and database IDs

**Solutions:**
- Add `clerkId` field to User model
- Create user sync helper function
- Link existing users by email on first login
- Use database user ID for queries, not Clerk ID

**Prevention:**
- Plan user ID mapping strategy before migration
- Test user linking works correctly
- Document the mapping approach

---

### 8. Hardcoded Keys in Code

**Problem:** Hardcoding publishable key as workaround caused confusion

**Root Causes:**
- Environment variables not loading
- Quick fix that became permanent
- Keys from wrong application hardcoded

**Solutions:**
- Remove hardcoded keys after fixing env var issues
- Always use environment variables
- Never commit keys to code

**Prevention:**
- Fix root cause, not symptoms
- Use environment variables exclusively
- Document why keys are where they are

---

## Best Practices for Future Auth Migrations

### Before Starting:
1. ✅ Document current auth system fully
2. ✅ List all files using auth (components, API routes, pages)
3. ✅ Understand user ID mapping strategy
4. ✅ Have rollback plan ready
5. ✅ Test current system works before migration

### During Migration:
1. ✅ Migrate incrementally but completely per file
2. ✅ Test each component after migration
3. ✅ Update all related files (sub-components, API routes)
4. ✅ Clear caches frequently
5. ✅ Verify environment variables are loading

### After Migration:
1. ✅ Test all auth flows (sign in, sign up, sign out)
2. ✅ Test protected routes
3. ✅ Test API routes
4. ✅ Verify user data access
5. ✅ Remove old auth code completely

### Environment Variables:
1. ✅ Use only `.env.local` for local development
2. ✅ Never commit `.env.local` to git
3. ✅ Document which variables go where
4. ✅ Restart server after env changes
5. ✅ Verify keys match active application

### Debugging:
1. ✅ Create debug pages to verify env vars
2. ✅ Decode keys to verify which app they point to
3. ✅ Check browser console for errors
4. ✅ Check server logs
5. ✅ Use Clerk Dashboard to verify app status

---

## Quick Reference: Common Fixes

### "Missing publishableKey"
- Check `.env.local` has `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
- Restart server
- Clear `.next` cache
- Verify no quotes around key value

### "Invalid host"
- Check keys match active Clerk application
- Verify `localhost:3000` is in Clerk Dashboard allowed domains
- Decode key to see which app it points to

### "useSession must be wrapped"
- Component still using NextAuth
- Update to use Clerk's `useUser()`
- Ensure `ClerkProvider` is in layout

### "auth() only supported in App Router"
- Using `auth()` in wrong context
- Make sure it's in App Router file (not Pages Router)
- Check middleware is configured correctly

### Keys not updating
- Clear all caches
- Restart server
- Check for hardcoded keys in code
- Verify `.env.local` file is correct

---

## Files to Check When Debugging

1. `.env.local` - Environment variables
2. `app/layout.tsx` - ClerkProvider setup
3. `middleware.ts` - Route protection
4. `app/providers.tsx` - Client providers
5. `package.json` - Dependencies
6. Browser console - Client-side errors
7. Terminal - Server-side errors
8. Clerk Dashboard - Application status

---

## Lessons Learned

1. **One application at a time** - Don't have multiple Clerk apps for same project
2. **Complete migration** - Update ALL files, not just some
3. **Clear caches** - Always clear caches when switching systems
4. **Verify keys** - Always verify keys match the active application
5. **Test incrementally** - Test after each major change
6. **Document everything** - Keep track of what changed and why
7. **Have rollback plan** - Know how to revert if needed
8. **Environment variables** - Use them correctly, don't hardcode
9. **User ID mapping** - Plan this before migration
10. **Read errors carefully** - They usually tell you exactly what's wrong

---

## Migration Checklist

When doing auth migration in the future:

- [ ] Document current auth system
- [ ] List all files using auth
- [ ] Create new auth application (if needed)
- [ ] Get correct keys
- [ ] Update environment variables
- [ ] Update layout.tsx
- [ ] Update middleware.ts
- [ ] Update providers.tsx
- [ ] Update app/page.tsx
- [ ] Update ALL components (use grep to find them)
- [ ] Update ALL API routes (use grep to find them)
- [ ] Update ALL pages (use grep to find them)
- [ ] Clear all caches
- [ ] Restart server
- [ ] Test sign in flow
- [ ] Test sign up flow
- [ ] Test sign out flow
- [ ] Test protected routes
- [ ] Test API routes
- [ ] Verify user data access
- [ ] Remove old auth code
- [ ] Remove old dependencies
- [ ] Document the new system

---

**Last Updated:** After Clerk migration attempt
**Status:** Documented for future reference


