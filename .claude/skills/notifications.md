# /notifications

Help with SongBird's notification system - push notifications, in-app notifications, and preferences.

## Overview

SongBird has three notification channels:
1. **In-app** - Notifications within the app UI
2. **Push** - Web Push API notifications
3. **Email** - (future) Email notifications

## Key Files

- `lib/push.ts` - Push notification sending
- `lib/notification-helpers.ts` - Notification creation helpers
- `app/api/notifications/route.ts` - Fetch/mark read
- `app/api/push/send/route.ts` - Send push notification
- `components/Notifications.tsx` - Notification bell/panel
- `components/NotificationSettings.tsx` - Preferences UI

## Database Schema

```prisma
model Notification {
  id        String   @id @default(cuid())
  userId    String
  type      String   // 'vibe', 'comment', 'mention', 'friend_request', etc.
  relatedId String?  // Related entry/user ID
  read      Boolean  @default(false)
  createdAt DateTime @default(now())

  user User @relation(fields: [userId], references: [id])
}

model PushSubscription {
  id        String   @id @default(cuid())
  userId    String
  endpoint  String   @unique
  p256dh    String
  auth      String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  user User @relation(fields: [userId], references: [id])
}

model User {
  notificationsEnabled       Boolean @default(true)
  pushNotificationsEnabled   Boolean @default(true)
  reminderTime              Int     @default(20)  // Hour (0-23)
  reminderEnabled           Boolean @default(true)
  notifyOnVibe              Boolean @default(true)
  notifyOnComment           Boolean @default(true)
  notifyOnMention           Boolean @default(true)
  notifyOnFriendRequest     Boolean @default(true)
  notifyOnFriendAccepted    Boolean @default(true)
  notifyOnThisDay           Boolean @default(true)
}
```

## Notification Types

| Type | Trigger | Description |
|------|---------|-------------|
| `vibe` | Someone vibes your entry | "Sarah vibed your song" |
| `comment` | Comment on your entry | "Alex commented on your entry" |
| `mention` | Tagged in entry | "You were mentioned in Mike's entry" |
| `friend_request` | New friend request | "New friend request from Emma" |
| `friend_accepted` | Request accepted | "Jordan accepted your friend request" |
| `on_this_day` | On This Day memory | "On this day in 2023..." |
| `reminder` | Daily reminder | "Don't forget to log today's song!" |

## Creating Notifications

```typescript
import { createNotification } from '@/lib/notification-helpers'

// Create in-app notification
await createNotification({
  userId: targetUserId,
  type: 'vibe',
  relatedId: entryId,
})
```

## Sending Push Notifications

```typescript
import { sendPushToUser } from '@/lib/sendPushToUser'

await sendPushToUser(userId, {
  title: 'New Vibe! 💗',
  body: `${senderName} vibed your song`,
  url: `/feed`,  // Where to navigate on click
})
```

## Push Subscription Flow

### 1. Request Permission
```typescript
const permission = await Notification.requestPermission()
if (permission !== 'granted') {
  return // User denied
}
```

### 2. Subscribe
```typescript
const registration = await navigator.serviceWorker.ready
const subscription = await registration.pushManager.subscribe({
  userVisibleOnly: true,
  applicationServerKey: VAPID_PUBLIC_KEY,
})
```

### 3. Save to Database
```typescript
await fetch('/api/push/subscribe', {
  method: 'POST',
  body: JSON.stringify({
    endpoint: subscription.endpoint,
    keys: {
      p256dh: subscription.toJSON().keys.p256dh,
      auth: subscription.toJSON().keys.auth,
    },
  }),
})
```

## Notification Preferences

```tsx
// NotificationSettings.tsx
const settings = [
  { key: 'notifyOnVibe', label: 'Vibes on your songs' },
  { key: 'notifyOnComment', label: 'Comments on your entries' },
  { key: 'notifyOnMention', label: 'When you\'re mentioned' },
  { key: 'notifyOnFriendRequest', label: 'New friend requests' },
  { key: 'notifyOnFriendAccepted', label: 'Accepted requests' },
  { key: 'notifyOnThisDay', label: 'On This Day memories' },
]

// Check preference before sending
if (user.notifyOnVibe) {
  await sendPushToUser(userId, notification)
}
```

## Daily Reminder

```typescript
// Scheduled job (cron) - runs hourly
async function sendDailyReminders() {
  const currentHour = new Date().getHours()
  
  // Find users who:
  // 1. Have reminders enabled
  // 2. Reminder time matches current hour
  // 3. Haven't logged today
  const users = await supabase
    .from('users')
    .select('id')
    .eq('reminderEnabled', true)
    .eq('reminderTime', currentHour)
    // ... and no entry today
  
  for (const user of users.data) {
    await sendPushToUser(user.id, {
      title: 'What\'s your song today? 🎵',
      body: 'Don\'t break your streak! Log today\'s song.',
      url: '/',
    })
  }
}
```

## Notification Bell UI

```tsx
// components/Notifications.tsx
export default function NotificationBell() {
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isOpen, setIsOpen] = useState(false)
  
  return (
    <div className="relative">
      <button onClick={() => setIsOpen(!isOpen)}>
        🔔
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-accent text-bg text-xs rounded-full w-5 h-5">
            {unreadCount}
          </span>
        )}
      </button>
      
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-surface rounded-xl shadow-lg">
          {notifications.map(n => (
            <NotificationItem key={n.id} notification={n} />
          ))}
        </div>
      )}
    </div>
  )
}
```

## Environment Variables

```
VAPID_PUBLIC_KEY=BKxxxxxx
VAPID_PRIVATE_KEY=xxxxxx
NEXT_PUBLIC_VAPID_KEY=BKxxxxxx
```

Generate with: `npx web-push generate-vapid-keys`

## Common Issues

### "Push not working"
- Check browser supports Push API
- Verify VAPID keys are correct
- Check service worker is registered
- User may have denied permission

### "Notifications not showing"
- Check user preference settings
- Verify `createNotification` was called
- Check `read` status



