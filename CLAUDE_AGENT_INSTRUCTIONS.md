# Instructions for Claude Agents Working on SongBird

## Project Context

**SongBird** is a music journal app where users track daily songs, add notes/memories, and share with friends. Built with Next.js 14+, TypeScript, Prisma, PostgreSQL, Clerk (auth), and Tailwind CSS.

## Critical Context - READ FIRST

### ⚠️ Authentication Migration Status
- **IN PROGRESS**: Migrating from NextAuth to Clerk
- **CURRENT STATE**: Partially migrated - infrastructure set up but components/API routes not updated
- **IMPACT**: Many features may not work until migration is complete
- **ACTION**: If working on components/API, may need to update auth calls

### 🔴 Blocking Issues
1. Clerk migration incomplete (components/API routes need updating)
2. Environment variables may need server restart after changes
3. Project in OneDrive (can cause file lock issues on Windows)

---

## Agent Instructions by Task Type

### 🔐 Authentication Migration Agent

**Your Goal**: Complete the migration from NextAuth to Clerk

**What's Already Done**:
- ✅ Clerk installed
- ✅ Middleware updated
- ✅ Sign-in/Sign-up pages created
- ✅ Layout wrapped with ClerkProvider
- ✅ Home page created

**What You Need to Do**:

1. **Update Components** (11 files):
   - Find all `useSession` imports from `next-auth/react`
   - Replace with `useUser()` from `@clerk/nextjs`
   - Replace `session.user.id` with `user?.id`
   - Replace `signOut()` with `useClerk().signOut()`
   - Update Navigation, AddEntryTab, FeedTab, AnalyticsTab, MemoryTab, HistoryTab, ProfileTab, FriendsTab, WrappedTab, Notifications, FullHistoryTab

2. **Update API Routes** (20+ files):
   - Find all `getServerSession(authOptions)` calls
   - Replace with `auth()` from `@clerk/nextjs/server`
   - Replace `session.user.id` with `userId` from `auth()`
   - Update error handling

3. **Database User Sync**:
   - Add `clerkUserId` field to User model (optional, or use sync table)
   - Create helper function to sync Clerk users to database
   - Handle user creation on first Clerk login

4. **Cleanup**:
   - Remove `next-auth` package
   - Delete `lib/auth.ts` (NextAuth config)
   - Delete `app/api/auth/[...nextauth]/route.ts`
   - Remove NextAuth types

**Key Files**:
- `components/*.tsx` - All components using `useSession`
- `app/api/**/route.ts` - All API routes using `getServerSession`
- `prisma/schema.prisma` - Add Clerk user ID field
- `types/next-auth.d.ts` - Can remove after migration

**Reference**:
- Clerk docs: https://clerk.com/docs
- Use `useUser()` hook for client components
- Use `auth()` function for server components/API routes

---

### 🎨 Design & Layout Improvement Agent

**Your Goal**: Improve visual design, layout, and user experience

**Current State**:
- Basic Tailwind CSS styling
- Functional but could be more polished
- Some inconsistencies in spacing/layout
- Mobile responsiveness needs improvement

**Your Tasks**:

1. **Review Current Design**:
   - Examine `components/*.tsx` for design patterns
   - Check `app/globals.css` for global styles
   - Review `tailwind.config.js` for theme

2. **Improve Consistency**:
   - Standardize spacing/padding
   - Consistent button styles
   - Uniform card/container designs
   - Consistent typography hierarchy

3. **Enhance Visual Appeal**:
   - Better color usage
   - Improved shadows/borders
   - Better hover states
   - Smooth transitions/animations

4. **Mobile Experience**:
   - Ensure mobile-first design
   - Better touch targets
   - Improved mobile layouts
   - Test on various screen sizes

5. **Loading & Empty States**:
   - Better loading indicators
   - More engaging empty states
   - Skeleton loaders where appropriate

**Key Areas**:
- Home screen (`app/home/page.tsx`)
- Dashboard (`components/Dashboard.tsx`)
- Entry cards/displays
- Forms (Add Entry)
- Analytics/Charts
- Archive/History lists
- Navigation

**Constraints**:
- Must use Tailwind CSS only
- Follow existing color scheme (or improve it systematically)
- Maintain accessibility
- Keep performance in mind
- No breaking changes to functionality

