# /deploy-check

Verify the project is ready for production deployment. Act like a DevOps engineer doing a pre-deployment checklist.

## Environment Variables

### Required Variables (Verify in Vercel)
- [ ] `DATABASE_URL` - PostgreSQL connection (use pooler for Vercel)
- [ ] `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
- [ ] `CLERK_SECRET_KEY`
- [ ] `NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in`
- [ ] `NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up`
- [ ] `SPOTIPY_CLIENT_ID`
- [ ] `SPOTIPY_CLIENT_SECRET`

### Database URL Format
```
# For Vercel (use pooler connection)
postgresql://postgres.[ref]:[password]@aws-0-us-east-1.pooler.supabase.com:6543/postgres
```

## Build Verification

### Pre-Deploy Commands
```bash
# Must pass without errors
npm run build

# Check for TypeScript errors
npx tsc --noEmit

# Check for linting errors
npm run lint
```

### Common Build Issues
- TypeScript errors
- Missing imports
- Unused variables (lint errors)
- Invalid Tailwind classes

## Database Readiness

- [ ] Schema is up to date (`npx prisma db push`)
- [ ] Migrations applied (if using migrate)
- [ ] Required seed data exists
- [ ] Connection pooling configured for serverless

## API Routes Check

### Authentication
- [ ] All routes check `auth()` before processing
- [ ] 401 returned for unauthenticated requests
- [ ] No sensitive data in public responses

### Error Handling
- [ ] All routes have try/catch
- [ ] Proper error status codes
- [ ] No stack traces in responses

## Security Checklist

- [ ] No hardcoded secrets in code
- [ ] `.env` / `.env.local` in `.gitignore`
- [ ] No debug endpoints in production
- [ ] HTTPS enforced (Vercel handles this)
- [ ] Secure headers configured

## Performance

- [ ] Images optimized (Next.js Image)
- [ ] No console.log in production paths
- [ ] Database queries optimized
- [ ] Response sizes reasonable

## Vercel-Specific

### Function Configuration (vercel.json)
```json
{
  "functions": {
    "app/api/**/*.ts": {
      "maxDuration": 10
    }
  }
}
```

### Known Issues
- Cold starts on serverless functions
- 10s timeout on Hobby, 60s on Pro
- Database connection limits

## Post-Deploy Verification

### Test These Endpoints
1. `/` - Home page loads
2. `/sign-in` - Auth works
3. `/api/entries` - API responds (with auth)
4. Database operations work

### Monitor For
- Function errors in Vercel dashboard
- Database connection issues
- Auth failures
- Slow response times

## Rollback Plan

- [ ] Previous working deployment identified
- [ ] Know how to rollback in Vercel
- [ ] Database migration rollback ready (if applicable)

## Output Format

**Ready to Deploy:** ✅ / ⚠️ / ❌

**Blockers (Must Fix):**
- List any deployment blockers

**Warnings (Should Fix):**
- List non-critical issues

**Post-Deploy Tasks:**
- List verification steps

**Commands to Run:**
```bash
# Provide specific commands
```

