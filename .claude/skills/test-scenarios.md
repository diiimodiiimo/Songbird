# /test-scenarios

Generate comprehensive test scenarios for a feature or component. Act like a QA engineer who thinks about edge cases and user behaviors.

## Test Coverage Areas

### Happy Path
- Expected user flow works correctly
- All success states display properly
- Data is saved/retrieved correctly

### Error Handling
- Network errors handled gracefully
- Invalid input rejected with helpful message
- Server errors don't crash the app

### Edge Cases
- Empty states (no data)
- Single item
- Maximum items/limits
- Boundary values (dates, numbers)

### User Variations
- New user (no history)
- Power user (lots of data)
- User with special characters in data

### Authentication States
- Logged out user
- Session expired
- Clerk sync issues

## SongBird-Specific Scenarios

### Entry Management
- [ ] Add entry for today (first time)
- [ ] Add entry for today (replacing existing)
- [ ] Add entry for past date
- [ ] Add entry with long notes (character limit)
- [ ] Add entry with special characters (emojis, unicode)
- [ ] View entry with missing album art
- [ ] Edit existing entry
- [ ] Delete entry

### Song Search
- [ ] Search returns results
- [ ] Search with no results
- [ ] Search with special characters
- [ ] Search rate limit handling
- [ ] Select song from results
- [ ] Spotify API error handling

### Social Features
- [ ] View friend's entries
- [ ] Tag friend in entry
- [ ] Mention user in notes
- [ ] Send friend request
- [ ] Accept friend request
- [ ] Decline friend request
- [ ] Block user (if implemented)

### Feed
- [ ] Feed with entries
- [ ] Empty feed (no friends)
- [ ] Feed pagination (many entries)
- [ ] Feed refresh after new entry

### Analytics
- [ ] Analytics with data
- [ ] Analytics with no entries
- [ ] Time filter changes
- [ ] Artist/song ranking ties

### On This Day
- [ ] Has memories for today
- [ ] No memories for today
- [ ] Memory from 1 year ago
- [ ] Multiple memories (different years)

### Wrapped
- [ ] Year with entries
- [ ] Year with insufficient entries
- [ ] Year boundary (Jan 1 vs Dec 31)

## Test Scenario Template

### Scenario: [Name]

**Given:** Initial state/preconditions
**When:** User action(s)
**Then:** Expected result

**Example:**
```
Scenario: Add entry for today

Given: User is logged in and has no entry for today
When: User searches for "Yesterday" by Beatles
  And: User selects the song
  And: User adds notes "Great song for a rainy day"
  And: User clicks "Save Entry"
Then: Entry is saved successfully
  And: "Today" tab shows the new entry
  And: User sees success message
```

## API Test Scenarios

### GET Endpoint
- [ ] Returns data for authenticated user
- [ ] Returns 401 for unauthenticated request
- [ ] Returns empty array when no data
- [ ] Pagination works correctly
- [ ] Filters work correctly

### POST Endpoint
- [ ] Creates resource with valid data
- [ ] Returns 400 for invalid data
- [ ] Returns 401 for unauthenticated request
- [ ] Handles duplicate prevention (unique constraints)
- [ ] Returns created resource

### PUT/PATCH Endpoint
- [ ] Updates resource with valid data
- [ ] Returns 404 for non-existent resource
- [ ] Returns 403 when updating others' data
- [ ] Partial updates work correctly

### DELETE Endpoint
- [ ] Deletes owned resource
- [ ] Returns 403 for others' resources
- [ ] Returns 404 for non-existent resource
- [ ] Cascading deletes work correctly

## Manual Testing Checklist

### Before Deploying
- [ ] All happy paths work
- [ ] Error messages are user-friendly
- [ ] Loading states appear correctly
- [ ] Mobile responsive
- [ ] Keyboard navigation works
- [ ] Data persists correctly

### Browser Testing
- [ ] Chrome
- [ ] Firefox
- [ ] Safari
- [ ] Mobile browsers

## Output Format

### Feature: [Name]

**Critical Scenarios** (must pass):
1. Scenario name - brief description
2. ...

**Important Scenarios** (should pass):
1. ...

**Edge Cases** (nice to test):
1. ...

**Not Testing** (out of scope):
1. ...

For each scenario, provide:
- Steps to reproduce
- Expected outcome
- Data requirements (if any)



