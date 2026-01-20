import { getSupabase } from './supabase'
import { checkAndUnlockBirds } from './birds'
import { trackEvent, AnalyticsEvents } from './analytics'

interface StreakResult {
  currentStreak: number
  longestStreak: number
  streakFreezeAvailable: boolean
  streakFrozenToday: boolean
  canRestore: boolean
  newBirdUnlocks?: string[]
  streakMilestoneReached?: number
}

/**
 * Calculate and update user's streak
 * Rules:
 * - An entry only counts toward streak if logged on the same calendar day as entry.date
 * - Streak freeze auto-activates if user misses ONE day
 * - Freeze regenerates after 7 days of continuous logging
 * - One free restore per month if streak breaks without freeze
 */
export async function calculateStreak(userId: string): Promise<StreakResult> {
  const supabase = getSupabase()
  
  const { data: user, error: userError } = await supabase
    .from('users')
    .select('currentStreak, longestStreak, lastStreakDate, streakFreezeAvailable, streakFreezeUsedAt, lastStreakRestoreAt')
    .eq('id', userId)
    .single()

  if (userError || !user) {
    return {
      currentStreak: 0,
      longestStreak: 0,
      streakFreezeAvailable: true,
      streakFrozenToday: false,
      canRestore: false,
    }
  }

  const now = new Date()
  const today = getDateString(now)
  const yesterday = getDateString(new Date(now.getTime() - 24 * 60 * 60 * 1000))

  // Check if user logged TODAY (same-day entry)
  const { data: todayEntries } = await supabase
    .from('entries')
    .select('id')
    .eq('userId', userId)
    .gte('date', today + 'T00:00:00')
    .lt('date', today + 'T23:59:59')
    .gte('createdAt', today + 'T00:00:00')
    .lt('createdAt', today + 'T23:59:59')
    .limit(1)

  const todayEntry = todayEntries && todayEntries.length > 0

  // Check if user logged yesterday (same-day entry)
  const { data: yesterdayEntries } = await supabase
    .from('entries')
    .select('id')
    .eq('userId', userId)
    .gte('date', yesterday + 'T00:00:00')
    .lt('date', yesterday + 'T23:59:59')
    .gte('createdAt', yesterday + 'T00:00:00')
    .lt('createdAt', yesterday + 'T23:59:59')
    .limit(1)

  const yesterdayEntry = yesterdayEntries && yesterdayEntries.length > 0

  let currentStreak = user.currentStreak || 0
  let longestStreak = user.longestStreak || 0
  let streakFreezeAvailable = user.streakFreezeAvailable ?? true
  let streakFrozenToday = false
  let canRestore = false

  const lastStreakDate = user.lastStreakDate ? getDateString(new Date(user.lastStreakDate)) : null
  const daysSinceLastStreak = lastStreakDate 
    ? Math.floor((now.getTime() - new Date(lastStreakDate).getTime()) / (24 * 60 * 60 * 1000))
    : Infinity

  // Logic:
  // If already logged today: no change needed
  // If logged yesterday: streak continues (if they log today)
  // If missed yesterday only: freeze activates (if available)
  // If missed 2+ days: streak breaks

  if (lastStreakDate === today) {
    // Already logged today, no change
  } else if (daysSinceLastStreak === 1) {
    // Yesterday was the last streak day
    // If they log today, streak continues
    if (todayEntry) {
      currentStreak += 1
      longestStreak = Math.max(longestStreak, currentStreak)
      
      // Regenerate freeze after 7 consecutive days
      if (currentStreak >= 7 && !streakFreezeAvailable) {
        streakFreezeAvailable = true
      }
    }
  } else if (daysSinceLastStreak === 2) {
    // Missed one day (yesterday)
    if (!yesterdayEntry && streakFreezeAvailable) {
      // Activate freeze
      streakFrozenToday = true
      streakFreezeAvailable = false
      
      await supabase
        .from('users')
        .update({
          streakFreezeAvailable: false,
          streakFreezeUsedAt: now.toISOString(),
        })
        .eq('id', userId)
      
      // If they log today, streak continues from freeze
      if (todayEntry) {
        // Streak stays the same (freeze covered the gap)
      }
    } else if (!streakFreezeAvailable) {
      // Streak breaks - check if can restore
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
      const lastRestore = user.lastStreakRestoreAt ? new Date(user.lastStreakRestoreAt) : null
      canRestore = !lastRestore || lastRestore < thirtyDaysAgo
      
      if (!canRestore) {
        currentStreak = todayEntry ? 1 : 0
      }
    }
  } else if (daysSinceLastStreak > 2) {
    // Missed 2+ days - streak breaks, no freeze can save it
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    const lastRestore = user.lastStreakRestoreAt ? new Date(user.lastStreakRestoreAt) : null
    canRestore = !lastRestore || lastRestore < thirtyDaysAgo
    
    if (!canRestore) {
      currentStreak = todayEntry ? 1 : 0
    }
  } else if (lastStreakDate === null) {
    // No streak history - start fresh
    currentStreak = todayEntry ? 1 : 0
  }

  // Update user streak data if there's an entry today
  let newBirdUnlocks: string[] = []
  let streakMilestoneReached: number | undefined

  if (todayEntry && lastStreakDate !== today) {
    await supabase
      .from('users')
      .update({
        currentStreak,
        longestStreak,
        lastStreakDate: now.toISOString(),
        streakFreezeAvailable,
      })
      .eq('id', userId)

    // Check for new bird unlocks after streak update
    try {
      newBirdUnlocks = await checkAndUnlockBirds(userId)
      
      // Track bird unlock analytics
      for (const birdId of newBirdUnlocks) {
        await trackEvent({
          userId,
          event: AnalyticsEvents.BIRD_UNLOCKED,
          properties: { birdId, method: 'milestone', trigger: 'streak' },
        })
      }
    } catch (err) {
      console.error('Error checking bird unlocks:', err)
    }

    // Check for streak milestones and track analytics
    const milestones = [7, 30, 50, 100, 200, 365]
    for (const milestone of milestones) {
      if (currentStreak === milestone) {
        streakMilestoneReached = milestone
        await trackEvent({
          userId,
          event: AnalyticsEvents.STREAK_MILESTONE_REACHED,
          properties: { milestone },
        })
        break
      }
    }
  }

  return {
    currentStreak,
    longestStreak,
    streakFreezeAvailable,
    streakFrozenToday,
    canRestore,
    newBirdUnlocks,
    streakMilestoneReached,
  }
}

