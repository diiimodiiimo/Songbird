# Learnings Log

## 2026-07-07 — Feed pagination + polish batch
- Feed "loading more" loop: cursor format `isoDate:entryId` was parsed with split(':'), which chops ISO timestamps at the first colon → invalid date → filter dropped → same page returned forever (client dedupe hid it as an infinite spinner). Never use ':' as a separator next to ISO dates.
- Same-day entries share identical noon-UTC timestamps, so date-only cursors silently skip entries — cursor pagination on non-unique columns needs an id tie-breaker and a matching secondary ORDER BY.
- Skeleton loaders shaped like content beat "Loading..." text + bird for perceived speed; keep the bird for empty states, not loading states.

## 2026-07-07 — Bug fixes + design foundation
- "People don't save" root cause: Prisma `@default(cuid())` is client-side only — Supabase inserts without explicit `id` fail NOT NULL, and the code swallowed the error. The update route deleted people first, so every edit wiped them. Audit any table insert for missing `id` + unchecked error.
- WrappedTab (52KB) was orphaned — nothing imported it; the whole Wrapped feature was unreachable on web. Grep for imports before assuming a component ships.
- The "AI-generated look" was mostly one line: body font set to Crimson Text serif in globals.css. Font + placeholder sweep changes the feel more than any layout work.
- React error #310 lesson applied: new hooks always go above a component's early returns.
- Design direction locked with founder: music-forward + playful bird, refined consistent cards, Inter everywhere, full sweep approved.

> One entry per session/task. Hard cap: 10 lines per entry. Logbook, not homework.

## 2026-07-06 — Perf batch 2 (avatars, RevenueCat, Expo prep)
- users.image held 14.8 MB of base64 across just 12 users (one avatar was 4 MB) — bulk-query bloat confirmed; migrated to a public Supabase Storage bucket with zero failures.
- The Expo app typechecks clean and all ~44 API endpoints it calls exist on the server — "it never worked" was config (placeholder EAS/Clerk values) plus the middleware returning HTML redirects instead of JSON 401s.
- Self-provisioning storage buckets (create-on-first-upload) beats documenting a manual setup step.
- Pattern: when tightening an API contract (rejecting base64), grep every client including mobile/ for senders before shipping.

> One entry per session/task. Hard cap: 10 lines per entry. Logbook, not homework.

## 2026-07-06 — Perf batch 1 + Spotify API re-research
- Spotify Feb/Mar 2026 changes: dev-mode apps capped at 5 OAuth users, 1 client ID, owner needs Premium; search capped at 10 results; extended quota now requires a registered business with 250K MAU.
- Consequence: Spotify account linking is not launchable; history backfill must use the user-initiated GDPR data export (file upload), which needs no API.
- Slowness root cause was frontend architecture, not stack: all 5 tabs in one client bundle + full remount/refetch on every tab switch.
- Fix pattern that worked: next/dynamic per tab + keep visited tabs mounted (hidden attr) + React Query for caching — small diff, big perceived win.
- Root package.json had `expo` and remotion in prod deps; mobile/ is its own npm project, so root expo was pure dead weight.
