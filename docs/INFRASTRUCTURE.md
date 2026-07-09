# SongBird — Infrastructure & Architecture

> Context document for AI agents. Explains *what* we use, *how* it's configured, and *why* each decision was made.

---

## Overview

SongBird runs as a **Next.js 16 App Router** application deployed on **Vercel**, backed by a **Supabase PostgreSQL** database, with **Clerk** handling authentication, **Stripe** handling payments, and **Spotify's Web API** providing music search. Every piece was chosen for the same reason: it works well for a solo founder shipping fast on a bootstrap budget.

```
┌─────────────┐     ┌─────────────┐     ┌─────────────────┐
│   Vercel     │────▶│  Supabase   │     │    Clerk        │
│  (Hosting)   │     │ (PostgreSQL)│     │  (Auth)         │
│  Next.js 16  │     │  REST API   │     │  JWT Sessions   │
└──────┬───────┘     └─────────────┘     └────────┬────────┘
       │                                          │
       │         ┌──────────────┐                 │
       ├────────▶│   Stripe     │                 │
       │         │  (Payments)  │                 │
       │         └──────────────┘                 │
       │                                          │
       │         ┌──────────────┐                 │
       └────────▶│   Spotify    │◀── Client Creds │
                 │  (Music API) │    (no user auth)
                 └──────────────┘
```

---

## Hosting — Vercel

### What

Next.js 16 deployed on Vercel's serverless platform in the `iad1` (US East / Virginia) region.

### Configuration (`vercel.json`)

```json
{
  "buildCommand": "next build",
  "installCommand": "npm install --legacy-peer-deps",
  "framework": "nextjs",
  "regions": ["iad1"],
  "crons": [
    { "path": "/api/push/reminder", "schedule": "0 18 * * *" },
    { "path": "/api/push/reminder", "schedule": "0 21 * * *" }
  ]
}
```

### Why Vercel

- **Zero-config Next.js hosting** — Vercel built Next.js; deployment is `git push` and done.
- **Serverless by default** — No servers to manage, auto-scales, pay for what you use.
- **Edge network** — Static assets served from CDN worldwide.
- **Built-in cron jobs** — Push notification reminders run at 6 PM and 9 PM UTC daily without a separate scheduler.
- **Preview deployments** — Every PR gets a live preview URL.
- **Free tier is generous** — More than enough for early-stage with < 100 users.

### Serverless considerations

- Each API route runs as an isolated serverless function. There's no persistent process.
- Database connections are opened per-request via Supabase's REST API (not a persistent pool), which is ideal for serverless.
- Rate limiting uses in-memory `Map` storage — this works because Vercel's serverless functions share memory within a single instance's lifetime, but resets across cold starts. Acceptable for current scale; Redis is the upgrade path.
- The Supabase client is lazily initialized (singleton per function instance) to avoid unnecessary connections on cold start.

---

## Database — Supabase (PostgreSQL)

### What

Managed PostgreSQL hosted on Supabase. We interact with it through **Supabase's JavaScript client** (REST API), not a direct connection pool or ORM at runtime.

### Why Supabase

- **Managed Postgres** — No database ops, automatic backups, dashboard for quick queries.
- **REST API** — The JS client talks to Supabase's PostgREST layer, which is ideal for serverless (no connection pool needed, no cold-start connection overhead).
- **Free tier** — 500 MB storage, 2 GB bandwidth, unlimited API requests. More than enough to start.
- **Service role key** — Allows server-side access that bypasses Row Level Security, which lets us enforce authorization at the application layer instead (explained below).
- **Prisma schema exists as documentation** — `prisma/schema.prisma` defines the schema as a reference, but Prisma is NOT used at runtime. All queries go through the Supabase JS client.

### Client Setup (`lib/supabase.ts`)

```typescript
import { createClient } from '@supabase/supabase-js'

let _supabase = null

export function getSupabase() {
  if (_supabase) return _supabase

  _supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,   // Server-side only, no browser sessions
      persistSession: false,     // Stateless — no session cookies
    },
  })

  return _supabase
}
```