**Approach**:
1. Start with one component at a time
2. Make improvements incrementally
3. Document design decisions
4. Test on mobile and desktop
5. Ensure consistency across the app

---

### ⚙️ Backend Improvement Agent

**Your Goal**: Optimize backend, improve performance, enhance code quality

**Current State**:
- API routes working but could be optimized
- Database queries functional but some could be improved
- Error handling basic
- No caching strategy

**Your Tasks**:

1. **Database Optimization**:
   - Review all Prisma queries
   - Identify N+1 query problems
   - Check for missing indexes
   - Optimize nested queries
   - Reduce unnecessary data fetching

2. **API Route Improvements**:
   - Better error handling and messages
   - Input validation (expand Zod usage)
   - Response size optimization
   - Better pagination
   - Consistent response formats

3. **Performance**:
   - Identify slow queries
   - Optimize database queries
   - Reduce API response sizes
   - Consider caching strategies
   - Optimize image handling

4. **Code Quality**:
   - Consistent error handling patterns
   - Better TypeScript types
   - Remove code duplication
   - Better code organization
   - Add helpful comments

**Key Files**:
- `app/api/**/route.ts` - All API routes
- `lib/prisma.ts` - Prisma client setup
- `prisma/schema.prisma` - Database schema

**Constraints**:
- Must use Prisma for database operations
- Keep Vercel serverless limits in mind
- Maintain type safety
- Don't break existing functionality
- Follow existing patterns where reasonable

**Approach**:
1. Profile and identify bottlenecks
2. Optimize one API route at a time
3. Test performance improvements
4. Document optimizations
5. Ensure backward compatibility

---

### 💡 Brainstorming Agent

**Your Goal**: Generate creative improvement ideas and feature suggestions

**Focus Areas**:

1. **New Features**:
   - Music-related features
   - Social features
   - Analytics enhancements
   - Integration ideas

2. **User Experience**:
   - Workflow improvements
   - Pain point solutions
   - Engagement features
   - Discovery features

3. **Technical Improvements**:
   - Architecture enhancements
   - Performance optimizations
   - Scalability considerations
   - Developer experience

4. **Business/Product**:
   - Monetization ideas
   - Growth features
   - Retention strategies
   - Competitive advantages

**Approach**:
1. Analyze current features and identify gaps
2. Think about user journeys and pain points
3. Research similar apps for inspiration
4. Consider technical feasibility
5. Prioritize by value vs. effort
6. Think creatively but realistically
7. Consider the music/journaling context

**Output Format**:
- Feature name
- Description
- Value proposition
- Technical complexity
- User impact
- Priority recommendation

---

## General Guidelines for All Agents

### Code Style
- Follow TypeScript best practices
- Use existing patterns where possible
- Write clean, readable code
- Add comments for complex logic
- Maintain type safety

### Testing
- Test changes locally
- Check for breaking changes
- Verify mobile responsiveness
- Test error cases

### Documentation
- Document significant changes
- Explain design decisions
- Note any breaking changes
- Update relevant README/docs

### Git/Version Control
- Make atomic commits
- Clear commit messages
- Don't break existing functionality
- Test before committing

### Communication
- Ask questions if unclear
- Suggest alternatives if better approach
- Explain trade-offs
- Be specific about changes

---

## Quick Reference

### Key Technologies
- Next.js 14+ (App Router)
- TypeScript
- Prisma ORM
- PostgreSQL
- Clerk (auth)
- Tailwind CSS
- Spotify API

### Important Paths
- Components: `components/*.tsx`
- API Routes: `app/api/**/route.ts`
- Pages: `app/**/page.tsx`
- Database: `prisma/schema.prisma`
- Styles: `app/globals.css`, `tailwind.config.js`

### Environment Variables
- Clerk keys needed for auth
- Database URL for Prisma
- Spotify API keys
- See `.env` or `.env.local`

### Common Patterns
- Server Components by default
- 'use client' for client components
- API routes in `app/api`
- Prisma for all database access
- Tailwind for styling

---

## Getting Started Checklist

Before starting work:
- [ ] Understand the current state
- [ ] Check authentication migration status
- [ ] Review relevant files
- [ ] Understand the tech stack
- [ ] Test current functionality
- [ ] Make a plan
- [ ] Start with small changes
- [ ] Test thoroughly
- [ ] Document changes



