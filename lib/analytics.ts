/**
 * SongBird Analytics Utility
 * Comprehensive tracking for user behavior throughout the app
 */

import { getSupabase } from '@/lib/supabase'

// Simple cuid-like generator (no external dependencies)
function generateId(): string {
  const timestamp = Date.now().toString(36)
  const randomPart = Math.random().toString(36).substring(2, 15)
  const randomPart2 = Math.random().toString(36).substring(2, 15)
  return `c${timestamp}${randomPart}${randomPart2}`
}

// ==========================================
// Event Names (snake_case, past tense verbs)
// ==========================================

export const AnalyticsEvents = {
  // Authentication & Onboarding
  USER_SIGNED_UP: 'user_signed_up',
  USER_LOGGED_IN: 'user_logged_in',
  ONBOARDING_STARTED: 'onboarding_started',
  ONBOARDING_STEP_COMPLETED: 'onboarding_step_completed',
  ONBOARDING_SKIPPED: 'onboarding_skipped',
  ONBOARDING_COMPLETED: 'onboarding_completed',
  ONBOARDING_USERNAME_SET: 'onboarding_username_set',
  ONBOARDING_FIRST_ENTRY_CREATED: 'onboarding_first_entry_created',
  ONBOARDING_FIRST_ENTRY_SKIPPED: 'onboarding_first_entry_skipped',
  ONBOARDING_INVITE_TAPPED: 'onboarding_invite_tapped',
  ONBOARDING_INVITE_SKIPPED: 'onboarding_invite_skipped',

  // Core Loop (Song Entries)
  ENTRY_STARTED: 'entry_started',
  ENTRY_SONG_SEARCHED: 'entry_song_searched',
  ENTRY_SONG_SELECTED: 'entry_song_selected',
  ENTRY_NOTE_ADDED: 'entry_note_added',
  ENTRY_CREATED: 'entry_created',
  ENTRY_EDITED: 'entry_edited',
  ENTRY_DELETED: 'entry_deleted',

  // Engagement
  APP_OPENED: 'app_opened',
  TAB_VIEWED: 'tab_viewed',
  MEMORY_VIEWED: 'memory_viewed',
  MEMORY_SONG_PLAYED: 'memory_song_played',

  // Social
  FRIEND_REQUEST_SENT: 'friend_request_sent',
  FRIEND_REQUEST_ACCEPTED: 'friend_request_accepted',
  FRIEND_REQUEST_DECLINED: 'friend_request_declined',
  FRIEND_REMOVED: 'friend_removed',
  VIBE_GIVEN: 'vibe_given',
  COMMENT_CREATED: 'comment_created',
  COMMENT_DELETED: 'comment_deleted',
  MENTION_CREATED: 'mention_created',
  PROFILE_VIEWED: 'profile_viewed',

  // Invites
  INVITE_LINK_GENERATED: 'invite_link_generated',
  INVITE_LINK_SHARED: 'invite_link_shared',
  INVITE_LINK_COPIED: 'invite_link_copied',
  INVITE_LINK_CLICKED: 'invite_link_clicked',
  INVITE_CONVERTED: 'invite_converted',
  INVITE_FRIEND_REQUEST_SENT: 'invite_friend_request_sent',
  INVITE_FRIEND_REQUEST_ACCEPTED: 'invite_friend_request_accepted',

  // Aviary
  AVIARY_VIEWED: 'aviary_viewed',
  AVIARY_BIRD_TAPPED: 'aviary_bird_tapped',
  AVIARY_SONG_PLAYED: 'aviary_song_played',

  // Insights/Wrapped
  INSIGHTS_VIEWED: 'insights_viewed',
  WRAPPED_GENERATED: 'wrapped_generated',
  WRAPPED_SHARED: 'wrapped_shared',

  // Streaks
  STREAK_CONTINUED: 'streak_continued',
  STREAK_FREEZE_ACTIVATED: 'streak_freeze_activated',
  STREAK_BROKEN: 'streak_broken',
  STREAK_RESTORED: 'streak_restored',
  STREAK_MILESTONE_REACHED: 'streak_milestone_reached',

  // Settings & Profile
  BIRD_CHANGED: 'bird_changed',
  THEME_CHANGED: 'theme_changed',
  NOTIFICATION_SETTINGS_CHANGED: 'notification_settings_changed',
  USERNAME_CHANGED: 'username_changed',
  ACCOUNT_DELETED: 'account_deleted',

  // Premium/Payments
  CHECKOUT_STARTED: 'checkout_started',
  CHECKOUT_COMPLETED: 'checkout_completed',
  PREMIUM_ACTIVATED: 'premium_activated',

  // Bird Unlocks
  BIRD_UNLOCKED: 'bird_unlocked',
  BIRD_UNLOCK_PROGRESS: 'bird_unlock_progress',
} as const

