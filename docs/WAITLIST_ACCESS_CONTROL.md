# Waitlist vs Current Users - Access Control

## Current Implementation

**The waitlist does NOT block current users.** Here's how it works:

### Waitlist Page (`/waitlist`)
- **Purpose**: Landing page for TikTok/social media campaigns
- **Function**: Collects email addresses for future launch
- **Access**: Public, anyone can visit and join
- **Does NOT**: Block or restrict any existing app functionality

### Current Users
- **Continue using the app normally** - no changes to their experience
- **Can still sign up** - waitlist is optional, not required
- **All features work** - waitlist is completely separate from app functionality

## How It Works

1. **Current State (Now)**:
   - App works normally for you and existing users
   - Waitlist page exists at `/waitlist` but doesn't affect app usage
   - Users can sign up directly without joining waitlist

2. **When You Start Posting on TikTok**:
   - Direct traffic to `/waitlist` page
   - Collect emails from interested users
   - App continues working for current users

3. **When Ready to Launch**:
   - Invite waitlist users via email (using `lib/email.ts`)
   - They can sign up and purchase Founding Flock
   - Current users continue using app normally

## Access Control Logic

The waitlist is **completely optional**:
- ✅ Users can sign up directly at `/home` or `/sign-up`
- ✅ Waitlist is just for collecting emails before launch
- ✅ No gatekeeping or restrictions
- ✅ Current users unaffected

## If You Want to Gate Access (Optional)

If you later want to restrict signups to waitlist users only, you would need to:

1. Add a check in signup flow to verify email is on waitlist
2. Add an environment variable like `REQUIRE_WAITLIST=true`
3. Show "Join Waitlist" instead of signup form if not on waitlist

**But this is NOT implemented** - current users have full access.

## Recommendation

**Keep it as-is** - the waitlist is just a marketing tool to collect emails. When you're ready to launch publicly, you can:
- Send invitation emails to waitlist users
- They sign up and get Founding Flock option
- Everyone else can also sign up normally

This gives you flexibility and doesn't disrupt current users.


