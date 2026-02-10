# SongBird Claude Code Skills

Custom skills for developing and maintaining SongBird. Reference these by name when working with Claude.

---

## Quick Reference

### Core Development
| Skill | Use For |
|-------|---------|
| `/security-check` | Find vulnerabilities, auth issues, data exposure |
| `/api-review` | Review API routes for best practices |
| `/ui-review` | Check UI/UX, design system compliance |
| `/component-review` | Review React components |
| `/database-check` | Schema, queries, performance |
| `/performance-audit` | Load times, rendering, optimization |
| `/code-review` | Full code review with categorized feedback |
| `/accessibility-check` | WCAG 2.1 AA compliance |

### Feature-Specific
| Skill | Use For |
|-------|---------|
| `/streak-system` | Streak logic, freezes, restores |
| `/bird-system` | Bird unlocks, themes, milestones |
| `/onboarding-flow` | Multi-step onboarding |
| `/analytics` | Event tracking, user properties |
| `/notifications` | Push, in-app, preferences |
| `/premium-system` | Stripe, Founding Flock, feature flags |
| `/invite-system` | Referrals, viral growth |
| `/waitlist-system` | Pre-launch signups |
| `/blocking-reporting` | User safety features |

### Integration & Platform
| Skill | Use For |
|-------|---------|
| `/spotify-integration` | Spotify API, search, attribution |
| `/mobile-app` | Expo/React Native development |
| `/remotion-video` | Wrapped video generation |
| `/app-store-prep` | App Store / Google Play submission |
| `/prisma-help` | Prisma ORM, schema, migrations |

### Workflow
| Skill | Use For |
|-------|---------|
| `/debug-issue` | Systematic debugging help |
| `/feature-plan` | Plan and scope new features |
| `/deploy-check` | Pre-deployment verification |
| `/refactor` | Code refactoring suggestions |
| `/test-scenarios` | Generate test cases |

---

## All Skills (27 total)

### `/security-check`
Penetration testing mindset. Find auth issues, data exposure, IDOR, rate limiting gaps, blocking system verification.

### `/api-review`
Review API routes for authentication, rate limiting, error handling, response format, analytics tracking.

### `/ui-review`
Check design system compliance, CSS variables, loading states, accessibility, SongBird aesthetic.

### `/component-review`
React best practices, hooks usage, state management, TypeScript patterns, loading state order.

### `/database-check`
Prisma schema, Supabase queries, indexes, N+1 prevention, data integrity, blocking filters.

### `/performance-audit`
Core Web Vitals, bundle size, query optimization, caching strategies, image optimization.

### `/code-review`
Full code review with blocking/non-blocking/suggestion categories. SongBird-specific patterns.

### `/accessibility-check`
WCAG 2.1 AA compliance, keyboard navigation, screen readers, color contrast, ARIA labels.

### `/streak-system`
Same-day entry rules, freeze logic (covers 1 missed day), restore limits (once per month), milestone tracking, bird unlocks.

### `/bird-system`
Bird unlocks via streaks/milestones, theme colors, avatar components, premium access.

### `/onboarding-flow`
18+ screen multi-step onboarding, step management, analytics tracking, skip handling.

### `/analytics`
Event tracking patterns (`trackEvent`), user properties, metrics queries, AnalyticsEvents constants.

### `/notifications`
Push notifications (Web Push API), in-app notifications, preferences, daily reminders.

### `/premium-system`
Stripe integration (currently disabled), Founding Flock, feature flags, subscription status.

### `/invite-system`
Invite link generation, referral tracking, auto-friending on signup, viral metrics.

### `/waitlist-system`
Pre-launch waitlist, email collection, referral codes, Founding Flock eligibility.

### `/blocking-reporting`
User blocks (hides from feed/profile), content reports, safety filtering, admin review.

### `/spotify-integration`
Spotify Web API, client credentials flow, token refresh, search, attribution requirements.

### `/mobile-app`
Expo Router, Clerk auth with SecureStore, API client, EAS Build, React Native patterns.

### `/remotion-video`
Wrapped video compositions, animations, useCurrentFrame, Sequence, rendering pipeline.

### `/app-store-prep`
App Store / Google Play requirements, screenshots, legal pages, submission checklist.

### `/prisma-help`
Schema definition, relations, indexes, migrations, Prisma vs Supabase client usage.

### `/debug-issue`
Systematic debugging framework, common issue categories, logging patterns, escalation path.

### `/feature-plan`
Feature planning template, MVP scoping, technical requirements, implementation steps.

### `/deploy-check`
Pre-deployment checklist, environment variables, build verification, post-deploy smoke tests.

### `/refactor`
Refactoring patterns (extract function, early return, etc.), when to refactor, checklist.

### `/test-scenarios`
Test scenario generation, happy path, edge cases, error conditions, security tests.

---

## Usage Examples

```
"Please /security-check this API route"

"Can you do a /ui-review of the Feed tab?"

"Help me with the /streak-system - freezes aren't working"

"I need to /debug-issue why notifications aren't sending"

"/feature-plan for adding B-sides feature"

"/deploy-check before I push to production"
```

## Adding New Skills

Create a new `.md` file in `.claude/skills/` with:
1. Clear purpose/trigger
2. Relevant code patterns  
3. File locations
4. Common issues
5. Output format

---

*Last updated: January 2026*
