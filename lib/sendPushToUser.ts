// Helper function to send push notification to a user
// This is a server-side helper that can be called from API routes

import { getSupabase } from '@/lib/supabase'
import webpush from 'web-push'

// VAPID keys for web push authentication
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

interface NotificationData {
  userName?: string
  songTitle?: string
  entryId?: string
  commentId?: string
  requestId?: string
}

/**
 * Send a push notification to a user
 * @param userId - The user ID to send the notification to
 * @param type - The type of notification (vibe, comment, mention, friend_request, friend_request_accepted, sotd_reminder)
 * @param data - Additional data for the notification content
 */
export async function sendPushToUser(
  userId: string,
  type: string,
  data?: NotificationData
): Promise<void> {
  // Skip if VAPID keys not configured
  if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
    console.log('[sendPushToUser] VAPID keys not configured, skipping push')
    return
  }

  try {
    const supabase = getSupabase()

    // Get all push subscriptions for this user
    const { data: subscriptions, error } = await supabase
      .from('push_subscriptions')
      .select('id, endpoint, p256dh, auth')
      .eq('userId', userId)

    if (error) {
      console.error('[sendPushToUser] Error fetching subscriptions:', error)
      return
    }

    if (!subscriptions || subscriptions.length === 0) {
      console.log('[sendPushToUser] No push subscriptions for user:', userId)
      return
    }

    // Get notification content based on type
    const payload = getNotificationPayload(type, data)

    // Send to all user's subscriptions in parallel
    await Promise.all(
      subscriptions.map(async (sub) => {
        try {
          await webpush.sendNotification(
            {
              endpoint: sub.endpoint,
              keys: {
                p256dh: sub.p256dh,
                auth: sub.auth
              }
            },
            JSON.stringify(payload)
          )
          console.log('[sendPushToUser] Push sent successfully to:', sub.endpoint.substring(0, 50))
        } catch (pushError: any) {
          console.error('[sendPushToUser] Push failed:', pushError?.message)
          
          // If subscription is no longer valid (410 Gone or 404), remove it
          if (pushError?.statusCode === 410 || pushError?.statusCode === 404) {
            console.log('[sendPushToUser] Removing invalid subscription:', sub.id)
            await supabase
              .from('push_subscriptions')
              .delete()
              .eq('id', sub.id)
          }
        }
      })
    )
  } catch (error: any) {
    console.error('[sendPushToUser] Error:', error?.message || error)
  }
}

function getNotificationPayload(type: string, data?: NotificationData) {
  switch (type) {
    case 'vibe':
      return {
        title: '💗 New Vibe!',
        body: data?.userName 
          ? `${data.userName} vibed to "${data.songTitle || 'your song'}"`
          : 'Someone vibed to your song!',
        icon: '/SongBirdlogo.png',
        badge: '/SongBirdlogo.png',
        tag: `vibe-${data?.entryId || Date.now()}`,
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
        icon: '/SongBirdlogo.png',
        badge: '/SongBirdlogo.png',
        tag: `comment-${data?.commentId || Date.now()}`,
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
        icon: '/SongBirdlogo.png',
        badge: '/SongBirdlogo.png',
        tag: `mention-${data?.entryId || Date.now()}`,
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
        icon: '/SongBirdlogo.png',
        badge: '/SongBirdlogo.png',
        tag: `friend-request-${data?.requestId || Date.now()}`,
        url: '/home?tab=friends',
        type: 'friend_request',
        relatedId: data?.requestId
      }
    
    case 'friend_request_accepted':
      return {
        title: '🤝 Friend Request Accepted!',
        body: data?.userName
          ? `${data.userName} accepted your friend request`
          : 'Your friend request was accepted!',
        icon: '/SongBirdlogo.png',
        badge: '/SongBirdlogo.png',
        tag: `friend-accepted-${data?.requestId || Date.now()}`,
        url: '/home?tab=friends',
        type: 'friend_request_accepted',
        relatedId: data?.requestId
      }
    
    case 'sotd_reminder':
      return {
        title: '🐦 Log your Song of the Day!',
        body: "You haven't added a song today. What are you listening to?",
        icon: '/SongBirdlogo.png',
        badge: '/SongBirdlogo.png',
        tag: `sotd-reminder-${Date.now()}`,
        url: '/home?tab=add',
        type: 'sotd_reminder',
        requireInteraction: true
      }
    
    default:
      return {
        title: '🐦 SongBird',
        body: 'You have a new notification',
        icon: '/SongBirdlogo.png',
        badge: '/SongBirdlogo.png',
        tag: `songbird-${Date.now()}`,
        url: '/home?tab=notifications',
        type: 'general'
      }
  }
}

