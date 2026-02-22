/**
 * Notification Helpers
 * 
 * Helper functions for sending notifications that respect user preferences
 */

import { getSupabase } from './supabase'
import { sendPushToUser } from './sendPushToUser'

/**
 * Check if a user wants to receive a specific notification type
 */
export async function shouldSendNotification(
  userId: string,
  type: 'vibe' | 'comment' | 'mention' | 'friend_request' | 'friend_accepted' | 'on_this_day' | 'premium_purchased'
): Promise<boolean> {
  const supabase = getSupabase()

  const { data: user, error } = await supabase
    .from('users')
    .select(`
      notificationsEnabled,
      notifyOnVibe,
      notifyOnComment,
      notifyOnMention,
      notifyOnFriendRequest,
      notifyOnFriendAccepted,
      notifyOnThisDay
    `)
    .eq('id', userId)
    .single()

  if (error || !user) {
    console.error('[notification-helpers] Error fetching user preferences:', error)
    // Default to true if we can't fetch preferences
    return true
  }

  // Master toggle
  if (user.notificationsEnabled === false) {
    return false
  }

  // Check specific preference
  switch (type) {
    case 'vibe':
      return user.notifyOnVibe !== false
    case 'comment':
      return user.notifyOnComment !== false
    case 'mention':
      return user.notifyOnMention !== false
    case 'friend_request':
      return user.notifyOnFriendRequest !== false
    case 'friend_accepted':
      return user.notifyOnFriendAccepted !== false
    case 'on_this_day':
      return user.notifyOnThisDay !== false
    case 'premium_purchased':
      // Always send premium purchase notifications
      return true
    default:
      return true
  }
}

/**
 * Send a notification respecting user preferences
 */
export async function sendNotificationWithPreferences(
  userId: string,
  type: 'vibe' | 'comment' | 'mention' | 'friend_request' | 'friend_accepted' | 'on_this_day' | 'premium_purchased',
  notification: {
    type: string
    relatedId?: string | null
  },
  pushData?: Record<string, any>
): Promise<void> {
  // Check if user wants this notification
  const shouldSend = await shouldSendNotification(userId, type)
  
  if (!shouldSend) {
    console.log(`[notification-helpers] User ${userId} has disabled ${type} notifications`)
    return
  }

  const supabase = getSupabase()

  // Create in-app notification
  const { error } = await supabase
    .from('notifications')
    .insert({
      id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      userId,
      type: notification.type,
      relatedId: notification.relatedId || null,
      read: false,
      createdAt: new Date().toISOString(),
    })

  if (error) {
    console.error('[notification-helpers] Error creating notification:', error)
  }

  // Send push notification if enabled and pushData provided
  if (pushData) {
    // Check if user has push notifications enabled
    const { data: user } = await supabase
      .from('users')
      .select('pushNotificationsEnabled, notificationsEnabled')
      .eq('id', userId)
      .single()

    if (user?.pushNotificationsEnabled && user?.notificationsEnabled) {
      sendPushToUser(userId, notification.type, pushData).catch((err) => {
        console.error('[notification-helpers] Push notification error:', err)
      })
    }
  }
}




