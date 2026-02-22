# SongBird Complete App Summary

**Purpose**: This document provides a comprehensive overview of the SongBird app for analysis, improvement suggestions, and gap identification.

---

## 1. What is SongBird?

SongBird is a **music journaling app** where users log one "Song of the Day" to remember their life through music. Think of it as a daily journal, but instead of writing entries, you pick a song that represents each day.

### Core Value Proposition
> "Remember your life through music" — SongBird connects songs to life moments, creating a musical autobiography over time.

### Target Users
- People who love music and want to document their lives
- Music-driven nostalgia seekers
- People who want a lighter journaling habit than full diary entries
- Social music sharers who want private-first sharing with friends

### Competitive Landscape
| App | What It Does | SongBird Difference |
|-----|--------------|---------------------|
| Last.fm | Auto-scrobbles listening history | SongBird is intentional (1 song/day), not passive |
| Daylio | Micro-journaling with mood tracking | SongBird centers music, not just mood |
| Spotify Wrapped | Year-end summary | SongBird gives this DAILY context + memories |
| Day One | Premium journal app | SongBird is music-first with social features |

---

## 2. Technical Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 14+ (App Router) |
| Language | TypeScript (strict) |
| Database | PostgreSQL with Prisma ORM |
| Auth | Clerk |
| Styling | Tailwind CSS with custom design system |
| Music API | Spotify Web API |
| Hosting | Vercel |

---

## 3. User Journey & Flows

### 3.1 New User Onboarding

```
Home Page → Sign Up (Clerk) → Username Setup Prompt → Dashboard
```

**Current Experience:**
1. User lands on `/home` with app branding and sign-in options
2. Clerk handles sign-up/sign-in
3. On first visit to Dashboard, a prompt asks user to set username
4. User redirected to `/profile/edit?setup=true` to set username

**Potential Gaps:**
- No tutorial or walkthrough of features
- No sample data to show what the app does
- Username setup is a modal prompt, not a dedicated onboarding flow
- No guidance on adding first song

---

### 3.2 Daily Song Entry Flow

This is the **core loop** of the app.

```
Open App → Today Tab → Tap Bird → Search Song → Add Notes/People → Save
```

**Detailed Steps:**

1. **Today Tab (Landing State)**
   - Shows current date with "How will we remember today?" prompt
   - Large, animated SongBird mascot to tap
   - Streak counter (if active) 🔥
   - "On This Day" memories from past years (if any exist)
   - Wrapped banner (seasonal)

2. **Add Entry Flow (After Tapping Bird)**
   - Date picker (defaults to today, can add past entries)
   - Song search input (searches Spotify API)
   - Select from search results (shows album art, artist)
   - **Add Notes**: Free-text journal entry for the day
   - **Tag People**: Add friends (app users) or custom names (non-users)
   - **Mention Friends**: Tag friends who will be notified
   - **Mood Picker** (optional): Select emoji mood (😊😌😢🔥😴🎉)
   - Save button

3. **After Saving**
   - Success message with SongBird animation
   - "Add B-side" prompt (not yet implemented)
   - Entry appears in history

**State Handling:**
- If entry exists for selected date: Shows "Entry exists" with option to update song (notes preserved)
- If no entry: Shows "No entry exists" prompt

**Key Actions:**
| Action | Description |
|--------|-------------|
| Search song | Queries Spotify API for tracks |
| Select date | Can log for any date (past or present) |
| Add notes | Free-text, no character limit shown |
| Tag people | Can tag friends OR custom names |
| Mention friends | Sends notification to mentioned users |
| Add mood | Optional emoji selection |
| Save | Creates/updates entry |

---

### 3.3 Navigation Structure

Bottom navigation with 6 main tabs:

```
Today | Memory | Feed | Aviary | Insights | Profile
```

| Tab | Primary Purpose |
|-----|-----------------|
| **Today** | Add today's song, see streak, On This Day memories |
| **Memory** | Browse "On This Day" for any date + recent entries |
| **Feed** | See friends' entries, vibe/comment |
| **Aviary** | Visual representation of your flock (you + friends as birds) |
| **Insights** | Analytics: top artists, songs, people; search by artist |
| **Profile** | User info, friends list, settings, vibed songs |