/**
 * Restore a broken streak (once per month)
 */
export async function restoreStreak(userId: string): Promise<{ success: boolean; message?: string }> {
  const supabase = getSupabase()
  
  const { data: user, error } = await supabase
    .from('users')
    .select('currentStreak, lastStreakRestoreAt')
    .eq('id', userId)
    .single()

  if (error || !user) {
    return { success: false, message: 'User not found' }
  }

  const now = new Date()
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
  const lastRestore = user.lastStreakRestoreAt ? new Date(user.lastStreakRestoreAt) : null

  if (lastRestore && lastRestore > thirtyDaysAgo) {
    return { success: false, message: 'You can only restore once per month' }
  }

  await supabase
    .from('users')
    .update({ lastStreakRestoreAt: now.toISOString() })
    .eq('id', userId)

  return { success: true }
}

/**
 * Get date string in YYYY-MM-DD format
 */
function getDateString(date: Date): string {
  return date.toISOString().split('T')[0]
}

/**
 * Calculate current streak from entries (for fresh calculation)
 */
export async function calculateStreakFromEntries(userId: string): Promise<number> {
  const supabase = getSupabase()
  
  // Get entries where date matches createdAt (same-day entries), ordered by date desc
  const { data: entries, error } = await supabase
    .from('entries')
    .select('date, createdAt')
    .eq('userId', userId)
    .order('date', { ascending: false })
    .limit(365)

  if (error || !entries || entries.length === 0) return 0

  // Filter to same-day entries
  const sameDayEntries = entries.filter(e => {
    const entryDate = getDateString(new Date(e.date))
    const createdDate = getDateString(new Date(e.createdAt))
    return entryDate === createdDate
  })

  if (sameDayEntries.length === 0) return 0

  let streak = 0
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  for (let i = 0; i < sameDayEntries.length; i++) {
    const entryDate = new Date(sameDayEntries[i].date)
    entryDate.setHours(0, 0, 0, 0)

    const expectedDate = new Date(today)
    expectedDate.setDate(expectedDate.getDate() - i)

    if (entryDate.getTime() === expectedDate.getTime()) {
      streak++
    } else {
      break
    }
  }

  return streak
}