**Key decisions:**
- **Lazy initialization** — Client is created on first use, not at module load, to avoid errors during build time when env vars may not be set.
- **Service role key** — Used instead of `anon` key because all access is server-side through API routes. The service role key bypasses RLS, and we enforce authorization in application code.
- **No session persistence** — This is a server-side client, not a browser client. No cookies, no refresh tokens, no session state.

### Security Model — Application-Layer Authorization (not RLS)

**We do NOT use Supabase Row Level Security (RLS).** Here's why:

Supabase RLS is designed for architectures where the *browser* talks directly to the database via the `anon` key. In that model, RLS policies are essential because they're the only thing between the user and the data.

SongBird uses a different architecture:

```
Browser → Next.js API Route (auth check) → Supabase (service role key)
         ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
         Authorization happens HERE, not in the database
```

Every API route:
1. **Authenticates** the request via Clerk (`auth()`)
2. **Maps** the Clerk user ID to a database user ID (`getUserIdFromClerk()`)
3. **Authorizes** by only querying data belonging to that user ID
4. **Returns** only permitted data

The browser **never** talks to Supabase directly. There is no client-side Supabase key. The `anon` key is not used or exposed.

This means:
- **Security is centralized** in API route logic, not scattered across RLS policies.
- **Easier to reason about** — you can read an API route top to bottom and see exactly what's allowed.
- **More flexible** — complex authorization logic (friends-of-friends, blocked users, premium checks) is easier to express in TypeScript than in PostgreSQL policies.
- **Testable** — Application-layer auth can be unit tested.

**Trade-off:** If a bug in an API route fails to check authorization, data could leak. RLS would be a safety net. This is an acceptable risk at current scale, and RLS can be added as defense-in-depth later.

### Database Patterns

