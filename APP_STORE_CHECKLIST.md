# SongBird App Store Readiness Checklist

## ✅ What Already Exists

### Legal Pages
- ✅ **Privacy Policy** - `/privacy` (comprehensive, GDPR/CCPA compliant)
- ✅ **Terms of Service** - `/terms` (exists in codebase)
- ✅ **Subscription Management** - `/settings/premium` (Stripe checkout page)

### User Management
- ✅ **Account Deletion** - Exists in ProfileTab (delete account modal)
- ✅ **Friend System** - Add/remove friends, friend requests

## ❌ Missing App Store Requirements

### 1. User Blocking/Reporting System
**Status:** NOT IMPLEMENTED
**Required for:** App Store approval (safety requirements)

**What's needed:**
- Block user functionality
- Report user/content functionality  
- Blocked users list in settings
- Prevent blocked users from seeing/interacting with you

**Files to create:**
- `app/api/users/[username]/block/route.ts` - Block/unblock endpoint
- `app/api/reports/route.ts` - Report user/content endpoint
- `components/BlockedUsers.tsx` - Manage blocked users UI
- Add "Block User" button to user profile pages

### 2. Subscription Management UI
**Status:** PARTIAL (checkout exists, management missing)
**Required for:** App Store (subscription apps must allow cancellation)

**What's needed:**
- View current subscription status
- Cancel subscription button
- Link to Stripe Customer Portal for management
- Subscription history

**Files to enhance:**
- `app/settings/premium/page.tsx` - Add "Manage Subscription" section
- Add Stripe Customer Portal link

### 3. Content Moderation
**Status:** NOT IMPLEMENTED
**Required for:** App Store (user-generated content)

**What's needed:**
- Report inappropriate content (songs, comments)
- Content moderation queue (for admin)
- Auto-hide reported content

**Files to create:**
- `app/api/reports/content/route.ts` - Report content endpoint
- `components/ReportModal.tsx` - Report UI component

### 4. App Store Metadata
**Status:** NEEDS PREPARATION
**Required for:** App Store submission

**What's needed:**
- App Store screenshots (various device sizes)
- App Store description
- Keywords for App Store search
- App Store preview video (optional)
- App icon (1024x1024)
- Privacy policy URL (you have this: `/privacy`)
- Support URL
- Marketing URL

## 📋 Quick Implementation Guide

### Priority 1: User Blocking (Critical for App Store)
```typescript
// Add to database schema (prisma/schema.prisma)
model BlockedUser {
  id        String   @id @default(cuid())
  blockerId String   // User who blocked
  blockedId String   // User who is blocked
  createdAt DateTime @default(now())
  
  blocker User @relation("Blocker", fields: [blockerId], references: [id])
  blocked User @relation("Blocked", fields: [blockedId], references: [id])
  
  @@unique([blockerId, blockedId])
  @@map("blocked_users")
}

// Add relation to User model
blockedUsers BlockedUser[] @relation("Blocker")
blockedBy    BlockedUser[] @relation("Blocked")
```

### Priority 2: Subscription Management
Add to `/settings/premium` page:
- Current subscription status display
- "Manage Subscription" button → Stripe Customer Portal
- "Cancel Subscription" option (if not founding member)

### Priority 3: Reporting System
Create report endpoints for:
- Reporting users (harassment, spam, etc.)
- Reporting content (inappropriate entries/comments)

## 🔗 App Store Connect Setup

### Required URLs
- **Privacy Policy:** `https://yourdomain.com/privacy` ✅
- **Terms of Service:** `https://yourdomain.com/terms` ✅
- **Support URL:** `https://yourdomain.com/support` (create this)
- **Marketing URL:** `https://yourdomain.com` ✅

### Subscription Configuration
- Set up subscription groups in App Store Connect
- Configure pricing tiers
- Set up subscription management (handled by Stripe)

## 📱 Where to Find These Features

### In Your App:
1. **Privacy Policy:** `/privacy` ✅
2. **Terms:** `/terms` ✅  
3. **Premium/Subscriptions:** `/settings/premium` ✅
4. **Profile Settings:** Dashboard → Profile tab
5. **Account Deletion:** Profile tab → Settings → Delete Account ✅

### Missing Features (Need to Build):
1. **Block User:** Add to user profile pages (`/user/[username]`)
2. **Report User:** Add to user profile pages
3. **Blocked Users List:** Add to Settings/Profile
4. **Subscription Management:** Enhance `/settings/premium`
5. **Content Reporting:** Add to feed entries and comments

## 🎯 Next Steps

1. **Implement user blocking** (highest priority for App Store)
2. **Add subscription management UI** (required for subscription apps)
3. **Create reporting system** (safety requirement)
4. **Prepare App Store assets** (screenshots, descriptions)
5. **Set up App Store Connect** (subscription configuration)

Would you like me to implement any of these missing features?



