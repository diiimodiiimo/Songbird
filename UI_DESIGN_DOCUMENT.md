# SongBird UI Design Document
**Version 1.0 | Last Updated: 2024**

---

## Table of Contents
1. [Design Philosophy](#design-philosophy)
2. [Design System](#design-system)
3. [Typography](#typography)
4. [Color Palette](#color-palette)
5. [Spacing & Layout](#spacing--layout)
6. [Components & Patterns](#components--patterns)
7. [Page Roadmap](#page-roadmap)
8. [Transitions & Animations](#transitions--animations)
9. [Logo & Branding Assets](#logo--branding-assets)
10. [Design Gaps & Next Steps](#design-gaps--next-steps)

---

## Design Philosophy

### Core Concept
**"A robin on a branch at dawn: warm chest, cool surroundings, attentive, personal."**

SongBird is designed to feel like a personal, intimate music journal. The design should evoke:
- **Warmth**: Personal connection to music memories
- **Calm**: Peaceful, non-intrusive interface
- **Attention**: Focus on the music and memories
- **Intimacy**: Personal space for reflection

### Design Principles
1. **Content First**: Music and memories are the hero
2. **Minimal but Meaningful**: Every element serves a purpose
3. **Mobile-First**: Optimized for daily mobile use
4. **Accessible**: Clear contrast, readable fonts, keyboard navigation
5. **Emotional**: Design should enhance the emotional connection to music

---

## Design System

### Current Implementation Status
✅ **Implemented**: Core design system in `app/songbird.css`  
⚠️ **Partially Implemented**: Some components use older color system from `app/globals.css`  
❌ **Needs Alignment**: Tailwind config needs to match new design system

---

## Typography

### Font Stack

#### Primary Font (Body Text)
- **Font**: Inter (via Next.js Google Fonts)
- **Fallback**: `-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`
- **Usage**: Body text, buttons, UI elements
- **Why**: Clean, modern, highly readable at all sizes. Professional yet approachable.

#### Secondary Font (Headings & Titles)
- **Font**: Crimson Text (via Next.js Google Fonts)
- **Fallback**: `Georgia, "Times New Roman", serif`
- **Usage**: Page titles, song titles, headings (h1, h2, h3)
- **Why**: Elegant serif that adds warmth and personality. Creates contrast with body text while maintaining readability. Evokes the journal/memory aesthetic.

### Type Scale

```css
h1: 2rem (32px) - Page titles
h2: 1.5rem (24px) - Section headers
h3: 1.125rem (18px) - Subsection headers
Body: 1rem (16px) - Default text
Small: 0.875rem (14px) - Secondary text
Tiny: 0.75rem (12px) - Labels, captions
```

### Font Weights
- **400 (Regular)**: Default for body text and headings
- **600 (Semibold)**: Emphasized text, buttons
- **700 (Bold)**: Strong emphasis (rarely used)

### Line Heights
- **Headings**: 1.2-1.4 (tighter for impact)
- **Body**: 1.5 (comfortable reading)

### Letter Spacing
- **Headings**: -0.02em (slightly tighter for cohesion)
- **Body**: Normal

---

## Color Palette

### Primary Colors

#### Background (`--bg`)
- **Value**: `#1a1816`
- **RGB**: `rgb(26, 24, 22)`
- **Description**: Deep charcoal with warm undertone - almost black
- **Why**: Creates a calm, focused environment. The warm undertone prevents it from feeling cold or sterile. Provides strong contrast for content.

#### Surface (`--surface`)
- **Value**: `#2f2a26`
- **RGB**: `rgb(47, 42, 38)`
- **Description**: Subtle warm gray - lifted panels
- **Why**: Creates depth and hierarchy. Slightly warmer than pure gray to maintain the warm aesthetic. Used for cards, panels, and elevated content.

#### Text Primary (`--text`)
- **Value**: `#E3E1DB`
- **RGB**: `rgb(227, 225, 219)`
- **Description**: Feather cream - warm off-white
- **Why**: Soft, warm white that's easier on the eyes than pure white. Maintains high contrast while feeling more natural and less harsh.

#### Text Muted (`--muted`)
- **Value**: `#9A9D9A`
- **RGB**: `rgb(154, 157, 154)`
- **Description**: Soft ash gray - secondary text
- **Why**: Provides clear hierarchy for secondary information without being too dim. Maintains readability while de-emphasizing.

#### Accent (`--accent`)
- **Value**: `#B65A2A`
- **RGB**: `rgb(182, 90, 42)`
- **Description**: Deep rust orange - robin chest
- **Why**: The signature color. Warm, inviting, and distinctive. Represents the "robin's chest" - the warm, personal core of the app. High contrast for CTAs and important elements.

#### Accent Soft (`--accent-soft`)
- **Value**: `#C96A3A`
- **RGB**: `rgb(201, 106, 58)`
- **Description**: Soft burnt orange - hover states
- **Why**: Lighter variant for hover states and subtle interactions. Maintains warmth while providing visual feedback.

#### Border (`--border`)
- **Value**: `rgba(227, 225, 219, 0.1)`
- **Description**: Subtle border with 10% opacity
- **Why**: Very subtle borders that define edges without being harsh. Maintains the soft, calm aesthetic.

### Legacy Colors (To Be Migrated)
These colors exist in `app/globals.css` and `tailwind.config.js` but should be replaced:

- `--primary: #B65A2A` → Should map to `--accent`
- `--card: #2a2a2a` → Should map to `--surface`
- `--text-muted: #b0b0b0` → Should map to `--muted`
- `--warn-bg: #5c1d1d` → Needs new semantic color
- `--warn-text: #ffffff` → Should use `--text`

### Color Usage Guidelines

#### Backgrounds
- **Primary Background**: Use `--bg` for main app background
- **Card/Panel Background**: Use `--surface` for elevated content
- **Hover States**: Use `--surface` with slight opacity increase

#### Text
- **Primary Text**: Use `--text` for main content
- **Secondary Text**: Use `--muted` for less important info
- **Accent Text**: Use `--accent` for links, highlights, important info

#### Interactive Elements
- **Primary Buttons**: `--accent` background, `--bg` text
- **Secondary Buttons**: `--surface` background, `--text` text, `--accent` border
- **Hover States**: Use `--accent-soft` or increase opacity
- **Focus States**: `--accent` outline with 2px width

---

## Spacing & Layout

### Spacing Scale
The design system uses a minimal spacing scale:

```css
--pad-sm: 0.75rem (12px)  /* Small padding - tight spaces */
--pad-md: 1.25rem (20px)  /* Medium padding - standard spacing */
--pad-lg: 2rem (32px)     /* Large padding - generous spacing */
```

### Border Radius

```css
--radius-sm: 8px   /* Small elements, inputs */
--radius-lg: 16px  /* Cards, panels, large elements */
```

### Shadows

```css
--shadow-soft: 0 2px 12px rgba(0, 0, 0, 0.3)
```

**Why**: Single, subtle shadow. Creates depth without being heavy. Maintains the calm aesthetic.

### Layout Patterns

#### Container Widths
- **Mobile**: Full width with padding (`px-3 sm:px-4`)
- **Tablet**: Max-width containers (`max-w-2xl`, `max-w-3xl`)
- **Desktop**: Larger max-widths (`max-w-5xl`, `max-w-6xl`)

#### Grid Systems
- **Cards**: Responsive grid (`grid-cols-2 md:grid-cols-4`)
- **Feed**: Single column with max-width
- **Analytics**: Flexible layouts with podium-style rankings

---

## Components & Patterns

### Navigation

#### Top Navigation Bar
- **Location**: Fixed at top (via `Navigation.tsx`)
- **Background**: `--surface` with border-bottom
- **Content**: Logo, app name, notifications, user info, sign out
- **Height**: ~48-56px
- **Status**: ✅ Implemented

#### Bottom Navigation (Mobile)
- **Location**: Fixed at bottom
- **Background**: `--surface` with backdrop blur
- **Tabs**: Today, Feed, Memory, Insights, Profile (5 main tabs)
- **Icons**: Emoji + SongBird logo for Today tab
- **Active State**: `--accent` color, larger icon
- **Status**: ✅ Implemented

#### Desktop Sidebar (Future)
- **Status**: ❌ Not implemented
- **Planned**: Full sidebar with all 7 tabs (includes Wrapped, Leaderboard)

### Cards & Panels

#### Standard Card
```css
background: --surface
border-radius: --radius-lg
padding: --pad-md or --pad-lg
box-shadow: --shadow-soft
```

#### Album Art Cards
- **Aspect Ratio**: Enforced 1:1 (square)
- **Border Radius**: `--radius-lg`
- **Object Fit**: Cover
- **Status**: ✅ Implemented via CSS rules

### Buttons

#### Primary Button
- **Background**: `--accent`
- **Text**: `--bg` (dark)
- **Padding**: `px-6 py-3`
- **Border Radius**: `--radius-sm`
- **Hover**: `--accent-soft` or opacity change

#### Secondary Button
- **Background**: `--surface`
- **Text**: `--text`
- **Border**: `--accent` with opacity
- **Hover**: Background opacity increase

#### Icon Button
- **Padding**: `p-2`
- **Border Radius**: `--radius-sm`
- **Hover**: Background change

### Forms

#### Input Fields
- **Background**: `--surface` or `--bg`
- **Border**: `--border` or `--accent` on focus
- **Text**: `--text`
- **Padding**: `px-4 py-2` or `px-4 py-3`
- **Border Radius**: `--radius-sm`

#### Textarea
- Same styling as inputs
- **Min Height**: 4 rows

### Loading States

#### Loading Indicator
- **Text**: "Loading..." or "Loading [resource]..."
- **Color**: `--muted`
- **Position**: Centered
- **Pattern**: Show loading BEFORE empty state

#### Skeleton Loaders
- **Status**: ❌ Not implemented
- **Planned**: Animated skeleton cards for better perceived performance

### Empty States

#### Pattern
```tsx
{loading ? (
  <Loading />
) : data.length > 0 ? (
  <Content />
) : (
  <EmptyState />
)}
```

#### Empty State Design
- **Icon/Emoji**: Large, centered
- **Message**: Friendly, actionable
- **Color**: `--muted`
- **Status**: ✅ Implemented across components

---

## Page Roadmap

### 1. Homepage (Landing Page)
**Route**: `/home`  
**File**: `app/home/page.tsx`  
**Status**: ✅ Implemented

#### Purpose
Public-facing landing page for unauthenticated users.

#### Current Design
- Centered layout
- Large SongBird logo (200x200px) with pulse animation
- App name: "SongBird" (large, bold)
- Tagline: "Your personal music journal"
- Two CTAs: "Sign In" and "Sign Up"
- Background: `--bg`

#### Transitions Needed
- ❌ **Logo Animation**: Currently static with pulse. Needs:
  - Smooth entrance animation (fade + scale)
  - Optional: Gentle floating animation
  - Hover interaction
- ❌ **Button Hover States**: Need smooth color transitions
- ❌ **Page Load Animation**: Staggered entrance for elements

#### Design Improvements Needed
- ✅ Logo is good, but could use animation polish
- ❌ **Hero Section**: Could add subtle background pattern/texture
- ❌ **Social Proof**: Add testimonials or stats (future)
- ❌ **Feature Preview**: Add brief feature highlights (future)

---

### 2. Authentication Pages

#### Sign In Page
**Route**: `/sign-in` or `/auth/signin`  
**File**: `app/auth/signin/page.tsx` or `app/sign-in/[[...sign-in]]/page.tsx`  
**Status**: ✅ Implemented (Clerk integration)

#### Sign Up Page
**Route**: `/sign-up` or `/auth/signup`  
**File**: `app/auth/signup/page.tsx` or `app/sign-up/[[...sign-up]]/page.tsx`  
**Status**: ✅ Implemented (Clerk integration)

#### Purpose
User authentication via Clerk.

#### Current Design
- Clerk-provided UI components
- Matches app color scheme (likely)

#### Transitions Needed
- ❌ **Page Transition**: Smooth fade when navigating to/from auth
- ❌ **Success Animation**: After sign in/up, smooth transition to dashboard

#### Design Improvements Needed
- ✅ Clerk handles most UI
- ❌ **Custom Styling**: Ensure Clerk components match SongBird design system
- ❌ **Loading States**: Custom loading indicators during auth

---

### 3. Dashboard (Main App)
**Route**: `/` (root, authenticated)  
**File**: `components/Dashboard.tsx`  
**Status**: ✅ Implemented

#### Purpose
Main container for all app tabs. Handles tab navigation and routing.

#### Current Design
- Tab-based navigation
- Bottom nav on mobile (5 tabs)
- Content area with padding
- Sub-navigation for Insights tab (Analytics, Wrapped, Leaderboard)

#### Transitions Needed
- ❌ **Tab Switching**: Currently instant. Needs:
  - Slide animation (left/right based on tab order)
  - Fade transition
  - Content loading states
- ❌ **Sub-tab Switching**: Smooth transition between Analytics/Wrapped/Leaderboard

#### Design Improvements Needed
- ✅ Core structure is good
- ❌ **Desktop Sidebar**: Add full sidebar for desktop (currently only bottom nav)
- ❌ **Tab Indicators**: More prominent active state
- ❌ **Smooth Scrolling**: When switching tabs, scroll to top smoothly

---

### 4. Today Tab (Add Entry)
**Route**: Dashboard tab `today`  
**File**: `components/AddEntryTab.tsx`  
**Status**: ✅ Implemented

#### Purpose
Primary entry point for adding today's song. Shows current entry or empty state.

#### Current Design

##### Empty State (No Entry Yet)
- Date header (e.g., "Monday, January 15")
- Tagline: "How will we remember today?"
- Large clickable SongBird logo (144x144px)
  - Bounce animation
  - Hover: scale up, drop shadow
  - Click: Plays video (`movingbirdbrowon.mp4`), then shows form
- Subtitle: "No song yet" / "What song will hold today together?"
- CTA button: "Add today's song"
- Optional: "On This Day" teaser (past entries from same date)
- Optional: Wrapped banner

##### Entry Form (After Clicking Logo)
- Date picker (can select any date)
- Song search (Spotify integration)
- Track selection with album art
- People input (private tags)
- Friend mentions (notifications)
- Notes textarea
- Save button

##### Existing Entry View
- Shows current song with album art
- Edit button
- Notes display

#### Transitions Needed
- ✅ **Logo Click → Video**: Implemented
- ❌ **Video → Form**: Currently instant. Needs:
  - Smooth fade from video to form
  - Form slides up from bottom
- ❌ **Form Submission**: Success animation (flying bird, checkmark)
- ❌ **Entry Saved**: Smooth transition back to entry view
- ❌ **Date Change**: Smooth content update when changing date

#### Design Improvements Needed
- ✅ Logo interaction is good
- ❌ **Search Results**: Better visual hierarchy
- ❌ **Track Selection**: More prominent selection state
- ❌ **Form Validation**: Better error states
- ❌ **Success Feedback**: More celebratory animation

---

### 5. Feed Tab
**Route**: Dashboard tab `feed`  
**File**: `components/FeedTab.tsx`  
**Status**: ✅ Implemented

#### Purpose
Social feed showing friends' song entries. Displays entries from users you follow.

#### Current Design
- Header: "Friends Feed"
- Card-based feed
- Each card shows:
  - Friend header (avatar, name, date)
  - Album art (100x100px)
  - Song title and artist
  - Mentions (if any)
- Empty state: "No posts yet" message

#### Transitions Needed
- ❌ **Card Entrance**: Staggered fade-in for feed items
- ❌ **Infinite Scroll**: Smooth loading of more entries
- ❌ **Card Hover**: Subtle lift animation
- ❌ **Click to Profile**: Smooth navigation

#### Design Improvements Needed
- ✅ Core layout is good
- ❌ **Card Design**: More visual polish
- ❌ **Avatar Styling**: Consistent avatar design
- ❌ **Date Formatting**: More readable date display
- ❌ **Loading States**: Skeleton loaders for feed items
- ❌ **Pull to Refresh**: Mobile gesture support

---

### 6. Memory Tab (History)
**Route**: Dashboard tab `history`  
**File**: `components/MemoryTab.tsx`  
**Status**: ✅ Implemented

#### Purpose
Browse past entries. "On This Day" feature shows entries from the same date in previous years.

#### Current Design

##### On This Day Section
- Date picker (defaults to today)
- "Show notes" toggle
- AI Insight box (if entries exist)
- List of entries from selected date (across years)
- Each entry shows: year, album art, song title, artist, notes (optional), people tags

##### Recent Days Section
- Last 14 entries
- Compact card layout
- Link to full archive

#### Transitions Needed
- ❌ **Date Change**: Smooth content update when changing date
- ❌ **Entry Cards**: Fade-in animation
- ❌ **Notes Toggle**: Smooth show/hide of notes
- ❌ **Archive Link**: Smooth navigation

#### Design Improvements Needed
- ✅ Core functionality is good
- ❌ **Entry Cards**: More visual hierarchy
- ❌ **Year Badges**: More prominent year indicators
- ❌ **People Tags**: Better styling
- ❌ **AI Insight**: More prominent, styled box
- ❌ **Empty States**: More engaging empty state design

---

### 7. Insights Tab (Analytics)
**Route**: Dashboard tab `insights` → sub-tab `analytics`  
**File**: `components/AnalyticsTab.tsx`  
**Status**: ✅ Implemented

#### Purpose
Analytics and insights about music patterns. Top artists, top songs, people, artist search.

#### Current Design

##### Filter Bar
- Time period selector: "Last 4 Weeks", "Last 6 Months", "Calendar Year", "All Time"
- Pill-style buttons

##### Artist Search
- Search input
- Results show: artist name, song titles, dates, count

##### Top Artists
- Podium-style layout (1st, 2nd, 3rd place)
- Artist images (circular, fetched from API)
- Medal emojis (🥇🥈🥉)
- List view for 4th-9th place
- "View all" button if more than 9

##### Top Songs
- Same podium style as artists
- Album art instead of artist images
- List view for 4th-9th place

##### People in Your Days
- Grid layout (2-4 columns)
- Avatar cards with initials
- Name and count

#### Transitions Needed
- ❌ **Filter Change**: Smooth data update when changing time period
- ❌ **Podium Animation**: Staggered entrance for top 3
- ❌ **Image Loading**: Smooth image load with placeholder
- ❌ **Search Results**: Fade-in animation

#### Design Improvements Needed
- ✅ Podium design is creative and engaging
- ❌ **Loading States**: Skeleton loaders for analytics
- ❌ **Empty States**: Better empty state for no data
- ❌ **Charts/Graphs**: Could add visualizations (future)
- ❌ **Export**: Share/export analytics (future)

---

### 8. Wrapped Tab
**Route**: Dashboard tab `insights` → sub-tab `wrapped`  
**File**: `components/WrappedTab.tsx`  
**Status**: ✅ Implemented (needs review)

#### Purpose
Year-end summary (like Spotify Wrapped). Shows annual statistics and highlights.

#### Current Design
- Likely similar to Analytics but focused on year-end data
- May include special animations

#### Transitions Needed
- ❌ **Page Entrance**: Special entrance animation
- ❌ **Section Transitions**: Smooth scroll between sections
- ❌ **Reveal Animations**: Staggered reveal of stats
- ❌ **Share Animation**: Export/share functionality

#### Design Improvements Needed
- ❌ **Review Needed**: Check current implementation
- ❌ **Visual Design**: Make it feel special and celebratory
- ❌ **Animations**: Add more engaging animations
- ❌ **Share Feature**: Allow users to share their wrapped

---

### 9. Leaderboard Tab
**Route**: Dashboard tab `insights` → sub-tab `leaderboard`  
**File**: `components/LeaderboardTab.tsx`  
**Status**: ✅ Implemented (needs review)

#### Purpose
Social leaderboard showing top users by various metrics (entries, consistency, etc.).

#### Current Design
- Likely a ranked list of users
- May show avatars, names, stats

#### Transitions Needed
- ❌ **List Entrance**: Staggered fade-in for leaderboard items
- ❌ **Rank Changes**: Animation when ranks update
- ❌ **User Click**: Smooth navigation to profile

#### Design Improvements Needed
- ❌ **Review Needed**: Check current implementation
- ❌ **Visual Design**: Make rankings more prominent
- ❌ **Medals/Badges**: Visual indicators for top positions
- ❌ **Filtering**: Filter by different metrics

---

### 10. Profile Tab
**Route**: Dashboard tab `profile`  
**File**: `components/ProfileTab.tsx`  
**Status**: ✅ Implemented

#### Purpose
User's own profile. View and edit profile information, account settings.

#### Current Design

##### Profile Section
- Profile picture (120x120px, circular)
- Username and @handle
- Bio (if set)
- Stats row: Friends count, Favorite Artists count, Favorite Songs count
- Favorite Artists (tags)
- Favorite Songs (list)
- Friends list (expandable)

##### Account Section (Expandable)
- Email (read-only)
- Change Username (placeholder)
- Change Password (placeholder)
- Sign Out button

##### Edit Button
- Links to `/profile/edit`

#### Transitions Needed
- ❌ **Section Expand/Collapse**: Smooth accordion animation
- ❌ **Stats Click**: Smooth expand of friends list
- ❌ **Edit Navigation**: Smooth transition to edit page
- ❌ **Image Upload**: Preview animation when uploading new image

#### Design Improvements Needed
- ✅ Core layout is good
- ❌ **Profile Picture**: Better upload/change interface
- ❌ **Stats Interaction**: More engaging stat displays
- ❌ **Friends List**: Better list design
- ❌ **Settings**: More account settings options

---

### 11. Profile Edit Page
**Route**: `/profile/edit`  
**File**: `app/profile/edit/page.tsx`  
**Status**: ✅ Implemented (needs review)

#### Purpose
Edit profile information: username, bio, profile picture, favorite artists/songs.

#### Current Design
- Form fields for editable information
- Save button
- Back navigation

#### Transitions Needed
- ❌ **Page Entrance**: Slide in from right
- ❌ **Form Submission**: Success animation
- ❌ **Image Upload**: Preview and crop interface
- ❌ **Back Navigation**: Smooth return to profile

#### Design Improvements Needed
- ❌ **Review Needed**: Check current implementation
- ❌ **Image Upload**: Better upload/crop interface
- ❌ **Form Validation**: Real-time validation feedback
- ❌ **Auto-save**: Optional auto-save feature

---

### 12. User Profile Page (Public)
**Route**: `/user/[username]`  
**File**: `app/user/[username]/page.tsx`  
**Status**: ✅ Implemented

#### Purpose
Public profile view for other users. Shows their public information and stats.

#### Current Design
- Header with back button and SongBird logo
- Profile picture
- Username and @handle
- Stats: Songs, Friends, Favorite Artists
- Bio
- Favorite Artists (tags)
- Favorite Songs (list)
- "Add Friend" button

#### Transitions Needed
- ❌ **Page Entrance**: Fade-in animation
- ❌ **Back Button**: Smooth return navigation
- ❌ **Add Friend**: Success animation/feedback

#### Design Improvements Needed
- ✅ Core layout is good
- ❌ **Friend Status**: Show if already friends, pending request, etc.
- ❌ **Recent Entries**: Show preview of their recent songs
- ❌ **Mutual Friends**: Show mutual connections
- ❌ **Share Profile**: Share user profile link

---

### 13. Archive Page
**Route**: `/archive`  
**File**: `app/archive/page.tsx`  
**Status**: ✅ Implemented (needs review)

#### Purpose
Full archive of all entries with search and filtering.

#### Current Design
- Likely a paginated or infinite-scroll list
- Search functionality
- Date filtering

#### Transitions Needed
- ❌ **Entry Cards**: Staggered fade-in
- ❌ **Search**: Smooth filter application
- ❌ **Pagination**: Smooth page transitions
- ❌ **Infinite Scroll**: Smooth loading of more entries

#### Design Improvements Needed
- ❌ **Review Needed**: Check current implementation
- ❌ **Search UI**: Better search interface
- ❌ **Filters**: More filter options (artist, year, etc.)
- ❌ **View Options**: Grid/list view toggle
- ❌ **Export**: Export archive data

---

## Transitions & Animations

### Current Animations

#### Implemented
✅ **Slide Animations** (`app/globals.css`):
- `slide-in`: Fade + translateX(30px) → translateX(0)
- `slide-out-left`: Fade + translateX(0) → translateX(-30px)
- `slide-out-right`: Fade + translateX(0) → translateX(30px)

✅ **Fade Animations**:
- `fade-in`: Opacity 0 → 1

✅ **Count-up Animation**:
- `count-up`: Scale 0.5 → 1 with fade

✅ **Fly Away Animation**:
- `fly-away`: TranslateY(0) → -100px, scale 1 → 0.8, fade out
- Used for success states

✅ **Bounce Animation**:
- Used on SongBird logo in AddEntryTab

#### Animation Timing
- **Fast**: 0.15s (slide-out)
- **Medium**: 0.3s (slide-in)
- **Slow**: 0.5-1.5s (fade-in, fly-away)

### Needed Animations

#### Page Transitions
- ❌ **Route Change**: Smooth fade/slide between pages
- ❌ **Tab Switch**: Slide left/right based on tab order
- ❌ **Modal Open/Close**: Scale + fade for modals

#### Micro-interactions
- ❌ **Button Hover**: Smooth color/scale transition
- ❌ **Card Hover**: Subtle lift/shadow increase
- ❌ **Input Focus**: Smooth border color change
- ❌ **Toggle Switch**: Smooth slide animation

#### Content Animations
- ❌ **List Items**: Staggered fade-in (0.1s delay between items)
- ❌ **Image Load**: Fade-in when images load
- ❌ **Loading Spinner**: Smooth rotation
- ❌ **Success Checkmark**: Scale + fade animation

#### Special Animations
- ❌ **SongBird Logo**: 
  - Idle: Gentle floating animation
  - Hover: Scale up + glow
  - Click: Video play → form reveal
- ❌ **Entry Saved**: Celebratory animation (confetti, checkmark, etc.)
- ❌ **Wrapped Reveal**: Special animations for wrapped sections

### Animation Guidelines

#### Principles
1. **Purposeful**: Every animation should serve a purpose
2. **Fast**: Animations should feel snappy (200-400ms for most)
3. **Easing**: Use ease-out for entrances, ease-in for exits
4. **Consistent**: Use same timing/easing across similar interactions
5. **Accessible**: Respect `prefers-reduced-motion`

#### Implementation
- Use CSS animations for simple transitions
- Use Framer Motion (or similar) for complex animations
- Add `prefers-reduced-motion` media query support

---

## Logo & Branding Assets

### Current Assets

#### Logo Files (in `/public`)
- ✅ `SongBirdlogo.png` - Main logo (used throughout app)
- ✅ `logo1brown.png` - Variant 1
- ✅ `logo2brown.png` - Variant 2
- ✅ `logo3brown.png` - Variant 3

#### Video Assets
- ✅ `movingbirdbrowon.mp4` - Bird animation video (used in AddEntryTab)
- ✅ `movingbirdbrowon(replaced).mp4` - Replacement version

### Logo Usage

#### Current Implementation
- **Navigation**: 32x32px in top nav
- **Homepage**: 200x200px (large, centered)
- **AddEntryTab**: 144x144px (clickable, animated)
- **TodayTab**: 96x96px (empty state)
- **User Profile**: 24x24px (small, inline)

#### Logo Specifications Needed
- ❌ **SVG Version**: Need vector logo for scalability
- ❌ **Variants**: Light/dark versions
- ❌ **Icon Version**: Simplified icon for favicon/app icon
- ❌ **Sizes**: Export in multiple sizes (16, 32, 64, 128, 256, 512px)
- ❌ **Format Guidelines**: When to use PNG vs SVG

### Branding Guidelines Needed

#### Logo Usage Rules
- ❌ **Minimum Size**: Define minimum logo size for readability
- ❌ **Clear Space**: Define padding around logo
- ❌ **Color Variations**: When to use colored vs monochrome
- ❌ **Backgrounds**: Logo usage on light/dark backgrounds

#### Brand Colors
- ✅ **Primary**: `--accent` (#B65A2A) - Rust orange
- ❌ **Secondary Colors**: Define additional brand colors if needed
- ❌ **Gradients**: Define any brand gradients

#### Typography for Branding
- ✅ **Logo Font**: If logo uses custom font, document it
- ❌ **Tagline Font**: Font for "Your personal music journal"
- ❌ **Brand Voice**: Typography guidelines for marketing materials

### Transition Videos Needed

#### Current
- ✅ Bird animation video exists

#### Needed
- ❌ **Logo Animation**: Animated logo for app launch/splash
- ❌ **Success Animation**: Animation for successful actions
- ❌ **Loading Animation**: Animated logo for loading states
- ❌ **Page Transitions**: Optional transition animations between major pages

#### Video Specifications
- **Format**: MP4 (H.264) for web
- **Duration**: 1-3 seconds for micro-animations
- **Loop**: Some should loop, others should play once
- **Size**: Optimized for web (<500KB when possible)
- **Resolution**: Match display size (1x, 2x, 3x for retina)

---

## Design Gaps & Next Steps

### High Priority

#### 1. Design System Alignment
- ❌ **Migrate Legacy Colors**: Update all components to use new color system from `songbird.css`
- ❌ **Update Tailwind Config**: Align Tailwind colors with design system
- ❌ **Component Audit**: Review all components for design system compliance

#### 2. Logo & Branding
- ❌ **Create SVG Logo**: Vector version for all sizes
- ❌ **Logo Variants**: Light/dark versions
- ❌ **Favicon**: Create favicon from logo
- ❌ **App Icons**: iOS/Android app icons (if planning mobile app)

#### 3. Animations & Transitions
- ❌ **Page Transitions**: Implement smooth transitions between routes
- ❌ **Tab Switching**: Add slide animations for tab changes
- ❌ **Micro-interactions**: Add hover/focus animations throughout
- ❌ **Loading States**: Implement skeleton loaders

#### 4. Component Polish
- ❌ **Button States**: Enhance hover/active/focus states
- ❌ **Form Validation**: Better error states and feedback
- ❌ **Empty States**: More engaging empty state designs
- ❌ **Card Designs**: Polish card components

### Medium Priority

#### 5. Desktop Experience
- ❌ **Desktop Sidebar**: Implement full sidebar navigation for desktop
- ❌ **Responsive Breakpoints**: Optimize for tablet/desktop sizes
- ❌ **Hover States**: Add hover interactions for desktop

#### 6. Advanced Features
- ❌ **Dark/Light Mode**: If planning light mode (currently dark only)
- ❌ **Accessibility**: Enhanced keyboard navigation, screen reader support
- ❌ **Performance**: Optimize images, lazy loading, code splitting

#### 7. Social Features UI
- ❌ **Friend Requests**: UI for sending/accepting friend requests
- ❌ **Notifications**: Enhanced notification center
- ❌ **Sharing**: Share entries/profiles/analytics

### Low Priority / Future

#### 8. Advanced Analytics
- ❌ **Charts & Graphs**: Visual data representations
- ❌ **Trends**: Show music trends over time
- ❌ **Comparisons**: Compare periods (this year vs last year)

#### 9. Mobile App
- ❌ **Native App Design**: If planning React Native app
- ❌ **Push Notifications**: UI for notification preferences
- ❌ **Offline Support**: Offline mode UI

#### 10. Marketing Pages
- ❌ **About Page**: About SongBird
- ❌ **Features Page**: Detailed feature descriptions
- ❌ **Pricing Page**: If adding premium features
- ❌ **Blog**: If adding blog/content

---

## Implementation Checklist

### Phase 1: Foundation (Week 1-2)
- [ ] Migrate all components to new design system
- [ ] Update Tailwind config
- [ ] Create SVG logo and variants
- [ ] Implement basic page transitions

### Phase 2: Polish (Week 3-4)
- [ ] Add micro-interactions
- [ ] Implement skeleton loaders
- [ ] Polish component designs
- [ ] Add desktop sidebar

### Phase 3: Advanced (Week 5-6)
- [ ] Create transition videos
- [ ] Implement advanced animations
- [ ] Enhance empty states
- [ ] Add accessibility features

### Phase 4: Future (Ongoing)
- [ ] Advanced analytics UI
- [ ] Social features polish
- [ ] Marketing pages
- [ ] Mobile app design

---

## Design Resources

### Tools Recommended
- **Figma**: For design mockups and prototypes
- **Framer Motion**: For React animations
- **Lottie**: For complex animations (if needed)
- **Adobe After Effects**: For video animations

### Design Inspiration
- **Spotify**: Music-focused, dark theme
- **Day One**: Journal app aesthetic
- **Instagram**: Social feed patterns
- **Apple Music**: Clean, minimal music UI

---

## Conclusion

SongBird has a solid foundation with a well-thought-out design system. The "robin at dawn" aesthetic is clear in the warm color palette and personal, intimate feel. The main priorities are:

1. **Align everything** to the design system in `songbird.css`
2. **Create proper logo assets** (SVG, variants, sizes)
3. **Add smooth transitions** throughout the app
4. **Polish components** for a cohesive, professional feel

The roadmap above provides a clear path to a polished, production-ready UI that maintains the warm, personal aesthetic while feeling modern and professional.

---

**Document Maintained By**: Design/UI Team  
**Last Updated**: 2024  
**Next Review**: After Phase 1 completion

