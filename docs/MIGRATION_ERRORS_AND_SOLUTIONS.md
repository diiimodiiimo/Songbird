# Migration Errors and Solutions - NextAuth to Clerk

This document details all errors encountered during the migration from NextAuth to Clerk authentication and how they were resolved.

## Table of Contents
1. [Authentication Migration Issues](#authentication-migration-issues)
2. [Database Connection Issues](#database-connection-issues)
3. [User Synchronization Problems](#user-synchronization-problems)
4. [Environment Variable Issues](#environment-variable-issues)
5. [Prisma Client Issues](#prisma-client-issues)
6. [API Route Authentication Errors](#api-route-authentication-errors)
7. [UI/UX Issues](#uiux-issues)

---

## Authentication Migration Issues

### Error 1: `useSession must be wrapped in a <SessionProvider />`
**Error Message:**
```
[next-auth]: `useSession` must be wrapped in a <SessionProvider />
```

**Root Cause:**
- Components were still using NextAuth's `useSession` hook after replacing `SessionProvider` with `ClerkProvider`
- The migration was incomplete - some components weren't updated

**Solution:**
- Systematically replaced all `useSession` calls with `useUser` from `@clerk/nextjs`
- Updated all client components:
  - `components/Navigation.tsx`
  - `components/Dashboard.tsx`
  - `components/AddEntryTab.tsx`
  - `components/AnalyticsTab.tsx`
  - `components/MemoryTab.tsx`
  - `components/FeedTab.tsx`
  - `components/ProfileTab.tsx`
  - `components/WrappedTab.tsx`
  - `components/LeaderboardTab.tsx`
  - `components/HistoryTab.tsx`
  - `components/FullHistoryTab.tsx`
  - `components/FriendsTab.tsx`
  - `components/Notifications.tsx`

**Files Changed:**
- All component files listed above
- `app/providers.tsx` - Replaced `SessionProvider` with `ClerkProvider`

---

### Error 2: `session is not defined`
**Error Message:**
```
session is not defined app\page.tsx (12:10) @ Home
```

**Root Cause:**
- Server components and API routes were still referencing `session` from NextAuth
- `app/page.tsx` was trying to use `session` which no longer existed

**Solution:**
- Updated `app/page.tsx` to use Clerk's `auth()` instead:
  ```typescript
  import { auth } from '@clerk/nextjs/server'
  
  export default async function Home() {
    const { userId } = await auth()
    if (!userId) {
      redirect('/home')
    }
    return <Dashboard />
  }
  ```
- Updated all API routes to use `auth()` from `@clerk/nextjs/server` instead of `getServerSession`

**Files Changed:**
- `app/page.tsx`
- All API routes in `app/api/*/route.ts`

---

## Database Connection Issues

### Error 3: `Environment variable not found: DATABASE_URL`
**Error Message:**
```
error: Environment variable not found: DATABASE_URL.
  -->  schema.prisma:10
   | 
 9 |   provider = "postgresql"
10 |   url      = env("DATABASE_URL")
```

**Root Cause:**
- Prisma validates the schema at runtime and requires `DATABASE_URL` to be set
- `next.config.js` env variables aren't available when Prisma validates the schema
- The `.env.local` file wasn't being read properly in all contexts

**Solution:**
- Hardcoded `DATABASE_URL` directly in `lib/prisma.ts`:
  ```typescript
  // Hardcode DATABASE_URL - Supabase connection
  process.env.DATABASE_URL = 'postgresql://postgres.undbrbgtjgslmoswqaww:D1modadreamo4979@aws-0-us-east-1.pooler.supabase.com:6543/postgres'
  ```
- **Note:** This is a temporary solution. The pooler connection was later found to be failing.

**Files Changed:**
- `lib/prisma.ts`

---

### Error 4: `FATAL: Tenant or user not found`
**Error Message:**
```
Error querying the database: FATAL: Tenant or user not found
```

**Root Cause:**
- The Supabase pooler connection string (port 6543) was failing
- The direct connection string (port 5432) worked in scripts but wasn't being used in the app

**Solution Attempted:**
- Changed to direct connection string in `lib/prisma.ts`:
  ```typescript
  process.env.DATABASE_URL = 'postgresql://postgres:D1modadreamo4979@db.undbrbgtjgslmoswqaww.supabase.co:5432/postgres'
  ```
- **Status:** This should be the correct fix, but needs verification after server restart

**Files Changed:**
- `lib/prisma.ts`

**Lesson Learned:**
- Always test both pooler and direct connections
- Pooler connections may have different authentication requirements
- Direct connections are more reliable for development

---

## User Synchronization Problems

### Error 5: User ID Mismatch - Clerk ID as User ID
**Problem:**
- Database user ID was `user_388dqr3cH3WoTbL8RCxt1HAIx0o` (Clerk ID format)
- All 1,694 entries were linked to this user ID
- The sync function wasn't checking if Clerk ID matches user ID directly

**Root Cause:**
- The user was created with Clerk ID as the primary user ID (not in `clerkId` field)
- The sync function only checked `clerkId` field, not the user `id` field

**Solution:**
- Updated `lib/clerk-sync.ts` to check user ID directly first:
  ```typescript
  // First check if Clerk ID matches a user ID directly (your case)
  const userById = await prisma.user.findUnique({
    where: { id: clerkUserId },
    select: { id: true },
  })
  
  if (userById) {
    return userById.id
  }
  ```
- Then fallback to checking `clerkId` field
- Then fallback to email lookup

**Files Changed:**
- `lib/clerk-sync.ts`

**Lesson Learned:**
- Always check multiple fields when syncing users
- Handle edge cases where user ID might be the Clerk ID
- Test with actual user data structure, not assumptions

---

### Error 6: Empty Feed/No Data Showing
**Problem:**
- User had 1,694 entries in database
- Feed and all tabs showed "No entries" or empty states
- API routes were returning 500 errors

**Root Cause:**
- Database connection was failing (Error 4)
- User sync was failing, so API routes couldn't find the user
- All API calls were returning errors

**Solution:**
- Fixed database connection (Error 4 solution)
- Fixed user sync logic (Error 5 solution)
- Once both are fixed, data should appear

**Status:** Pending - requires database connection fix

---

## Environment Variable Issues

### Error 7: Clerk Keys Not Being Picked Up
**Problem:**
- App was connecting to old/deleted Clerk account
- Environment variables in `.env.local` weren't being used
- `next.config.js` env wasn't sufficient

**Solution:**
- Hardcoded Clerk keys in `app/providers.tsx`:
  ```typescript
  <ClerkProvider
    publishableKey="pk_test_Y2hhcm1pbmcta2l3aS0zOS5jbGVyay5hY2NvdW50cy5kZXYk"
    signInUrl="/home"
    signUpUrl="/home"
    afterSignInUrl="/"
    afterSignUpUrl="/"
    signOutUrl="/home"
  >
  ```
- Also hardcoded in `next.config.js`:
  ```javascript
  env: {
    NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: 'pk_test_...',
    CLERK_SECRET_KEY: 'sk_test_...',
    // ...
  }
  ```

**Files Changed:**
- `app/providers.tsx`
- `next.config.js`

**Lesson Learned:**
- Hardcoding is a temporary solution for troubleshooting
- Should use environment variables in production
- Verify env vars are loaded correctly before hardcoding

---

## Prisma Client Issues

### Error 8: `Unknown field clerkId for select statement`
**Error Message:**
```
Unknown field `clerkId` for select statement on model `User`.
```

**Root Cause:**
- Prisma client was generated before `clerkId` field was added to schema
- The generated client didn't include the new field

**Solution:**
- Regenerated Prisma client:
  ```bash
  npx prisma generate
  ```
- **Note:** Had to kill Node processes first due to file locking on Windows

**Files Changed:**
- Regenerated `node_modules/.prisma/client/`

**Lesson Learned:**
- Always regenerate Prisma client after schema changes
- Kill all Node processes before regenerating on Windows
- Check if Prisma client is out of sync when seeing "unknown field" errors

---

### Error 9: Prisma Client File Locking (Windows)
**Error Message:**
```
EPERM: operation not permitted, rename '...query_engine-windows.dll.node.tmp...'
```

**Root Cause:**
- Node.js processes were holding locks on Prisma client files
- Windows file system doesn't allow renaming locked files

**Solution:**
- Kill all Node processes before regenerating:
  ```bash
  taskkill /F /IM node.exe
  npx prisma generate
  ```

**Lesson Learned:**
- Always kill Node processes before Prisma operations on Windows
- Use `taskkill /F /IM node.exe` to force kill all Node processes

---

## API Route Authentication Errors

### Error 10: API Routes Using Wrong Authentication
**Problem:**
- All API routes were using `getServerSession(authOptions)` from NextAuth
- This no longer worked after migration

**Solution:**
- Updated all API routes to use Clerk's `auth()`:
  ```typescript
  import { auth } from '@clerk/nextjs/server'
  
  export async function GET(request: Request) {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    // ... rest of code
  }
  ```
- Created helper function `getPrismaUserIdFromClerk()` to convert Clerk IDs to Prisma user IDs

**Files Changed:**
- All files in `app/api/*/route.ts`:
  - `app/api/entries/route.ts`
  - `app/api/profile/route.ts`
  - `app/api/analytics/route.ts`
  - `app/api/users/search/route.ts`
  - `app/api/notifications/route.ts`
  - `app/api/feed/route.ts`
  - `app/api/artists/search/route.ts`
  - `app/api/songs/search/route.ts`
  - `app/api/ai-insight/route.ts`
  - `app/api/on-this-day/route.ts`
  - `app/api/leaderboard/route.ts`
  - `app/api/wrapped/route.ts`
  - `app/api/mentions/route.ts`
  - `app/api/friends/list/route.ts`
  - `app/api/friends/requests/route.ts`
  - `app/api/friends/requests/[id]/route.ts`
  - `app/api/entries/[id]/route.ts`

**Lesson Learned:**
- Create helper functions early to avoid repetitive code
- Systematically update all API routes at once
- Test each route after migration

---

## UI/UX Issues

### Error 11: Sign In Button Not Visible
**Problem:**
- Sign In button was hidden or blocked on home page
- User couldn't see both Sign In and Sign Up buttons

**Root Cause:**
- Button layout issues with flexbox
- Possibly z-index or overlay issues

**Solution:**
- Updated `app/home/page.tsx` to ensure both buttons are visible:
  ```typescript
  <div className="space-y-4 w-full">
    <SignInButton mode="modal" fallbackRedirectUrl="/">
      <button className="w-full px-8 py-4 bg-accent text-bg font-semibold rounded-lg hover:bg-accent/90 transition-colors text-center text-lg">
        Sign In
      </button>
    </SignInButton>
    <SignUpButton mode="modal" fallbackRedirectUrl="/">
      <button className="w-full px-8 py-4 bg-surface border-2 border-accent text-accent font-semibold rounded-lg hover:bg-surface/80 transition-colors text-center text-lg">
        Sign Up
      </button>
    </SignUpButton>
  </div>
  ```

**Files Changed:**
- `app/home/page.tsx`

---

## Key Lessons Learned

### 1. Migration Strategy
- **Do:** Update all files systematically, one category at a time
- **Don't:** Mix old and new authentication systems
- **Checklist:**
  - [ ] Update providers
  - [ ] Update middleware
  - [ ] Update all client components
  - [ ] Update all server components
  - [ ] Update all API routes
  - [ ] Test each category before moving on

### 2. Database Connections
- **Do:** Test connection strings in isolation first
- **Don't:** Assume pooler connections work the same as direct connections
- **Verify:** Connection works before building features on top

### 3. User Synchronization
- **Do:** Handle multiple lookup strategies (ID, clerkId, email)
- **Don't:** Assume all users follow the same pattern
- **Test:** With actual user data, not just schema

### 4. Environment Variables
- **Do:** Use environment variables in production
- **Don't:** Hardcode secrets (except for troubleshooting)
- **Verify:** Env vars are loaded correctly before hardcoding

### 5. Prisma Client
- **Do:** Regenerate after every schema change
- **Don't:** Assume the client is up to date
- **Windows:** Always kill Node processes before regenerating

### 6. Error Handling
- **Do:** Check database connection first when seeing Prisma errors
- **Don't:** Assume errors are in your code logic
- **Debug:** Start with connection, then authentication, then business logic

---

## Current Status

### ✅ Completed
- [x] Migrated from NextAuth to Clerk
- [x] Updated all client components
- [x] Updated all API routes
- [x] Created user sync helper function
- [x] Fixed UI issues (sign in button visibility)
- [x] Added "Add Friend by Username" feature

### ⚠️ Pending (Requires Database Fix)
- [ ] Database connection working (pooler vs direct)
- [ ] User data visible in app (1,694 entries)
- [ ] All API routes returning data successfully

### 🔧 Recommended Next Steps
1. Fix database connection (use direct connection string)
2. Verify user sync works with actual database
3. Test all API routes return data
4. Remove hardcoded values and use environment variables
5. Add error logging for better debugging

---

## Files Created/Modified

### New Files
- `lib/clerk-sync.ts` - User synchronization helper
- `app/api/migrate-user/route.ts` - User migration endpoint
- `app/migrate/page.tsx` - Migration UI page
- `scripts/link-clerk-user.ts` - Direct database migration script
- `scripts/check-user-data.ts` - User data verification script
- `scripts/migrate-user-to-clerk.ts` - Email-based migration script

### Modified Files
- `app/providers.tsx` - Replaced SessionProvider with ClerkProvider
- `middleware.ts` - Updated to use Clerk middleware
- `lib/prisma.ts` - Hardcoded DATABASE_URL
- `lib/clerk-sync.ts` - User sync logic
- `app/page.tsx` - Updated to use Clerk auth
- `app/home/page.tsx` - Updated sign in/up buttons
- All API routes - Updated to use Clerk auth
- All client components - Updated to use useUser hook
- `next.config.js` - Hardcoded Clerk keys
- `components/FriendsTab.tsx` - Improved "Add Friend" UI

---

## Migration Checklist for Future Reference

When migrating authentication systems:

- [ ] **Phase 1: Setup**
  - [ ] Install new auth package
  - [ ] Configure environment variables
  - [ ] Update providers
  - [ ] Update middleware

- [ ] **Phase 2: Server Components**
  - [ ] Update root page
  - [ ] Update all server components
  - [ ] Test authentication checks

- [ ] **Phase 3: Client Components**
  - [ ] Replace all `useSession` with new hook
  - [ ] Update authentication checks
  - [ ] Test user state access

- [ ] **Phase 4: API Routes**
  - [ ] Replace `getServerSession` with new auth
  - [ ] Update user ID retrieval
  - [ ] Test all endpoints

- [ ] **Phase 5: Database**
  - [ ] Add new auth ID field to schema
  - [ ] Create migration script
  - [ ] Sync existing users
  - [ ] Verify data integrity

- [ ] **Phase 6: Testing**
  - [ ] Test sign in/up flow
  - [ ] Test protected routes
  - [ ] Test API endpoints
  - [ ] Test user data access
  - [ ] Test edge cases

- [ ] **Phase 7: Cleanup**
  - [ ] Remove old auth code
  - [ ] Remove hardcoded values
  - [ ] Update documentation
  - [ ] Deploy and verify

---

## Common Error Patterns

### Pattern 1: "X is not defined"
- **Cause:** Old code still referencing removed variables/functions
- **Fix:** Search codebase for all references and update

### Pattern 2: "Environment variable not found"
- **Cause:** Env vars not loaded or wrong context
- **Fix:** Hardcode temporarily, then fix env loading

### Pattern 3: "Unknown field" in Prisma
- **Cause:** Prisma client out of sync with schema
- **Fix:** Regenerate Prisma client

### Pattern 4: "FATAL: Tenant or user not found"
- **Cause:** Database connection string incorrect
- **Fix:** Test connection string, try direct vs pooler

### Pattern 5: Empty data but data exists
- **Cause:** User sync failing or wrong user ID
- **Fix:** Check user sync logic, verify user ID mapping

---

*Document created: January 2025*
*Migration: NextAuth.js → Clerk*
*Status: In Progress - Database connection pending*


