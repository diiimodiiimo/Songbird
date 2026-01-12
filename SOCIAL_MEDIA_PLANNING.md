# Social Media Features - Planning Questions

## 1. User Profiles & Discovery

### Profile Display
- [ ] What should a user's profile page show?
  - All their SOTD entries?
  - Just recent entries?
  - Statistics (total entries, top artists, etc.)?
  - Bio/about section?
  - Profile picture?
  - Join date?

### User Discovery
- [ ] How should users find other users?
  - Search by email?
  - Search by username/name?
  - Browse all users?
  - Suggested users based on similar music taste?
  - Invite friends via email?

### Privacy Settings
- [ ] Should profiles be:
  - Public (anyone can view)?
  - Private (only approved followers can view)?
  - Friends-only (mutual following required)?

---

## 2. Tagging System

### Current Implementation
- ✅ We have `EntryTag` model that links users to entries
- ✅ Users can tag others when creating entries

### Questions to Answer
- [ ] What does "tagging" mean in this context?
  - Option A: Tag someone to notify them about a song/day
  - Option B: Tag someone to associate them with the song/day (like "this reminds me of X")
  - Option C: Tag someone to share the entry with them
  - Option D: All of the above?

- [ ] When someone is tagged:
  - Should they get a notification?
  - Should the entry appear in their feed?
  - Should they be able to see it on their profile?
  - Can they untag themselves?

- [ ] Tag visibility:
  - Who can see who is tagged?
  - Should tags be visible on the entry?
  - Should there be a "tagged in" section on user profiles?

- [ ] Tag permissions:
  - Can anyone tag anyone?
  - Only friends/followers?
  - Can users block being tagged by certain people?

---

## 3. Social Feed

### Feed Structure
- [ ] Should there be a social feed?
  - If yes, what should it show?
    - Entries from people you follow?
    - Entries where you're tagged?
    - Entries from friends?
    - All public entries?

- [ ] Feed ordering:
  - Chronological (newest first)?
  - Algorithm-based (most relevant first)?
  - By date of the entry (not creation date)?

- [ ] Feed filters:
  - Filter by date range?
  - Filter by artist?
  - Filter by user?

---

## 4. Following/Friends System

### Relationship Model
- [ ] Should we have:
  - One-way following (like Twitter/Instagram)?
  - Two-way friendships (like Facebook)?
  - Both options?

- [ ] Friend requests:
  - Should there be friend requests that need approval?
  - Or can anyone follow anyone (if profile is public)?

- [ ] Following limits:
  - Any limits on number of followers/following?
  - Blocking functionality?

---

## 5. "Historically Today" - Social Version

### Current Feature
- ✅ Users can see their own historical entries for a specific date (e.g., "what was my SOTD on Dec 22 last year?")

### Social Questions
- [ ] Should users be able to see friends' "Historically Today"?
  - View all friends' entries for a specific date?
  - Compare your entry vs friends' entries for the same date?
  - See who else had the same song on the same date in different years?

- [ ] Privacy:
  - Should this be opt-in only?
  - Should users control which dates are visible to friends?

---

## 6. Notifications

### Notification Types
- [ ] What should trigger notifications?
  - Someone tags you in an entry?
  - Someone follows you?
  - Someone comments on your entry?
  - Friend adds a new entry?
  - Someone likes/reacts to your entry?

- [ ] Notification delivery:
  - In-app notifications?
  - Email notifications?
  - Push notifications (future)?
  - Notification preferences/settings?

---

## 7. Interactions & Engagement

### Comments
- [ ] Should entries have comments?
  - Who can comment (anyone, followers only, friends only)?
  - Can you comment on your own entries?
  - Can you delete comments?

### Reactions/Likes
- [ ] Should there be reactions/likes on entries?
  - Simple like button?
  - Multiple reaction types (like, love, relate, etc.)?
  - Who can see who liked an entry?

### Sharing
- [ ] Should users be able to:
  - Share entries externally (copy link, social media)?
  - Repost/reshare entries from others?
  - Create playlists from entries?

---

## 8. Search & Discovery

### Search Features
- [ ] What should be searchable?
  - Songs/artists?
  - Users?
  - Entries by date?
  - Entries by notes/keywords?

### Discovery
- [ ] How should users discover content?
  - Trending songs/artists?
  - Popular entries?
  - Similar music taste recommendations?
  - "People who liked this also liked..."?

---

## 9. Data & Privacy

### Data Sharing
- [ ] What data should be visible to others?
  - Entry dates?
  - Notes (private vs public)?
  - Statistics/analytics?
  - Listening history patterns?

### Data Export
- [ ] Should users be able to:
  - Export their data?
  - Download their entries?
  - Delete their account and all data?

---

## 10. Technical Implementation Priorities

### Phase 1 (MVP - Minimum Viable Product)
- [ ] What are the core features we need first?
  - User profiles?
  - Basic tagging?
  - Following system?
  - Simple feed?

### Phase 2 (Enhanced Features)
- [ ] What comes next?
  - Notifications?
  - Comments/reactions?
  - Advanced discovery?

### Phase 3 (Future Enhancements)
- [ ] What's nice-to-have?
  - Playlists?
  - Groups/communities?
  - Music recommendations?
  - Integration with Spotify playlists?

---

## 11. UI/UX Questions

### Navigation
- [ ] Where should social features live?
  - Separate "Social" tab?
  - Integrated into existing tabs?
  - New "Feed" page?

### Entry Display
- [ ] How should entries look in social context?
  - Show who created it?
  - Show who's tagged?
  - Show likes/comments count?
  - Show interaction buttons?

### Profile Pages
- [ ] What should profile pages look like?
  - Grid view of entries?
  - List view?
  - Calendar view?
  - Statistics dashboard?

---

## 12. Business/Product Questions

### Monetization (Future)
- [ ] Any plans for:
  - Premium features?
  - Advertisements?
  - Partnerships?

### Growth
- [ ] How should the app grow?
  - Invite-only beta?
  - Public signup?
  - Referral system?

---

## Next Steps

1. **Review this list together** - prioritize what matters most
2. **Make decisions** - answer the questions for MVP
3. **Design the data model** - update Prisma schema if needed
4. **Build incrementally** - start with core features, add more later
5. **Test with real users** - get feedback and iterate