export type AnalyticsEventName = typeof AnalyticsEvents[keyof typeof AnalyticsEvents]

// ==========================================
// Server-side Analytics (Database Storage)
// ==========================================

interface TrackEventParams {
  userId?: string | null
  event: AnalyticsEventName | string
  properties?: Record<string, any>
}

/**
 * Track an analytics event (server-side)
 * Stores events in the database for analysis
 */
export async function trackEvent({ userId, event, properties }: TrackEventParams): Promise<void> {
  try {
    const supabase = getSupabase()
    await supabase.from('analytics_events').insert({
      id: generateId(),
      userId: userId || null,
      event,
      properties: properties || {},
      createdAt: new Date().toISOString(),
    })
  } catch (error) {
    // Don't fail the main operation if analytics fails
    console.error('[Analytics] Failed to track event:', event, error)
  }
}

/**
 * Track multiple events at once
 */
export async function trackEvents(events: TrackEventParams[]): Promise<void> {
  try {
    const supabase = getSupabase()
    await supabase.from('analytics_events').insert(
      events.map(({ userId, event, properties }) => ({
        id: generateId(),
        userId: userId || null,
        event,
        properties: properties || {},
        createdAt: new Date().toISOString(),
      }))
    )
  } catch (error) {
    console.error('[Analytics] Failed to track events:', error)
  }
}

// ==========================================
// User Properties (stored on User model)
// ==========================================

export interface UserProperties {
  totalEntries: number
  currentStreak: number
  longestStreak: number
  friendCount: number
  selectedBird: string
  hasCompletedOnboarding: boolean
  isPremium: boolean
  isFoundingMember: boolean
  createdAt: Date
}

/**
 * Get user properties for analytics segmentation
 */
export async function getUserProperties(userId: string): Promise<UserProperties | null> {
  try {
    const supabase = getSupabase()
    
    // Get user data
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('theme, currentStreak, longestStreak, onboardingCompletedAt, isPremium, isFoundingMember, createdAt')
      .eq('id', userId)
      .single()

    if (userError || !user) return null

    // Get entry count
    const { count: entriesCount } = await supabase
      .from('entries')
      .select('id', { count: 'exact', head: true })
      .eq('userId', userId)

    // Get friend count (accepted requests where user is sender or receiver)
    const { count: sentCount } = await supabase
      .from('friend_requests')
      .select('id', { count: 'exact', head: true })
      .eq('senderId', userId)
      .eq('status', 'accepted')

    const { count: receivedCount } = await supabase
      .from('friend_requests')
      .select('id', { count: 'exact', head: true })
      .eq('receiverId', userId)
      .eq('status', 'accepted')

    return {
      totalEntries: entriesCount || 0,
      currentStreak: user.currentStreak || 0,
      longestStreak: user.longestStreak || 0,
      friendCount: (sentCount || 0) + (receivedCount || 0),
      selectedBird: user.theme || 'american-robin',
      hasCompletedOnboarding: !!user.onboardingCompletedAt,
      isPremium: user.isPremium || false,
      isFoundingMember: user.isFoundingMember || false,
      createdAt: new Date(user.createdAt),
    }
  } catch (error) {
    console.error('[Analytics] Failed to get user properties:', error)
    return null
  }
}

// ==========================================
// Analytics Queries (for insights)
// ==========================================

/**
 * Get event counts for a specific event type
 */
export async function getEventCount(
  event: AnalyticsEventName,
  options?: { userId?: string; startDate?: Date; endDate?: Date }
): Promise<number> {
  try {
    const supabase = getSupabase()
    let query = supabase
      .from('analytics_events')
      .select('id', { count: 'exact', head: true })
      .eq('event', event)

    if (options?.userId) {
      query = query.eq('userId', options.userId)
    }
    if (options?.startDate) {
      query = query.gte('createdAt', options.startDate.toISOString())
    }
    if (options?.endDate) {
      query = query.lte('createdAt', options.endDate.toISOString())
    }

    const { count } = await query
    return count || 0
  } catch (error) {
    console.error('[Analytics] Failed to get event count:', error)
    return 0
  }
}

/**
 * Get recent events for a user
 */
export async function getRecentEvents(
  userId: string,
  limit: number = 50
): Promise<Array<{ event: string; properties: any; createdAt: Date }>> {
  try {
    const supabase = getSupabase()
    const { data, error } = await supabase
      .from('analytics_events')
      .select('event, properties, createdAt')
      .eq('userId', userId)
      .order('createdAt', { ascending: false })
      .limit(limit)

    if (error) throw error
    return (data || []).map(e => ({
      event: e.event,
      properties: e.properties,
      createdAt: new Date(e.createdAt),
    }))
  } catch (error) {
    console.error('[Analytics] Failed to get recent events:', error)
    return []
  }
}
