# /deploy-check

Pre-deployment verification for Vercel. Act like a release engineer ensuring production readiness.

## Pre-Deploy Checklist

### Build Verification
- [ ] `npm run build` succeeds locally
- [ ] `npm run typecheck` passes
- [ ] `npm run lint` passes
- [ ] No TypeScript errors

```bash
# Run all checks
npm run build && npm run typecheck && npm run lint
```

### Environment Variables

#### Required for Production
```
# Database
DATABASE_URL=postgresql://...

# Authentication (Clerk)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_xxx
CLERK_SECRET_KEY=sk_live_xxx
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up

# Spotify
SPOTIFY_CLIENT_ID=xxx
SPOTIFY_CLIENT_SECRET=xxx

# Push Notifications
VAPID_PUBLIC_KEY=xxx
VAPID_PRIVATE_KEY=xxx
NEXT_PUBLIC_VAPID_KEY=xxx

# Stripe (if enabled)
STRIPE_SECRET_KEY=sk_live_xxx
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx
```

#### Verify in Vercel Dashboard
1. Go to Project Settings → Environment Variables
2. Check all required vars are set for Production
3. Verify no test/development values leaked

### Database

#### Schema Sync
```bash
# Check schema is up to date
npx prisma db pull  # Pull current state
npx prisma generate # Regenerate client
```

#### Migrations Applied
Check `migrations/` folder for any pending migrations to run in Supabase.

#### Connection Pool
- Supabase uses connection pooler by default
- Verify `DATABASE_URL` uses pooler URL (port 6543)

### API Routes Check

#### Critical Endpoints
Test these work in preview deployment:
- [ ] `/api/auth/[...]` - Auth callbacks
- [ ] `/api/entries` - Entry CRUD
- [ ] `/api/today-data` - Dashboard data
- [ ] `/api/feed` - Social feed
- [ ] `/api/songs` - Spotify search

#### Rate Limiting
- Verify rate limits are appropriate for production load
- Check in-memory store resets on deploy (expected)

### Frontend Check

#### Build Output
- [ ] No "use server" / "use client" conflicts
- [ ] All dynamic imports work
- [ ] Static pages generate successfully

#### Assets
- [ ] Images load correctly
- [ ] Fonts load correctly  
- [ ] manifest.json is valid
- [ ] Service worker (sw.js) is functional

### Webhook Endpoints

#### Stripe (if enabled)
1. Update webhook URL in Stripe Dashboard
2. Verify webhook secret matches
3. Test webhook with Stripe CLI

#### Clerk
1. Clerk webhooks auto-configured
2. Verify JWT verification works

### Vercel Configuration

#### vercel.json
```json
{
  "functions": {
    "app/api/**/*.ts": {
      "maxDuration": 30
    }
  }
}
```

#### Build Settings
- Framework: Next.js (auto-detected)
- Build Command: `npm run build`
- Output Directory: `.next`
- Install Command: `npm install`

### Post-Deploy Verification

#### Smoke Tests
1. [ ] Homepage loads
2. [ ] Sign in works
3. [ ] Create entry works
4. [ ] Feed loads
5. [ ] Push notification subscription works

#### Monitoring
- [ ] Vercel Analytics enabled
- [ ] Error tracking configured
- [ ] Function logs accessible

### Rollback Plan

If issues arise:
1. **Immediate**: Use Vercel's instant rollback
2. **Gradual**: Promote previous deployment
3. **Database**: No automatic rollback (manual required)

```bash
# Vercel CLI rollback
vercel rollback [deployment-url]
```

### Common Deploy Issues

#### "Build Failed: Module not found"
- Check import paths (case-sensitive on Linux)
- Verify all dependencies in package.json

#### "Function timeout"
- Increase `maxDuration` in vercel.json
- Optimize slow database queries

#### "Database connection failed"
- Check DATABASE_URL is correct
- Verify IP allowlist in Supabase
- Check connection pool limits

#### "Auth not working"
- Verify Clerk keys are production keys
- Check redirect URLs in Clerk Dashboard

## Deploy Commands

```bash
# Deploy to preview
vercel

# Deploy to production
vercel --prod

# Check deployment status
vercel ls
```