- **Always use `.select()`** to limit returned fields — never `SELECT *`.
- **Never fetch `image`/`albumArt` in bulk queries** — base64 images are massive; use `excludeImages=true` or explicit field selection.
- **Unique constraints** enforce business rules: `[userId, date]` on entries (one song per day), `[senderId, receiverId]` on friend requests, `[entryId, userId]` on vibes.
- **Indexes** on `[userId, date]` for the most common query pattern (fetching a user's entries).

---

## Authentication — Clerk

### What

Clerk handles all user authentication: sign-up, sign-in, session management, JWT tokens, and user profile data.

### Why Clerk

- **Drop-in auth** — Pre-built sign-in/sign-up components, session management, JWT handling.
- **No password storage** — Clerk handles credentials; we never touch passwords.
- **Social login ready** — Google, Apple, etc. can be enabled with a toggle.
- **Middleware integration** — Protects routes at the edge before the API route even runs.
- **Free tier** — 10,000 MAUs, more than enough for launch.
- **Mobile-ready** — `@clerk/clerk-expo` for the React Native app uses the same auth system, same user accounts.

### How It Works

**Middleware (`middleware.ts`):**

```typescript
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'

const isPublicRoute = createRouteMatcher([
  '/home(.*)', '/sign-in(.*)', '/sign-up(.*)',
  '/join/(.*)', '/waitlist(.*)',
  '/api/webhooks(.*)', '/api/invites/validate(.*)', '/api/waitlist(.*)',
])

export default clerkMiddleware(async (auth, req) => {
  const { userId } = await auth()
  if (!userId && !isPublicRoute(req)) {
    // Redirect unauthenticated users to /home (or /waitlist if waitlist mode)
    return NextResponse.redirect(new URL('/home', req.url))
  }
})
```

- Runs on **every request** (except static files).
- **Public routes** are explicitly allowlisted — everything else requires auth.
- **Waitlist mode** — When `WAITLIST_MODE_ENABLED=true`, unauthenticated users without an invite code are redirected to `/waitlist` instead of `/home`.

**API Route Auth Pattern:**

```typescript
export async function GET(request: Request) {
  // 1. Authenticate — get Clerk user ID from session token
  const { userId: clerkUserId } = await auth()
  if (!clerkUserId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // 2. Rate limit — prevent abuse
  const rateLimit = await checkRateLimit(clerkUserId, 'READ')
  if (!rateLimit.allowed) return rateLimit.response!

  // 3. Map to database — Clerk ID → database user ID
  const userId = await getUserIdFromClerk(clerkUserId)
  if (!userId) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }

  // 4. Query data scoped to this user
  const { data } = await getSupabase()
    .from('entries')
    .select('id, date, songTitle, artist')
    .eq('userId', userId)
}
```

**Every single protected API route** follows this exact pattern. No exceptions.

### Clerk ↔ Database Sync (`lib/clerk-sync.ts`)

Clerk and our database are separate systems. `getUserIdFromClerk()` bridges them:

1. Check **in-memory cache** (5-minute TTL) for the Clerk ID → DB user ID mapping.
2. **Query Supabase** by `clerkId` or `id` field.
3. If not found, **query by email** (handles users created before Clerk migration).
4. If still not found, **create a new user** in the database with the Clerk user's info.
5. Cache the result for 5 minutes.

This handles:
- New user sign-ups (auto-creates DB user)
- Legacy users who existed before Clerk (links by email)
- Concurrent user creation (handles `23505` unique constraint violations gracefully)

---

## Payments — Stripe

### What

Stripe handles all payment processing: checkout sessions, subscriptions, and one-time payments.

### Why Stripe

- **Industry standard** — Battle-tested, PCI compliant, handles everything.
- **Checkout Sessions** — Stripe-hosted payment pages, so we never touch card numbers.
- **Webhook-driven** — Payment state syncs to our database via signed webhooks.
- **Conditionally initialized** — If `STRIPE_SECRET_KEY` isn't set, Stripe features are simply disabled. The app works fine without payments.

### Pricing Tiers

| Tier | Price | Mode | Description |
|------|-------|------|-------------|
| Monthly | $2.99/mo | Subscription | Standard premium |
| Founding Flock Yearly | $29.99/yr | Subscription | Early supporter annual |
| Founding Flock Special | $39.99 | One-time | Lifetime early supporter |

### Security: Webhook Signature Verification

Stripe webhooks are the only way payment status updates our database. The webhook endpoint at `/api/webhooks/stripe`:

1. **Reads the raw request body** (not parsed JSON).
2. **Verifies the signature** using `STRIPE_WEBHOOK_SECRET` — this proves the request actually came from Stripe, not an attacker.
3. **Processes the event** (update user premium status, create notifications).
4. **No Clerk auth required** — Webhook endpoints are public by design; the signature IS the auth.

Events handled:
- `checkout.session.completed` — Payment successful
- `customer.subscription.created/updated/deleted` — Subscription lifecycle
- `invoice.payment_succeeded/failed` — Recurring payment status

### Metadata Flow

Every checkout session includes `userId` and `clerkUserId` in its metadata. When the webhook fires, we use this metadata to update the correct user in our database without needing to maintain a separate Stripe ↔ User mapping table.

---

## Music API — Spotify

### What

Spotify's Web API provides song search functionality. Users search for a track, and we return results with metadata (title, artist, album art, duration, popularity, etc.).

### Why Spotify (and not Apple Music too)

- **~30% market share** — Largest streaming platform.
- **Best API for search** — Client Credentials flow means no user login required just to search.
- **One integration done well > two done poorly** — Solo founder bandwidth is limited. Apple Music can be added later as a premium feature if demand warrants it.

### How It Works

- **Client Credentials Grant** — We authenticate as an *application*, not as a user. No Spotify login needed.
- **Search only** — We don't access user playlists, listening history, or any personal data. Just track search.
- **Token per request** — Currently fetches a new access token on each search request. Could be cached (tokens last 1 hour), but search volume is low enough that this isn't a bottleneck.
- **Rate limited** — Search endpoint uses `SEARCH` rate limit type (20 requests/minute per user).

### Avatar Storage

Profile images live in the public `avatars` Supabase Storage bucket (`{userId}.{ext}`), NOT as base64 in `users.image` — that column holds the storage URL. Uploads go through `POST /api/profile/avatar` (base64 data URI in, URL out, 2MB decoded cap); clients downscale to 512px before upload. `PUT /api/profile` rejects `data:image` URIs. Existing base64 rows were migrated via `scripts/migrate-avatars-to-storage.ts` (dry-run by default, `--apply` to run).

---

## Payments — RevenueCat (iOS In-App Purchases)

Apple requires digital goods purchased inside the iOS app to use In-App Purchase. RevenueCat wraps StoreKit and reports purchase events to `POST /api/webhooks/revenuecat`, which syncs premium status with the same semantics as the Stripe webhook (founding products grant lifetime access; `EXPIRATION` revokes non-founding premium; `CANCELLATION` waits for expiry).

- **Auth**: RevenueCat sends a configured value as the `Authorization` header; must equal `REVENUECAT_WEBHOOK_AUTH`. Unset = endpoint no-ops.
- **User mapping**: the mobile app must call `Purchases.logIn(<Clerk user ID>)` so `app_user_id` maps to a database user via `getUserIdFromClerk`.
- **Founding detection**: product IDs containing `founding` grant `isFoundingMember`.
- Stripe remains the payment path for web; RevenueCat is iOS-only.

---

## Rate Limiting

### Implementation (`lib/rate-limit.ts`)

Sliding window algorithm with in-memory storage:

| Type | Limit | Window | Used For |
|------|-------|--------|----------|
| AUTH | 10/min | 60s | Authentication endpoints |
| READ | 100/min | 60s | GET requests |
| WRITE | 30/min | 60s | POST, PUT, DELETE |
| SEARCH | 20/min | 60s | Spotify search |

### How It Works

- **Per-user** — Keyed by Clerk user ID (or `'anonymous'` for unauthenticated endpoints).
- **Sliding window** — Tracks timestamps of recent requests; removes expired ones on each check.
- **Standard headers** — Returns `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`, and `Retry-After` headers.
- **429 responses** — Returns proper `Too Many Requests` with `Retry-After` when exceeded.
- **Cleanup** — Background interval purges stale entries every 5 minutes.

### Limitations & Upgrade Path

In-memory rate limiting resets on cold starts and isn't shared across serverless instances. This is fine for current scale (< 100 users). The upgrade path is Redis (Upstash) for distributed rate limiting if we hit multi-instance deployments.

---

## User Safety — Blocking & Reporting

### Blocking (`lib/blocking.ts`)

- **Bidirectional checks** — `getBlockStatus()` checks both directions (did A block B? did B block A?).
- **Feed filtering** — Blocked users are excluded from social feeds, friend suggestions, and search results.
- **Immediate** — Blocking takes effect instantly; no moderation queue.

### Reporting

- **Reports table** — Stores reporter ID, report type (user/content), reason, and status.
- **Doesn't auto-act** — Reports are logged for manual review. No automated content removal.

---

## Push Notifications

- **Web Push** via `web-push` library using VAPID keys.
- **Subscription storage** — `push_subscriptions` table stores per-user push endpoints.
- **Cron-triggered** — Vercel cron jobs hit `/api/push/reminder` at 6 PM and 9 PM UTC daily.
- **Notification preferences** — Users can toggle: vibes, comments, mentions, friend requests, "On This Day" reminders.

---

## Environment Variables

### Required

| Variable | Service | Description |
|----------|---------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase | Project URL (`https://[ref].supabase.co`) |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase | Server-side key (bypasses RLS) |
| `DATABASE_URL` | Supabase | PostgreSQL connection string (for migrations) |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk | Public key (client-side) |
| `CLERK_SECRET_KEY` | Clerk | Secret key (server-side) |
| `SPOTIPY_CLIENT_ID` | Spotify | API client ID |
| `SPOTIPY_CLIENT_SECRET` | Spotify | API client secret |

### Optional (features degrade gracefully without these)

| Variable | Service | Description |
|----------|---------|-------------|
| `STRIPE_SECRET_KEY` | Stripe | Enables payment features |
| `STRIPE_WEBHOOK_SECRET` | Stripe | Webhook signature verification |
| `STRIPE_MONTHLY_PRICE_ID` | Stripe | Monthly subscription price |
| `STRIPE_FOUNDING_FLOCK_SPECIAL_PRICE_ID` | Stripe | One-time founding price |
| `STRIPE_FOUNDING_FLOCK_YEARLY_PRICE_ID` | Stripe | Yearly founding price |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | Push | Push notification public key |
| `VAPID_PRIVATE_KEY` | Push | Push notification private key |
| `WAITLIST_MODE_ENABLED` | App | Enables waitlist gate |
| `NEXT_PUBLIC_APP_URL` | App | Canonical app URL |

### Important

- All secrets go in `.env.local` (gitignored) for local dev and in Vercel's environment variable dashboard for production.
- `NEXT_PUBLIC_*` variables are exposed to the browser — only put non-secret values there.
- **Restart the dev server** after changing any environment variable.

---

## Security Summary

| Layer | Mechanism | What It Protects |
|-------|-----------|-----------------|
| **Edge** | Clerk middleware | Unauthenticated users can't reach protected routes |
| **API Routes** | `auth()` + `getUserIdFromClerk()` | Every request is authenticated and mapped to a DB user |
| **Rate Limiting** | Sliding window per-user | Prevents brute force and abuse |
| **Data Scoping** | `userId` in every query | Users can only access their own data |
| **Friend Checks** | `getFriendIds()` filtering | Social data limited to accepted friends |
| **Block System** | Bidirectional block checks | Blocked users are invisible to each other |
| **Payments** | Stripe webhook signatures | Payment events are cryptographically verified |
| **Secrets** | `.env.local` + Vercel env vars | No secrets in code or client bundles |
| **Input Validation** | Zod schemas (select routes) | Prevents malformed data |

### What we DON'T do (and why)

- **No RLS** — Security is enforced at the API layer. Browser never touches Supabase directly. (See detailed explanation above.)
- **No WAF** — Vercel provides basic DDoS protection. A dedicated WAF isn't needed at this scale.
- **No Redis rate limiting** — In-memory is sufficient for < 100 users on serverless.
- **No end-to-end encryption** — Notes are personal journal entries stored server-side, not messages between users. Standard TLS in transit + encryption at rest (Supabase default) is sufficient.

---

## Architecture Decisions Log

| Decision | Chose | Over | Why |
|----------|-------|------|-----|
| Hosting | Vercel | AWS/Railway/Fly | Zero-config Next.js, free tier, preview deploys |
| Database | Supabase (REST) | PlanetScale, Neon, direct PG | REST API avoids connection pooling issues in serverless; generous free tier |
| ORM | None (Supabase JS) | Prisma, Drizzle | Fewer dependencies, no cold-start overhead, simpler debugging |
| Auth | Clerk | NextAuth, Supabase Auth, Auth0 | Best DX, pre-built components, mobile SDK, free to 10K MAUs |
| Payments | Stripe | Lemon Squeezy, Paddle | Industry standard, best docs, conditional initialization |
| Music API | Spotify only | Spotify + Apple Music | Ship one integration well; add Apple Music later if users request it |
| Auth model | App-layer (service key) | Supabase RLS | More flexible, easier to reason about, testable |
| Rate limiting | In-memory | Redis (Upstash) | Good enough for current scale; upgrade path is clear |
| Region | US East (iad1) | Multi-region | Most users are US-based; latency is acceptable |

---

*Last updated: February 2026*
