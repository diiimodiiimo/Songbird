# /feature-plan

Help plan and scope a new feature for SongBird. Act like a product engineer who balances user value with development effort.

## Feature Analysis Framework

### 1. User Value Assessment
- **Who benefits?** (existing users, new users, power users)
- **What problem does it solve?**
- **How often will it be used?** (daily, weekly, occasionally)
- **Does it align with core value prop?** ("Remember your life through music")

### 2. Scope Definition

#### MVP (Minimum Viable)
- What's the simplest version that delivers value?
- Can we ship in 1-2 days?
- What can we defer to v2?

#### Full Vision
- What does the complete feature look like?
- What are the nice-to-haves?
- What's the maintenance burden?

### 3. Technical Assessment

#### Frontend Changes
- New components needed?
- Existing components to modify?
- New routes/pages?
- State management needs?

#### Backend Changes
- New API routes?
- Database schema changes?
- Third-party integrations?
- Performance considerations?

#### Database Impact
- New models or fields?
- Migration complexity?
- Index requirements?
- Data volume considerations?

### 4. Risk Assessment

- **Breaking changes?** (affects existing data/features)
- **Performance impact?** (query complexity, response size)
- **Security implications?** (new attack surface)
- **Dependency additions?** (new packages)

### 5. Development Plan

#### Phase 1: Foundation
- Database schema changes
- Core API routes
- Basic UI

#### Phase 2: Core Experience
- Main user flows
- Error handling
- Loading states

#### Phase 3: Polish
- Edge cases
- Performance optimization
- Accessibility
- Documentation

## SongBird Feature Context

### Existing Patterns to Reuse
- Entry management (create, read, update, delete)
- Friend system (requests, permissions)
- Analytics aggregation
- Loading state pattern
- Design system components

### Planned Features (from roadmap)
1. Mood/vibe emoji tags
2. B-sides (additional songs)
3. Streaks (gamification)
4. Playlist generation
5. Notifications
6. Shareable Wrapped

### Constraints
- Solo developer (limited bandwidth)
- Bootstrap budget (minimal spending)
- Mobile-first design
- Vercel serverless limits
- Clerk authentication

## Output Format

### Feature: [Name]

**Summary:** One sentence description

**User Story:**
> As a [user type], I want to [action] so that [benefit].

**MVP Scope:**
- [ ] Feature 1
- [ ] Feature 2

**Deferred to v2:**
- Future enhancement 1
- Future enhancement 2

**Technical Plan:**

| Layer | Changes | Effort |
|-------|---------|--------|
| Database | ... | Low/Med/High |
| API | ... | Low/Med/High |
| Frontend | ... | Low/Med/High |

**Files to Create/Modify:**
- `path/to/file.ts` - Description

**Dependencies:**
- None / List packages

**Estimated Effort:** X hours/days

**Risks:**
- Risk 1 → Mitigation

**Success Criteria:**
- User can...
- System correctly...



