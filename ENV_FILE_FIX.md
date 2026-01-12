# Fix: Clerk Keys Not Loading

## The Problem:
Next.js is reading `.env` but you need `.env.local` for local development.

The terminal shows: `- Environments: .env` - it should show `.env.local`

## The Solution:

### Option 1: Create `.env.local` (Recommended)
1. Create a file named `.env.local` in your project root
2. Copy your Clerk keys into it:
   ```env
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_your_key_here
   CLERK_SECRET_KEY=sk_test_your_key_here
   NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
   NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
   NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/
   NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/
   ```
3. **Restart the dev server** (Ctrl+C, then `npm run dev`)

### Option 2: Rename `.env` to `.env.local`
If your keys are in `.env`, just rename it:
1. Rename `.env` to `.env.local`
2. **Restart the dev server**

## Why `.env.local`?
- `.env.local` is for local development (gitignored by default)
- `.env` is for shared/default values
- Next.js prioritizes `.env.local` over `.env`

## After Adding Keys:
**IMPORTANT:** You MUST restart the dev server after adding/changing environment variables!




