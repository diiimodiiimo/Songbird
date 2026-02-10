/**
 * SongBird Bird Unlock System
 * Tracks which birds users have unlocked based on milestones, streaks, or purchases
 */

import { getSupabase } from '@/lib/supabase'
import type { ThemeId } from '@/lib/theme'

// Simple cuid-like generator (no external dependencies)
function generateId(): string {
  const timestamp = Date.now().toString(36)
  const randomPart = Math.random().toString(36).substring(2, 15)
  const randomPart2 = Math.random().toString(36).substring(2, 15)
  return `c${timestamp}${randomPart}${randomPart2}`
}

// ==========================================
// Bird Unlock Requirements
// ==========================================

export interface BirdUnlockRequirement {
  birdId: ThemeId
  name: string
  shortName: string
  unlockCondition: string
  unlockType: 'default' | 'streak' | 'entries' | 'time' | 'premium' | 'rare'
  requirement: {
    type: 'streak' | 'entries' | 'days_since_signup' | 'premium' | 'streak_rare'
    value: number
  } | null // null for default birds
  isPremiumExclusive: boolean
  purchasePrice?: number // in cents, if purchasable
}

export const BIRD_UNLOCK_REQUIREMENTS: BirdUnlockRequirement[] = [
  {
    birdId: 'american-robin',
    name: 'American Robin',
    shortName: 'Robin',
    unlockCondition: 'Default bird (everyone starts with this)',
    unlockType: 'default',
    requirement: null,
    isPremiumExclusive: false,
  },
  {
    birdId: 'northern-cardinal',
    name: 'Northern Cardinal',
    shortName: 'Cardinal',
    unlockCondition: 'Default bird (everyone starts with this)',
    unlockType: 'default',
    requirement: null,
    isPremiumExclusive: false,
  },
  {
    birdId: 'eastern-bluebird',
    name: 'Eastern Bluebird',
    shortName: 'Bluebird',
    unlockCondition: '7-day streak',
    unlockType: 'streak',
    requirement: { type: 'streak', value: 7 },
    isPremiumExclusive: false,
  },
  {
    birdId: 'american-goldfinch',
    name: 'American Goldfinch',
    shortName: 'Goldfinch',
    unlockCondition: '30-day streak',
    unlockType: 'streak',
    requirement: { type: 'streak', value: 30 },
    isPremiumExclusive: false,
  },
  {
    birdId: 'black-capped-chickadee',
    name: 'Black-capped Chickadee',
    shortName: 'Chickadee',
    unlockCondition: '50 entries total',
    unlockType: 'entries',
    requirement: { type: 'entries', value: 50 },
    isPremiumExclusive: false,
  },
  {
    birdId: 'baltimore-oriole',
    name: 'Baltimore Oriole',
    shortName: 'Oriole',
    unlockCondition: '50-day streak',
    unlockType: 'streak',
    requirement: { type: 'streak', value: 50 },
    isPremiumExclusive: false,
  },
  {
    birdId: 'house-finch',
    name: 'House Finch',
    shortName: 'Finch',
    unlockCondition: '100 entries total',
    unlockType: 'entries',
    requirement: { type: 'entries', value: 100 },
    isPremiumExclusive: false,
  },
  {
    birdId: 'indigo-bunting',
    name: 'Indigo Bunting',
    shortName: 'Bunting',
    unlockCondition: 'Premium member or 30-day streak',
    unlockType: 'streak',
    requirement: { type: 'streak', value: 30 },
    isPremiumExclusive: false,
    purchasePrice: 299, // $2.99
  },
  {
    birdId: 'cedar-waxwing',
    name: 'Cedar Waxwing',
    shortName: 'Waxwing',
    unlockCondition: '1 year on SongBird',
    unlockType: 'time',
    requirement: { type: 'days_since_signup', value: 365 },
    isPremiumExclusive: false,
  },
  {
    birdId: 'painted-bunting',
    name: 'Painted Bunting',
    shortName: 'Painted',
    unlockCondition: '365-day streak (rare!) or Premium',
    unlockType: 'rare',
    requirement: { type: 'streak_rare', value: 365 },
    isPremiumExclusive: true, // Premium gets this, or earn via 365-day streak
  },
]

