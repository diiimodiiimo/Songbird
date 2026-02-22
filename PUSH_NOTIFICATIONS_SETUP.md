# Push Notifications Setup Guide for SongBird

This guide will help you set up push notifications for SongBird so users can receive notifications on their phones.

## Overview

Push notifications work by:
1. User adds SongBird to their phone's home screen (PWA install)
2. User grants notification permission
3. SongBird subscribes the user to push notifications
4. When events happen (vibes, comments, etc.), push notifications are sent
5. Daily reminders are sent to users who haven't logged their SOTD

## Step 1: Generate VAPID Keys

VAPID (Voluntary Application Server Identification) keys are required for web push notifications.

Run this command to generate your keys:

```bash
npx web-push generate-vapid-keys
```

This will output something like:
```
=======================================

Public Key:
BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzkrxZJjSgSnfckjBJuBkr3qBUYIHBQFLXYp5Nksh8U

Private Key:
UUxI4O8-FbRouAevSmBQ6o18hgE4nSG3qwvJTfKc-ls

=======================================
```

## Step 2: Add Environment Variables

Add these environment variables to your `.env.local` file (local development) and Vercel dashboard (production):

```env
# VAPID Keys for Push Notifications
NEXT_PUBLIC_VAPID_PUBLIC_KEY=BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzkrxZJjSgSnfckjBJuBkr3qBUYIHBQFLXYp5Nksh8U
VAPID_PRIVATE_KEY=UUxI4O8-FbRouAevSmBQ6o18hgE4nSG3qwvJTfKc-ls
VAPID_SUBJECT=mailto:your-email@example.com

# Secret for cron jobs (generate a random string)
CRON_SECRET=your-random-secret-string-here
```

**Important:** Replace the example keys with your actual generated keys!

## Step 3: Run Database Migration

The push subscriptions table needs to be added to your database:

```bash
npx prisma db push
```

## Step 4: Install Dependencies

Make sure to install the new dependencies:

```bash
npm install
```

## Step 5: Deploy to Vercel

1. Push your code changes to git
2. Add the environment variables in Vercel Dashboard:
   - Go to Project Settings → Environment Variables
   - Add `NEXT_PUBLIC_VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT`, and `CRON_SECRET`
3. Redeploy the project

## How It Works

### User Experience

1. **Install Prompt**: When a logged-in user visits SongBird, they'll see a banner at the bottom asking them to:
   - **On Android/Desktop**: Click "Install" to add to home screen
   - **On iOS Safari**: Tap the share icon, then "Add to Home Screen"

2. **Enable Notifications**: After installation (or on supported browsers), users can click "Enable" to allow notifications

3. **Receive Notifications**: Users will get push notifications for:
   - 💗 When someone vibes to their song
   - 💬 When someone comments on their song
   - 📣 When someone mentions them
   - 👋 When they receive a friend request
   - 🤝 When their friend request is accepted
   - 🐦 Daily reminder if they haven't logged their SOTD

### Notification Reminders (Cron Jobs)

The app is configured to send SOTD reminders via Vercel Cron:
- **6 PM UTC**: First reminder
- **9 PM UTC**: Second reminder

These reminders only go to users who:
- Have push notifications enabled
- Haven't logged a song for that day

### API Endpoints

- `POST /api/push/subscribe` - Subscribe to push notifications
- `DELETE /api/push/subscribe` - Unsubscribe from push notifications
- `POST /api/push/send` - Send a push notification (internal)
- `POST /api/push/reminder` - Send SOTD reminders to all eligible users
- `GET /api/push/reminder` - Check how many users need reminders (debug)

## Testing

### Test Push Notifications Locally

1. Make sure you have the VAPID keys in `.env.local`
2. Run the dev server: `npm run dev`
3. Open the app in Chrome/Edge (Firefox on desktop also works)
4. Sign in and accept the notification prompt
5. Have another user (or use incognito) vibe/comment on your song
6. You should receive a push notification!

### Test SOTD Reminders

You can manually trigger the reminder check:

```bash
curl -X POST http://localhost:3000/api/push/reminder
```

Or check who needs reminders:

```bash
curl http://localhost:3000/api/push/reminder
```

## iOS Limitations

- Push notifications on iOS require the app to be added to the home screen
- iOS Safari has limited PWA support compared to Android
- Users must use Safari (not Chrome on iOS) for PWA install

## Troubleshooting

### "VAPID keys not configured"
Make sure your environment variables are set correctly and the server has been restarted.

### Notifications not appearing
1. Check that the user has granted notification permission
2. Verify the push subscription exists in the database
3. Check the browser console for errors
4. Make sure you're using HTTPS (required for service workers)

### Service worker not registering
- Service workers require HTTPS (or localhost for development)
- Check the browser console for registration errors
- Try unregistering existing service workers and refreshing

## Files Modified/Created

- `public/manifest.json` - PWA manifest
- `public/sw.js` - Service worker for push notifications
- `prisma/schema.prisma` - Added PushSubscription model
- `lib/push.ts` - Push notification utilities
- `lib/sendPushToUser.ts` - Helper function to send push to a user
- `app/api/push/subscribe/route.ts` - Subscribe/unsubscribe API
- `app/api/push/send/route.ts` - Send push API
- `app/api/push/reminder/route.ts` - SOTD reminder API
- `components/PushNotifications.tsx` - Client-side notification component
- `app/providers.tsx` - Added PushNotifications component
- `vercel.json` - Added cron job configuration
- Updated: vibes, comments, mentions, friend requests APIs to send push







