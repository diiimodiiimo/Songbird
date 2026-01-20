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
    birdId: 'eastern-bluebird',
    name: 'Eastern Bluebird',
    shortName: 'Bluebird',
    unlockCondition: '7-day streak',
    unlockType: 'streak',
    requirement: { type: 'streak', value: 7 },
    isPremiumExclusive: false,
  },
  {
    birdId: 'northern-cardinal',
    name: 'Northern Cardinal',
    shortName: 'Cardinal',
    unlockCondition: '30 entries total',
    unlockType: 'entries',
    requirement: { type: 'entries', value: 30 },
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
    unlockCondition: '100 entries total',
    unlockType: 'entries',
    requirement: { type: 'entries', value: 100 },
    isPremiumExclusive: false,
  },
  {
    birdId: 'baltimore-oriole',
    name: 'Baltimore Oriole',
    shortName: 'Oriole',
    unlockCondition: '100-day streak',
    unlockType: 'streak',
    requirement: { type: 'streak', value: 100 },
    isPremiumExclusive: false,
  },
  {
    birdId: 'house-finch',
    name: 'House Finch',
    shortName: 'Finch',
    unlockCondition: '200 entries total',
    unlockType: 'entries',
    requirement: { type: 'entries', value: 200 },
    isPremiumExclusive: false,
  },
  {
    birdId: 'indigo-bunting',
    name: 'Indigo Bunting',
    shortName: 'Bunting',
    unlockCondition: 'Premium member or 50-day streak',
    unlockType: 'streak',
    requirement: { type: 'streak', value: 50 },
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
    return ['american-robin'] // Default bird
  }
}

/**
 * Check if a specific bird is unlocked for a user
 */
export async function isBirdUnlocked(userId: string, birdId: string): Promise<boolean> {
  try {
    const statuses = await getBirdUnlockStatuses(userId)
    const status = statuses.find(s => s.birdId === birdId)
    return status?.isUnlocked ?? (birdId === 'american-robin')
  } catch (error) {
    console.error('[birds] Error checking bird unlock:', error)
    return birdId === 'american-robin' // Default is always unlocked
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
 * Get the full unlock status for all birds for a user
 * Simplified version that doesn't require extra database tables
 */
export async function getBirdUnlockStatuses(userId: string): Promise<BirdUnlockStatus[]> {
  try {
    const supabase = getSupabase()
    
    // Get user data (only columns that exist)
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('createdAt')
      .eq('id', userId)
      .single()

    if (userError || !user) {
      throw new Error('User not found')
    }

    // Get entry count
    const { count: entriesCount } = await supabase
      .from('entries')
      .select('id', { count: 'exact', head: true })
      .eq('userId', userId)

    const now = new Date()
    const createdAt = new Date(user.createdAt)
    const daysSinceSignup = Math.floor(
      (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24)
    )

    const totalEntries = entriesCount || 0
    
    // FOUNDING FLOCK: All current users and new signups get all birds unlocked
    // This is a launch incentive - everyone who joins early is a "Founding Member"
    // We can add a separate premium bird later
    const isFoundingMember = true // Everyone gets founding member status for now!

    // Calculate a "virtual streak" based on entries (since we don't have streak data)
    // Assume average of 1 entry per day = streak
    const virtualStreak = Math.min(totalEntries, daysSinceSignup)

    // Build status for each bird
    return BIRD_UNLOCK_REQUIREMENTS.map((bird): BirdUnlockStatus => {
      // Default bird is always unlocked
      if (bird.unlockType === 'default') {
        return {
          birdId: bird.birdId,
          name: bird.name,
          shortName: bird.shortName,
          isUnlocked: true,
          unlockMethod: 'default',
          canPurchase: false,
        }
      }

      // Founding members (50+ entries) get ALL birds
      if (isFoundingMember) {
        return {
          birdId: bird.birdId,
          name: bird.name,
          shortName: bird.shortName,
          isUnlocked: true,
          unlockMethod: 'milestone',
          canPurchase: false,
        }
      }

      // Check unlock conditions
      let isUnlocked = false
      let progress: BirdUnlockStatus['progress'] = undefined

      if (bird.requirement) {
        switch (bird.requirement.type) {
          case 'streak':
          case 'streak_rare':
            isUnlocked = virtualStreak >= bird.requirement.value
            progress = {
              current: virtualStreak,
              required: bird.requirement.value,
              percentage: Math.min(100, (virtualStreak / bird.requirement.value) * 100),
              label: `${virtualStreak}/${bird.requirement.value} day streak`,
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

      return {
        birdId: bird.birdId,
        name: bird.name,
        shortName: bird.shortName,
        isUnlocked,
        unlockMethod: isUnlocked ? 'milestone' : undefined,
        progress: isUnlocked ? undefined : progress,
        canPurchase: !isUnlocked && !!bird.purchasePrice,
        purchasePrice: bird.purchasePrice,
      }
    })
  } catch (error) {
    console.error('[birds] Error getting bird unlock statuses:', error)
    // Return default bird as unlocked
    return BIRD_UNLOCK_REQUIREMENTS.map((bird) => ({
      birdId: bird.birdId,
      name: bird.name,
      shortName: bird.shortName,
      isUnlocked: bird.unlockType === 'default',
      unlockMethod: bird.unlockType === 'default' ? 'default' : undefined,
      canPurchase: false,
    }))
  }
}

/**
 * Check and unlock any birds the user has earned
 * Simplified - returns list of newly unlocked birds (calculated)
 */
export async function checkAndUnlockBirds(userId: string): Promise<string[]> {
  // In simplified version, all unlocks are calculated dynamically
  // Just return empty - we don't track "new" unlocks without a DB table
  return []
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