// ==========================================
// Unlock Status Types
// ==========================================

export interface BirdUnlockStatus {
  birdId: ThemeId
  name: string
  shortName: string
  isUnlocked: boolean
  unlockMethod?: 'milestone' | 'purchased' | 'premium' | 'default'
  unlockedAt?: Date
  progress?: {
    current: number
    required: number
    percentage: number
    label: string
  }
  canPurchase: boolean
  purchasePrice?: number
  unlockCondition: string // Human-readable unlock requirement
}

// ==========================================
// Core Functions
// ==========================================

/**
 * Get all unlocked birds for a user (simplified - calculates based on entries)
 */
export async function getUnlockedBirds(userId: string): Promise<string[]> {
  try {
    const statuses = await getBirdUnlockStatuses(userId)
    return statuses.filter(s => s.isUnlocked).map(s => s.birdId)
  } catch (error) {
    console.error('[birds] Error getting unlocked birds:', error)
    return ['american-robin', 'northern-cardinal'] // Default birds
  }
}

/**
 * Check if a specific bird is unlocked for a user
 */
export async function isBirdUnlocked(userId: string, birdId: string): Promise<boolean> {
  try {
    const statuses = await getBirdUnlockStatuses(userId)
    const status = statuses.find(s => s.birdId === birdId)
    return status?.isUnlocked ?? (birdId === 'american-robin' || birdId === 'northern-cardinal')
  } catch (error) {
    console.error('[birds] Error checking bird unlock:', error)
    return birdId === 'american-robin' || birdId === 'northern-cardinal' // Default birds always unlocked
  }
}

/**
 * Unlock a bird for a user (no-op in simplified version - unlocks are calculated)
 */
export async function unlockBird(
  userId: string,
  birdId: string,
  method: 'milestone' | 'purchased' | 'premium' | 'default'
): Promise<void> {
  // No-op - unlocks are calculated dynamically based on entries
  console.log(`[birds] Bird ${birdId} unlocked for ${userId} via ${method}`)
}

/**
 * Calculate streak from entries (fallback when column doesn't exist)
 */