---

## 4. Tab-by-Tab Feature Breakdown

### 4.1 Today Tab

**Purpose**: Daily entry point, core action

**Features:**
- Current date display with streak counter
- Interactive SongBird mascot (animated, tappable)
- "On This Day" section showing entries from same date in past years
- Wrapped banner (promotional)
- Entry form (appears after tapping bird)

**Empty States:**
- No song logged: Bird + "Tap the songbird to log your song"
- No On This Day entries: Section hidden

---

### 4.2 Memory Tab

**Purpose**: Time travel through your musical history

**Features:**
- **On This Day**: Date picker to see entries from that date across all years
- **AI Insight**: GPT-generated reflection on On This Day entries (experimental)
- **Recent Days**: Last 14 entries in chronological order
- **Full Archive Link**: Opens `/archive` for complete history
- **Toggle Notes**: Show/hide notes in entry cards
- **People Tags**: Shows who was tagged on each entry

**Empty States:**
- No memories: SongBird illustration + "No memories from this day yet"
- No recent entries: "No recent entries yet"

---

### 4.3 Feed Tab

**Purpose**: Social discovery, see what friends are listening to

**Features:**
- Entries from all friends in reverse chronological order
- **Friend Header**: Prominent display of who posted, links to their profile
- **Song Card**: Album art, song title, artist, date
- **Vibe Button**: Heart/like system (toggle on/off)
- **Comment Button**: Expand to view/add comments
- **Listen on Spotify**: Opens track in Spotify
- **Mentions Display**: Shows if entry mentions other users

**Actions:**
| Action | Description |
|--------|-------------|
| Vibe | Toggle heart, count updates instantly |
| Comment | Inline comment input, appears below entry |
| View Profile | Click friend header to visit their profile |
| Listen | Opens Spotify track |

**Empty States:**
- No friends: SongBird + "Your flock is quiet" + "Find Friends" button
- Friends but no entries: "No entries from friends yet"

---

### 4.4 Aviary Tab

**Purpose**: Visual/social representation of your music community

**Features:**
- **Birds on Branches**: You and your friends represented as themed birds
- **Latest Song**: Each bird shows their most recent song
- **Theme Display**: Each user's bird matches their chosen theme
- **Tagged People**: Shows who was tagged in entries

**Empty States:**
- No friends: Shows only your bird
- Loading: Spinner + "Gathering the flock..."

---

### 4.5 Insights Tab

**Purpose**: Analytics and music patterns

**Sub-Navigation:**
```
Analytics | Wrapped | Leaderboard
```

#### Analytics Features:
- **Time Filter**: Last 4 Weeks / Last 6 Months / Calendar Year / All Time
- **Search by Artist**: Find all entries for a specific artist
- **Top Artists Podium**: Olympic-style 🥇🥈🥉 with artist images
- **Top Songs Podium**: Same style for songs
- **Top People**: Grid of most-tagged people

#### Wrapped Features (Admin-only currently):
- Year-end summary like Spotify Wrapped
- Card-based swipeable presentation
- Top artists by season
- Longest streak
- Returning artists
- Sentiment analysis (experimental)
- Interactive games

#### Leaderboard Features:
- Streak rankings among friends
- Entry count comparison

**Empty States:**
- No data: SongBird + "No insights yet" + prompt to start logging

---

### 4.6 Profile Tab

**Purpose**: User identity, settings, social connections

**Features:**
- **Profile Display**: Avatar, username, bio
- **Your Songbird**: Shows current theme bird
- **Stats Row**: Entry count, friends count, vibes count
- **Vibed Songs**: Expandable list of songs you've vibed
- **Favorite Artists/Songs**: User-set preferences
- **Friends List**: Expandable with links to profiles
- **Add Friend Modal**: Enter username to view profile

**Settings (Collapsible):**
- Theme Selector (10 bird themes)
- Email display (read-only)
- Sign Out button

**Actions:**
| Action | Description |
|--------|-------------|
| Edit Profile | Link to `/profile/edit` |
| View Friends | Toggle friends list |
| Add Friend | Open modal, search by username |
| Change Theme | Opens theme selector |
| View Vibes | Expand vibed songs section |
| Sign Out | Returns to home |

