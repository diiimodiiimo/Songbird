# /test-scenarios

Generate comprehensive test scenarios for features and components. Act like a QA engineer.

## Test Categories

### 1. Happy Path
- Normal, expected user flows
- Valid inputs, successful operations

### 2. Edge Cases
- Boundary conditions
- Empty states, max values
- First-time vs returning users

### 3. Error Conditions
- Invalid inputs
- Network failures
- Auth failures

### 4. Security
- Unauthorized access attempts
- Data isolation
- Input manipulation

### 5. Performance
- Large datasets
- Concurrent operations
- Load testing

## Test Scenario Template

```markdown
## Feature: [Name]

### Happy Path
| Scenario | Steps | Expected Result |
|----------|-------|-----------------|
| [Name] | 1. Do X<br>2. Do Y | [Expected] |

### Edge Cases
| Scenario | Condition | Expected Result |
|----------|-----------|-----------------|
| [Name] | [Edge case] | [Expected] |

### Error Conditions
| Scenario | Trigger | Expected Result |
|----------|---------|-----------------|
| [Name] | [Error cause] | [Expected error handling] |

### Security
| Scenario | Attack Vector | Expected Result |
|----------|---------------|-----------------|
| [Name] | [Attack type] | [Expected protection] |
```

## SongBird Feature Examples

### Entry Creation

#### Happy Path
| Scenario | Steps | Expected |
|----------|-------|----------|
| Create entry | 1. Search song<br>2. Select song<br>3. Add notes<br>4. Submit | Entry saved, streak updated, UI refreshed |
| Edit entry | 1. Open today's entry<br>2. Search new song<br>3. Submit | Entry updated, notes preserved |

#### Edge Cases
| Scenario | Condition | Expected |
|----------|-----------|----------|
| Duplicate entry | User already has entry for today | Update existing entry, don't create new |
| Very long notes | Notes > 5000 chars | Truncate or show validation error |
| Empty search | Submit empty search | Show "Enter a song name" message |
| Special characters | Song with emojis/unicode | Handle correctly, display properly |
| Past date entry | Create entry for yesterday | Entry created with correct date (if allowed) |

#### Error Conditions
| Scenario | Trigger | Expected |
|----------|---------|----------|
| Network failure | API request fails | Show error message, allow retry |
| Spotify API down | Search returns 500 | Show fallback message, not blank results |
| Session expired | Auth token invalid | Redirect to login |

#### Security
| Scenario | Attack Vector | Expected |
|----------|---------------|----------|
| Cross-user access | Try to create entry for other user | Reject, 403 error |
| XSS in notes | Script tags in notes field | Sanitize/escape output |

---

### Friend Request

#### Happy Path
| Scenario | Steps | Expected |
|----------|-------|----------|
| Send request | 1. Search user<br>2. Click Add Friend | Request sent, pending shown |
| Accept request | 1. View notifications<br>2. Accept request | Friends added, feed access |
| Decline request | 1. View notifications<br>2. Decline | Request removed, no friendship |

#### Edge Cases
| Scenario | Condition | Expected |
|----------|-----------|----------|
| Already friends | Send request to friend | Show "Already friends" |
| Self-request | Try to add yourself | Prevent, show message |
| Pending request | Request already sent | Show "Request pending" |
| Max friends (free) | At 20 friends limit | Show upgrade prompt |

#### Security
| Scenario | Attack Vector | Expected |
|----------|---------------|----------|
| Blocked user request | Blocked user sends request | Silently reject |
| Request spam | Rapid-fire requests | Rate limit (30/min) |

---

### Streak System

#### Happy Path
| Scenario | Steps | Expected |
|----------|-------|----------|
| Continue streak | Log entry same day | Streak +1 |
| Freeze activates | Miss 1 day, have freeze | Streak preserved, freeze used |

#### Edge Cases
| Scenario | Condition | Expected |
|----------|-----------|----------|
| Timezone boundary | Entry at 11:59pm | Counts for current day |
| Server timezone | User in different TZ | Use user's local date |
| First entry | No previous entries | Streak starts at 1 |
| Backdated entry | Log for yesterday | Doesn't count (same-day rule) |

#### Error Conditions
| Scenario | Trigger | Expected |
|----------|---------|----------|
| Streak breaks | Miss 2+ days | Streak resets, offer restore |
| Restore limit | Used restore < 30 days ago | Show "Try again in X days" |

---

### Feed & Social

#### Happy Path
| Scenario | Steps | Expected |
|----------|-------|----------|
| View feed | Open Feed tab | Friends' entries shown |
| Vibe entry | Click vibe button | Vibe count +1, notification sent |
| Comment | Type comment, submit | Comment shown, notification sent |

#### Edge Cases
| Scenario | Condition | Expected |
|----------|-----------|----------|
| Empty feed | No friends | Show "Add friends" CTA |
| No entries | Friends have no entries | Show "Friends haven't posted" |
| Own entry | View own entry in feed | Don't show vibe button on self |

#### Security
| Scenario | Attack Vector | Expected |
|----------|---------------|----------|
| Non-friend access | Try to view non-friend entry | 403 or hidden |
| Blocked user | Blocked user's entries | Not shown in feed |
| Comment spam | Many comments rapidly | Rate limited |

## Generating Test Data

```typescript
// Test users
const testUsers = [
  { email: 'test@example.com', username: 'testuser' },
  { email: 'friend@example.com', username: 'friend1' },
]

// Test entries
const testEntries = [
  { date: today, songTitle: 'Test Song', artist: 'Test Artist' },
  { date: yesterday, songTitle: 'Yesterday Song', artist: 'Artist 2' },
]
```

## Manual Testing Checklist

### Before Release
- [ ] All happy paths work
- [ ] Key edge cases handled
- [ ] Error messages are helpful
- [ ] Loading states show correctly
- [ ] Mobile responsive
- [ ] Different browsers work