async function calculateStreakFromEntries(userId: string): Promise<number> {
  try {
    const supabase = getSupabase()
    const { data: entries, error } = await supabase
      .from('entries')
      .select('date, createdAt')
      .eq('userId', userId)
      .order('date', { ascending: false })
      .limit(365)

    if (error || !entries || entries.length === 0) return 0

    // Filter to same-day entries (entry logged on the same day as entry.date)
    const sameDayEntries = entries.filter((e: any) => {
      const entryDate = new Date(e.date).toISOString().split('T')[0]
      const createdDate = new Date(e.createdAt).toISOString().split('T')[0]
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
  } catch (error) {
    console.error('[birds] Error calculating streak from entries:', error)
    return 0
  }
}

/**
 * Get the full unlock status for all birds for a user
 * userId MUST be the database users.id (from Supabase)
 */
export async function getBirdUnlockStatuses(userId: string): Promise<BirdUnlockStatus[]> {
  try {
    const supabase = getSupabase()
    
    console.log('[birds] Getting unlock statuses for database userId:', userId)
    
    // Query user - only select columns that exist (don't select currentStreak/longestStreak if they don't exist)
    // Try to get all columns, but handle gracefully if some don't exist
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, createdAt, isPremium, isFoundingMember')
      .eq('id', userId)
      .maybeSingle()
    
    if (userError) {
      console.error('[birds] User query error:', {
        userId,
        error: userError.message,
        code: userError.code,
        details: userError.details,
      })
      throw new Error(`Failed to query user: ${userError.message}`)
    }
    
    if (!user) {
      console.error('[birds] User not found in database:', userId)
      throw new Error(`User not found: ${userId}`)
    }

    // Check premium status FIRST - premium users get all birds
    const isPremium = Boolean(user.isPremium) || Boolean(user.isFoundingMember)
    
    console.log('[birds] Found user:', {
      id: user.id,
      createdAt: user.createdAt,
      isPremium,
      isFoundingMember: user.isFoundingMember,
    })
    
    // Premium/Founding Flock users get all birds unlocked - check this FIRST
    if (isPremium) {
      console.log('[birds] User is premium/founding member - unlocking all birds')
      return BIRD_UNLOCK_REQUIREMENTS.map((bird): BirdUnlockStatus => ({
        birdId: bird.birdId,
        name: bird.name,
        shortName: bird.shortName,
        isUnlocked: true,
        unlockMethod: 'premium',
        canPurchase: false,
        unlockCondition: bird.unlockCondition,
      }))
    }

    // Get entry count using the database user id
    const { count: entriesCount, error: countError } = await supabase
      .from('entries')
      .select('id', { count: 'exact', head: true })
      .eq('userId', user.id)
    
    if (countError) {
      console.error('[birds] Entry count error:', countError)
      // Don't throw - continue with 0 entries
    }

    // Try to get streak from column, fallback to calculating from entries
    let currentStreak = 0
    try {
      const { data: streakData, error: streakError } = await supabase
        .from('users')
        .select('currentStreak')
        .eq('id', userId)
        .maybeSingle()
      
      if (!streakError && streakData?.currentStreak != null) {
        currentStreak = streakData.currentStreak || 0
      } else {
        // Column doesn't exist or is null - calculate from entries
        console.log('[birds] Streak column missing or null, calculating from entries')
        currentStreak = await calculateStreakFromEntries(userId)
      }
    } catch (streakErr: any) {
      // Column doesn't exist - calculate from entries
      if (streakErr?.code === '42703' || streakErr?.message?.includes('does not exist')) {
        console.log('[birds] Streak column does not exist, calculating from entries')
        currentStreak = await calculateStreakFromEntries(userId)
      } else {
        console.error('[birds] Error getting streak:', streakErr)
        currentStreak = await calculateStreakFromEntries(userId)
      }
    }

    const now = new Date()
    const createdAt = new Date(user.createdAt)
    const daysSinceSignup = Math.floor(
      (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24)
    )

    const totalEntries = entriesCount || 0
    
    console.log('[birds] User stats for unlock calculation:', {
      userId: user.id,
      totalEntries,
      currentStreak,
      isPremium,
      isFoundingMember: user.isFoundingMember,
      daysSinceSignup,
    })

    // Build status for each bird
    const statuses = BIRD_UNLOCK_REQUIREMENTS.map((bird): BirdUnlockStatus => {
      // Default birds are always unlocked
      if (bird.unlockType === 'default') {
        return {
          birdId: bird.birdId,
          name: bird.name,
          shortName: bird.shortName,
          isUnlocked: true,
          unlockMethod: 'default',
          canPurchase: false,
          unlockCondition: bird.unlockCondition,
        }
      }

      // Check unlock conditions
      let isUnlocked = false
      let progress: BirdUnlockStatus['progress'] = undefined

      if (bird.requirement) {
        switch (bird.requirement.type) {
          case 'streak':
          case 'streak_rare':
            isUnlocked = currentStreak >= bird.requirement.value
            progress = {
              current: currentStreak,
              required: bird.requirement.value,
              percentage: Math.min(100, (currentStreak / bird.requirement.value) * 100),
              label: `${currentStreak}/${bird.requirement.value} day streak`,
            }
            break
          case 'entries':
            isUnlocked = totalEntries >= bird.requirement.value
            progress = {
              current: totalEntries,
              required: bird.requirement.value,
              percentage: Math.min(100, (totalEntries / bird.requirement.value) * 100),
              label: `${totalEntries}/${bird.requirement.value} entries`,
            }
            break
          case 'days_since_signup':
            isUnlocked = daysSinceSignup >= bird.requirement.value
            progress = {
              current: daysSinceSignup,
              required: bird.requirement.value,
              percentage: Math.min(100, (daysSinceSignup / bird.requirement.value) * 100),
              label: `${daysSinceSignup}/${bird.requirement.value} days`,
            }
            break
        }
      }

      // Premium exclusive birds are unlocked for premium users
      if (bird.isPremiumExclusive && isPremium) {
        isUnlocked = true
      }

      return {
        birdId: bird.birdId,
        name: bird.name,
        shortName: bird.shortName,
        isUnlocked,
        unlockMethod: isUnlocked ? (isPremium ? 'premium' : 'milestone') : undefined,
        progress: isUnlocked ? undefined : progress,
        canPurchase: !isUnlocked && !!bird.purchasePrice && !isPremium,
        purchasePrice: bird.purchasePrice,
        unlockCondition: bird.unlockCondition,
      }
    })
    
    console.log('[birds] Calculated bird statuses:', {
      total: statuses.length,
      unlocked: statuses.filter(s => s.isUnlocked).length,
      defaultBirds: statuses.filter(s => s.unlockMethod === 'default').length,
    })
    
    return statuses
  } catch (error) {
    console.error('[birds] Error getting bird unlock statuses:', error)
    // Return default bird as unlocked
    const fallbackStatuses = BIRD_UNLOCK_REQUIREMENTS.map((bird) => ({
      birdId: bird.birdId,
      name: bird.name,
      shortName: bird.shortName,
      isUnlocked: bird.unlockType === 'default',
      unlockMethod: bird.unlockType === 'default' ? 'default' : undefined,
      canPurchase: false,
      unlockCondition: bird.unlockCondition,
    }))
    console.log('[birds] Returning fallback statuses (default birds only):', {
      total: fallbackStatuses.length,
      unlocked: fallbackStatuses.filter(s => s.isUnlocked).length,
    })
    return fallbackStatuses
  }
}

/**
 * Check and unlock any birds the user has earned
 * Returns list of newly unlocked birds based on current stats
 */
export async function checkAndUnlockBirds(userId: string): Promise<string[]> {
  try {
    const statuses = await getBirdUnlockStatuses(userId)
    const newlyUnlocked = statuses
      .filter(s => s.isUnlocked && s.unlockMethod === 'milestone')
      .map(s => s.birdId)
    
    // In a full implementation, you'd track which birds were just unlocked
    // For now, we return empty since unlocks are calculated dynamically
    return []
  } catch (error) {
    console.error('[birds] Error checking bird unlocks:', error)
    return []
  }
}

/**
 * Unlock all birds for premium user (no-op in simplified version)
 */
export async function unlockAllBirdsForPremium(userId: string): Promise<void> {
  // No-op - founding members (50+ entries) get all birds automatically
  console.log(`[birds] All birds unlocked for premium user ${userId}`)
}

/**
 * Initialize default bird for new user (no-op in simplified version)
 */
export async function initializeDefaultBird(userId: string): Promise<void> {
  // No-op - default bird is always available
  console.log(`[birds] Default bird initialized for ${userId}`)
}

/**
 * Get next unlockable bird with closest progress
 */
export async function getNextUnlockableBird(userId: string): Promise<BirdUnlockStatus | null> {
  const statuses = await getBirdUnlockStatuses(userId)
  
  // Find locked birds with progress, sorted by closest to unlock
  const lockedWithProgress = statuses
    .filter(s => !s.isUnlocked && s.progress)
    .sort((a, b) => (b.progress?.percentage ?? 0) - (a.progress?.percentage ?? 0))

  return lockedWithProgress[0] || null
}