---

## 5. Database Schema (Key Models)

### User
```
id, email, username, clerkId, name, image, bio
favoriteArtists (JSON), favoriteSongs (JSON)
theme (default: "american-robin")
```

### Entry
```
id, date, userId
songTitle, artist, albumTitle, albumArt
durationMs, explicit, popularity, releaseDate
trackId, uri
notes
```
- **Unique constraint**: One entry per user per date

### Social Models
- **FriendRequest**: sender, receiver, status (pending/accepted/declined)
- **Mention**: Links entry to mentioned user, triggers notification
- **PersonReference**: Tags non-users by name
- **Vibe**: Heart/like on entries (entry + user, unique)
- **Comment**: Text comments on entries
- **Notification**: Tracks mentions, friend accepts, etc.

---

## 6. Social Features Deep Dive

### Friend System
- **Two-way friendships**: Request must be accepted
- **Discovery**: Search by username
- **Privacy**: Only friends see your entries in feed

### Engagement Features
| Feature | Description |
|---------|-------------|
| Vibes | Heart/like system on feed entries |
| Comments | Text comments on friend entries |
| Mentions | Tag friends in your entries (notifies them) |
| People Tags | Private tags for who you were with |

### Notifications
- Friend request received
- Friend request accepted
- Mentioned in entry
- (Push notifications supported via web push)

---

## 7. Personalization

### Themes
10 bird-themed color schemes:
1. American Robin (default) - warm rust orange
2. Northern Cardinal - vivid crimson
3. Eastern Bluebird - sky blue + peach
4. American Goldfinch - lemon yellow + olive
5. Baltimore Oriole - deep orange
6. Indigo Bunting - electric indigo/purple
7. House Finch - dusty rose
8. Cedar Waxwing - tan/buff + berry red
9. Black-capped Chickadee - gray + buff
10. Painted Bunting - rainbow gradient (premium?)

Each theme changes:
- Primary/accent colors
- Background tones
- Bird logo displayed

### Profile Customization
- Username
- Profile image (URL)
- Bio
- Favorite artists (tags)
- Favorite songs (cards)

---

## 8. Key User Actions Summary

| Action | Location | What Happens |
|--------|----------|--------------|
| Log song | Today tab | Search, select, add notes, save |
| View memories | Memory tab | See On This Day, browse history |
| View friends' songs | Feed tab | Scroll entries, vibe, comment |
| Vibe a song | Feed tab | Heart toggles, count updates |
| Comment | Feed tab | Add text, appears inline |
| Add friend | Profile tab | Enter username, visit profile, send request |
| Accept friend | Notifications | Request accepted, mutual friendship |
| View analytics | Insights tab | See top artists/songs/people |
| Change theme | Profile > Settings | Select bird theme |
| Edit profile | Profile tab | Update username, bio, favorites |

---

## 9. Current State & Known Limitations

### What Works Well
- Core entry flow is functional
- Social features (friends, feed, vibes, comments)
- Analytics with time filters
- Multiple themes
- On This Day memories
- Spotify integration for search

### Known Gaps / TODO Items

| Area | Gap |
|------|-----|
| **Onboarding** | No tutorial, no sample data, abrupt username prompt |
| **B-sides** | Prompted but not implemented (additional songs beyond main) |
| **Mood Tags** | UI exists but mood not saved to database |
| **Playlist Generation** | Planned but not implemented |
| **Push Notifications** | Infrastructure exists but minimal usage |
| **Wrapped** | Admin-only, not fully polished |
| **Export Data** | Not implemented |
| **Apple Music** | Spotify only currently |
| **Mobile App** | PWA only, no native apps |
| **Streaks** | Displayed but limited gamification |

### UI/UX Observations
- Today tab empty state relies on user knowing to tap bird
- Memory tab has two sections (On This Day + Recent) that could be clearer
- Feed is friends-only, no discovery of new users
- Aviary concept is unique but purpose may not be immediately clear
- Settings buried in collapsible section

---

## 10. Business Context

### Founder Situation
- Solo founder, side project
- Bootstrap budget
- Technical but using AI for development
- Has 4.5 years of personal data (~1,400 entries)
- Goal: 10 test users → App Store launch

