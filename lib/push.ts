// Push Notification Utility Library
import webpush from 'web-push'

// VAPID keys for web push authentication
// You should generate your own keys and store them in environment variables
// To generate keys: npx web-push generate-vapid-keys
const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || ''
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || ''
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || 'mailto:songbird@example.com'

// Configure web-push with VAPID details
if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(
    VAPID_SUBJECT,
    VAPID_PUBLIC_KEY,
    VAPID_PRIVATE_KEY
  )
}

export interface PushPayload {
  title: string
  body: string
  icon?: string
  badge?: string
  tag?: string
  url?: string
  type?: string
  relatedId?: string
  actions?: Array<{ action: string; title: string }>
  requireInteraction?: boolean
}

export interface PushSubscriptionData {
  endpoint: string
  keys: {
    p256dh: string
    auth: string
  }
}

/**
 * Send a push notification to a subscription
 */
export async function sendPushNotification(
  subscription: PushSubscriptionData,
  payload: PushPayload
): Promise<boolean> {
  if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
    console.warn('[push] VAPID keys not configured - skipping push notification')
    return false
  }

  try {
    const pushPayload = {
      title: payload.title,
      body: payload.body,
      icon: payload.icon || '/SongBirdlogo.png',
      badge: payload.badge || '/SongBirdlogo.png',
      tag: payload.tag || `songbird-${Date.now()}`,
      url: payload.url || '/home',
      type: payload.type,
      relatedId: payload.relatedId,
      actions: payload.actions,
      requireInteraction: payload.requireInteraction
    }

    await webpush.sendNotification(
      {
        endpoint: subscription.endpoint,
        keys: subscription.keys
      },
      JSON.stringify(pushPayload)
    )

    console.log('[push] Notification sent successfully')
    return true
  } catch (error: any) {
    console.error('[push] Error sending notification:', error?.message || error)
    
    // If subscription is no longer valid (410 Gone or 404), return false
    // The caller should handle removing the subscription
    if (error?.statusCode === 410 || error?.statusCode === 404) {
      console.log('[push] Subscription expired or invalid')
      return false
    }
    
    return false
  }
}

/**
 * Get notification content based on type
 */
export function getNotificationContent(
  type: string,
  data?: any
): PushPayload {
  switch (type) {
    case 'vibe':
      return {
        title: '💗 New Vibe!',
        body: data?.userName 
          ? `${data.userName} vibed to your song "${data.songTitle || 'entry'}"`
          : `Someone vibed to your song!`,
        url: '/home?tab=notifications',
        type: 'vibe',
        relatedId: data?.entryId
      }
    
    case 'comment':
      return {
        title: '💬 New Comment',
        body: data?.userName
          ? `${data.userName} commented on your song`
          : 'Someone commented on your song',
        url: '/home?tab=notifications',
        type: 'comment',
        relatedId: data?.commentId
      }
    
    case 'mention':
      return {
        title: '📣 You were mentioned!',
        body: data?.userName
          ? `${data.userName} mentioned you in "${data.songTitle || 'their entry'}"`
          : 'Someone mentioned you in their song entry',
        url: '/home?tab=notifications',
        type: 'mention',
        relatedId: data?.entryId
      }
    
    case 'friend_request':
      return {
        title: '👋 New Friend Request',
        body: data?.userName
          ? `${data.userName} wants to be your friend!`
          : 'You have a new friend request',
        url: '/home?tab=friends',
        type: 'friend_request',
        relatedId: data?.requestId,
        actions: [
          { action: 'accept', title: 'Accept' },
          { action: 'view', title: 'View' }
        ]
      }
    
    case 'friend_request_accepted':
      return {
        title: '🤝 Friend Request Accepted!',
        body: data?.userName
          ? `${data.userName} accepted your friend request`
          : 'Your friend request was accepted!',
        url: '/home?tab=friends',
        type: 'friend_request_accepted',
        relatedId: data?.requestId
      }
    
    case 'sotd_reminder':
      return {
        title: '🐦 Log your Song of the Day!',
        body: "You haven't added a song today. What are you listening to?",
        url: '/home?tab=add',
        type: 'sotd_reminder',
        requireInteraction: true,
        actions: [
          { action: 'add', title: 'Add Song' },
          { action: 'dismiss', title: 'Later' }
        ]
      }
    
    default:
      return {
        title: '🐦 SongBird',
        body: 'You have a new notification',
        url: '/home?tab=notifications',
        type: 'general'
      }
  }
}

/**
 * Check if VAPID keys are configured
 */
export function isWebPushConfigured(): boolean {
  return !!(VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY)
}

/**
 * Get public VAPID key for client-side subscription
 */
export function getPublicVapidKey(): string {
  return VAPID_PUBLIC_KEY
}



