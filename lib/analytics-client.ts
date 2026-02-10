/**
 * Client-side Analytics Helper
 * Sends events to the analytics API endpoint
 */

import { AnalyticsEvents } from './analytics'

// Re-export event names for convenience
export { AnalyticsEvents }

/**
 * Track an analytics event from the client
 */
export async function track(
  event: string,
  properties?: Record<string, any>
): Promise<void> {
  try {
    await fetch('/api/analytics/event', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ event, properties }),
    })
  } catch (error) {
    // Silently fail - don't interrupt user experience
    console.error('[Analytics] Failed to track event:', event, error)
  }
}

/**
 * Track a page/tab view
 */
export function trackTabView(tabName: string): void {
  track(AnalyticsEvents.TAB_VIEWED, { tab_name: tabName })
}

/**
 * Track app open
 */
export function trackAppOpen(): void {
  const lastOpen = localStorage.getItem('lastAppOpen')
  const now = new Date()
  let daysSinceLastOpen: number | undefined

  if (lastOpen) {
    const lastOpenDate = new Date(lastOpen)
    daysSinceLastOpen = Math.floor(
      (now.getTime() - lastOpenDate.getTime()) / (1000 * 60 * 60 * 24)
    )
  }

  track(AnalyticsEvents.APP_OPENED, { days_since_last_open: daysSinceLastOpen })
  localStorage.setItem('lastAppOpen', now.toISOString())
}

/**
 * Track entry creation
 */
export function trackEntryCreated(properties: {
  isBackfill: boolean
  isToday: boolean
  hasNote: boolean
  trackId?: string
}): void {
  track(AnalyticsEvents.ENTRY_CREATED, properties)
}

/**
 * Track friend request
 */
export function trackFriendRequestSent(receiverUsername?: string): void {
  track(AnalyticsEvents.FRIEND_REQUEST_SENT, { receiver_username: receiverUsername })
}

/**
 * Track vibe (like)
 */
export function trackVibeGiven(entryId: string): void {
  track(AnalyticsEvents.VIBE_GIVEN, { entry_id: entryId })
}

/**
 * Track invite link events
 */
export function trackInviteLinkGenerated(): void {
  track(AnalyticsEvents.INVITE_LINK_GENERATED)
}

export function trackInviteLinkShared(): void {
  track(AnalyticsEvents.INVITE_LINK_SHARED)
}

export function trackInviteLinkCopied(): void {
  track(AnalyticsEvents.INVITE_LINK_COPIED)
}

/**
 * Track streak events
 */
export function trackStreakMilestone(milestone: number): void {
  track(AnalyticsEvents.STREAK_MILESTONE_REACHED, { milestone })
}

/**
 * Track theme/bird change
 */
export function trackThemeChanged(themeId: string): void {
  track(AnalyticsEvents.THEME_CHANGED, { theme_id: themeId })
}

export function trackBirdChanged(birdId: string): void {
  track(AnalyticsEvents.BIRD_CHANGED, { bird_id: birdId })
}

/**
 * Track aviary events
 */
export function trackAviaryViewed(): void {
  track(AnalyticsEvents.AVIARY_VIEWED)
}

export function trackAviaryBirdTapped(isOwnBird: boolean, friendId?: string): void {
  track(AnalyticsEvents.AVIARY_BIRD_TAPPED, { is_own_bird: isOwnBird, friend_id: friendId })
}

/**
 * Track profile views
 */
export function trackProfileViewed(isOwnProfile: boolean, userId?: string): void {
  track(AnalyticsEvents.PROFILE_VIEWED, { is_own_profile: isOwnProfile, user_id: userId })
}

/**
 * Track memory (On This Day) events
 */
export function trackMemoryViewed(): void {
  track(AnalyticsEvents.MEMORY_VIEWED)
}

export function trackMemorySongPlayed(entryId: string): void {
  track(AnalyticsEvents.MEMORY_SONG_PLAYED, { entry_id: entryId })
}