### Proposed Monetization
**Free Tier:**
- 30 entries/month
- Basic analytics
- Friends + feed
- On This Day

**Pro Tier ($3/month or $24/year):**
- Unlimited entries
- Full analytics history
- Wrapped
- Playlist generation
- Custom themes
- Export data

---

## 11. Questions for Analysis

### User Experience
1. Is the entry flow intuitive for new users?
2. Is it clear what tapping the bird does?
3. How could onboarding be improved?
4. Is the tab structure optimal for the core use cases?
5. What friction points exist in the daily logging habit?

### Feature Gaps
1. What features are missing that would increase retention?
2. Should B-sides be prioritized?
3. Is mood tracking valuable enough to complete?
4. What would make Wrapped more shareable?

### Social & Growth
1. How do users discover and add friends?
2. What would encourage users to invite friends?
3. Is the Aviary concept clear and valuable?
4. How could the feed be more engaging?

### Monetization
1. Does the free/pro split make sense?
2. What features would users pay for?
3. Is $3/month the right price point?

### Technical
1. Are there performance bottlenecks?
2. Is the data model flexible enough?
3. What's missing for App Store readiness?

---

## 12. API Routes Summary

| Route | Methods | Purpose |
|-------|---------|---------|
| `/api/entries` | GET, POST | List and create entries |
| `/api/entries/[id]` | GET, PUT, DELETE | Single entry CRUD |
| `/api/songs/search` | GET | Search Spotify |
| `/api/analytics` | GET | User analytics (top artists/songs/people) |
| `/api/feed` | GET | Friends' entries |
| `/api/friends/list` | GET | Current friends |
| `/api/friends/requests` | GET, POST | Friend requests |
| `/api/vibes` | GET, POST | Vibe/unlike entries |
| `/api/comments` | GET, POST | Entry comments |
| `/api/notifications` | GET | User notifications |
| `/api/on-this-day` | GET | Entries for a date across years |
| `/api/wrapped` | GET | Year-end summary data |
| `/api/profile` | GET, PUT | User profile |
| `/api/aviary` | GET | Aviary visualization data |
| `/api/ai-insight` | POST | AI-generated memory insights |
| `/api/streak` | GET | Current streak count |
| `/api/today-data` | GET | Optimized single call for today tab data |

---

## 13. File Structure

```
sotd/
├── app/
│   ├── api/              # 25+ API routes
│   ├── home/             # Landing page
│   ├── archive/          # Full entry history
│   ├── aviary/           # Aviary page
│   ├── profile/edit/     # Profile editing
│   ├── user/[username]/  # Public profiles
│   ├── sign-in/          # Clerk sign-in
│   └── page.tsx          # Dashboard (main app)
├── components/
│   ├── Dashboard.tsx     # Main app shell
│   ├── AddEntryTab.tsx   # Today tab (entry form)
│   ├── MemoryTab.tsx     # Memory tab
│   ├── FeedTab.tsx       # Social feed
│   ├── AviaryTab.tsx     # Aviary visualization
│   ├── AnalyticsTab.tsx  # Insights/analytics
│   ├── ProfileTab.tsx    # User profile
│   ├── WrappedTab.tsx    # Year-end summary
│   └── [others]
├── lib/                  # Utilities (prisma, auth, spotify)
├── prisma/
│   └── schema.prisma     # Database schema
└── docs/                 # Documentation
```

---

## 14. Design System

### Colors (Default Theme)
- Background: `#1a1a1a` (deep charcoal)
- Surface: `#2a2a2a` (cards, panels)
- Text: `#f5f5f5` (warm white)
- Muted: `#a0a0a0` (secondary text)
- Accent: `#d2691e` (rust orange - CTAs)

### Typography
- Primary: Inter (clean, readable)
- Headings: Custom title font

### UI Patterns
- Loading states show before empty states
- Cards with rounded corners and subtle shadows
- Bottom navigation on all screens
- Responsive: Mobile-first with tablet/desktop adaptations

---

*This document is designed to give Claude comprehensive context for suggesting improvements, identifying gaps, and optimizing the SongBird app.*







