# /feature-plan

Help plan and scope new features with structured breakdown. Act like a senior product engineer.

## Planning Framework

### 1. Define the Feature
- What problem does this solve?
- Who is the target user?
- What's the success metric?

### 2. Break Down Requirements
- User stories (As a user, I want to...)
- Acceptance criteria (The feature is complete when...)
- Edge cases to consider

### 3. Technical Design
- What files/components are affected?
- Database changes needed?
- API endpoints required?
- Third-party integrations?

### 4. Implementation Plan
- MVP (minimum viable product) scope
- Phase 2 enhancements
- Future considerations

### 5. Risk Assessment
- Technical challenges
- Dependencies
- Performance implications

## Feature Planning Template

```markdown
## Feature: [Name]

### Problem Statement
[What problem are we solving?]

### User Stories
1. As a [user type], I want to [action] so that [benefit]

### Acceptance Criteria
- [ ] [Criterion 1]
- [ ] [Criterion 2]
- [ ] [Criterion 3]

### Technical Requirements

#### Database Changes
```prisma
// New models or fields
```

#### API Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/feature | Fetch data |
| POST | /api/feature | Create data |

#### Components
- [ ] `FeatureComponent.tsx` - [Purpose]
- [ ] `FeatureModal.tsx` - [Purpose]

### Implementation Steps

#### Phase 1: MVP
1. [ ] Create database schema
2. [ ] Implement API endpoints
3. [ ] Build UI components
4. [ ] Add analytics tracking

#### Phase 2: Polish
1. [ ] Add loading states
2. [ ] Improve error handling
3. [ ] Add animations
4. [ ] Mobile optimization

### Edge Cases
- What if [scenario]?
- What happens when [edge case]?

### Dependencies
- Requires: [feature/change]
- Blocks: [other feature]

### Estimated Effort
- Backend: X hours
- Frontend: X hours
- Testing: X hours
- Total: X hours
```

## SongBird Feature Patterns

### Adding a New Tab
1. Create component in `components/[Tab]Tab.tsx`
2. Add to `Dashboard.tsx` navigation
3. Create API route in `app/api/[route]/route.ts`
4. Add analytics event tracking

### Adding a New Field to Entry
1. Update `prisma/schema.prisma`
2. Create migration in `migrations/`
3. Update API routes
4. Update `AddEntryTab.tsx` form
5. Update display components

### Adding a New Premium Feature
1. Define feature flag in `lib/premium.ts`
2. Check flag in relevant components
3. Add premium gate UI
4. Track usage in analytics

### Adding a New Notification Type
1. Add type to notification schema
2. Create trigger in relevant action
3. Add display in `Notifications.tsx`
4. Add preference in `NotificationSettings.tsx`

## Example: Adding "B-Sides" Feature

```markdown
## Feature: B-Sides (Multiple Songs Per Day)

### Problem Statement
Power users want to log multiple songs per day, not just one "main" song.

### User Stories
1. As a premium user, I want to add additional songs to my day
2. As a user, I want to mark one song as my "main" song

### Acceptance Criteria
- [ ] Premium users can add up to 3 additional "B-side" songs
- [ ] One song is always marked as the "main" song
- [ ] B-sides appear on the day view but not in On This Day
- [ ] B-sides don't affect streak (only main song does)

### Technical Requirements

#### Database Changes
```prisma
model Entry {
  isBSide Boolean @default(false)  // New field
  // ... existing fields
}
```

#### API Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/entries | Updated to support isBSide |
| GET | /api/entries | Filter by isBSide if needed |

#### Components
- [ ] Update `AddEntryTab.tsx` - Add B-side button
- [ ] Update `TodayTab.tsx` - Show B-sides section
- [ ] Create `BSideCard.tsx` - Smaller entry display

### Implementation Steps

#### Phase 1: MVP
1. [x] Add isBSide to schema
2. [ ] Update entries API
3. [ ] Add B-side UI in AddEntryTab
4. [ ] Display B-sides in TodayTab

#### Phase 2: Polish
1. [ ] Add swipe to add B-side
2. [ ] Animate B-side additions
3. [ ] B-side count limit

### Edge Cases
- What if user downgrades from premium? (Keep existing, can't add new)
- What if user tries to add 4th B-side? (Show limit message)

### Estimated Effort
- Backend: 2 hours
- Frontend: 4 hours
- Testing: 1 hour
- Total: 7 hours
```

## Questions to Ask

1. **Scope**: What's the minimum we can ship?
2. **Priority**: Is this more important than X?
3. **Dependencies**: What needs to exist first?
4. **Reversibility**: Can we easily change/remove this?
5. **Metrics**: How will we know if it's working?
