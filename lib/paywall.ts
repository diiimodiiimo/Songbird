import { getUserPremiumStatus } from './premium'

/**
 * Paywall limits and checks
 */

export const FREE_LIMITS = {
  ENTRIES_PER_MONTH: 30,
  FRIENDS_MAX: 20,
  ON_THIS_DAY_DAYS: 30, // Last 30 days only
} as const

export const PREMIUM_LIMITS = {
  ENTRIES_PER_MONTH: Infinity,
  FRIENDS_MAX: Infinity,
  ON_THIS_DAY_DAYS: Infinity, // Full history
} as const

/**
 * Check if user can create an entry (monthly limit check)
 */
export async function canCreateEntry(clerkUserId: string): Promise<{
  allowed: boolean
  reason?: string
  currentCount?: number
  limit?: number
}> {
  const status = await getUserPremiumStatus(clerkUserId)
  
  // Premium users have unlimited entries
  if (status.isPremium) {
    return { allowed: true }
  }

  // Free users: check monthly limit
  const { getSupabase } = await import('./supabase')
  const { getPrismaUserIdFromClerk } = await import('./clerk-sync')
  
  const userId = await getPrismaUserIdFromClerk(clerkUserId)
  if (!userId) {
    return { allowed: false, reason: 'User not found' }
  }

  const supabase = getSupabase()
  
  // Get current month's entries
  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999).toISOString()

  const { count, error } = await supabase
    .from('entries')
    .select('id', { count: 'exact', head: true })
    .eq('userId', userId)
    .gte('date', startOfMonth)
    .lte('date', endOfMonth)

  if (error) {
    console.error('[paywall] Error checking entry count:', error)
    return { allowed: false, reason: 'Error checking limit' }
  }

  const currentCount = count || 0
  const limit = FREE_LIMITS.ENTRIES_PER_MONTH

  if (currentCount >= limit) {
    return {
      allowed: false,
      reason: `You've reached your monthly limit of ${limit} entries. Upgrade to premium for unlimited entries.`,
      currentCount,
      limit,
    }
  }

  return {
    allowed: true,
    currentCount,
    limit,
  }
}

/**
 * Check if user can add more friends
 */
export async function canAddFriend(clerkUserId: string): Promise<{
  allowed: boolean
  reason?: string
  currentCount?: number
  limit?: number
}> {
  const status = await getUserPremiumStatus(clerkUserId)
  
  // Premium users have unlimited friends
  if (status.isPremium) {
    return { allowed: true }
  }

  // Free users: check friend limit
  const { getSupabase } = await import('./supabase')
  const { getPrismaUserIdFromClerk } = await import('./clerk-sync')
  
  const userId = await getPrismaUserIdFromClerk(clerkUserId)
  if (!userId) {
    return { allowed: false, reason: 'User not found' }
  }

  const supabase = getSupabase()
  
  // Count accepted friend requests
  const { count, error } = await supabase
    .from('friend_requests')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'accepted')
    .or(`senderId.eq.${userId},receiverId.eq.${userId}`)

  if (error) {
    console.error('[paywall] Error checking friend count:', error)
    return { allowed: false, reason: 'Error checking limit' }
  }

  const currentCount = count || 0
  const limit = FREE_LIMITS.FRIENDS_MAX

  if (currentCount >= limit) {
    return {
      allowed: false,
      reason: `You've reached your friend limit of ${limit}. Upgrade to premium for unlimited friends.`,
      currentCount,
      limit,
    }
  }

  return {
    allowed: true,
    currentCount,
    limit,
  }
}

/**
 * Check if user can access Wrapped feature
 */
export async function canAccessWrapped(clerkUserId: string): Promise<{
  allowed: boolean
  reason?: string
}> {
  const status = await getUserPremiumStatus(clerkUserId)
  
  if (status.isPremium) {
    return { allowed: true }
  }

  return {
    allowed: false,
    reason: 'Wrapped is a premium feature. Upgrade to access your year-end music summary.',
  }
}

/**
 * Check if user can access full analytics history
 */
export async function canAccessFullAnalytics(clerkUserId: string): Promise<{
  allowed: boolean
  reason?: string
  limit?: number // Days limit for free users
}> {
  const status = await getUserPremiumStatus(clerkUserId)
  
  if (status.isPremium) {
    return { allowed: true }
  }

  return {
    allowed: false,
    reason: 'Full analytics history is a premium feature. Upgrade to see your complete music journey.',
    limit: FREE_LIMITS.ON_THIS_DAY_DAYS,
  }
}

/**
 * Get the date limit for "On This Day" feature
 * Free users: last 30 days only
 * Premium users: full history
 */
export async function getOnThisDayDateLimit(clerkUserId: string): Promise<Date | null> {
  const status = await getUserPremiumStatus(clerkUserId)
  
  if (status.isPremium) {
    return null // No limit for premium
  }

  // Free users: 30 days ago
  const limitDate = new Date()
  limitDate.setDate(limitDate.getDate() - FREE_LIMITS.ON_THIS_DAY_DAYS)
  return limitDate
}

/**
 * Get user's current usage stats
 */
export async function getUserUsageStats(clerkUserId: string): Promise<{
  entriesThisMonth: number
  entriesLimit: number
  friendsCount: number
  friendsLimit: number
  isPremium: boolean
}> {
  const status = await getUserPremiumStatus(clerkUserId)
  const { getSupabase } = await import('./supabase')
  const { getPrismaUserIdFromClerk } = await import('./clerk-sync')
  
  const userId = await getPrismaUserIdFromClerk(clerkUserId)
  if (!userId) {
    return {
      entriesThisMonth: 0,
      entriesLimit: FREE_LIMITS.ENTRIES_PER_MONTH,
      friendsCount: 0,
      friendsLimit: FREE_LIMITS.FRIENDS_MAX,
      isPremium: false,
    }
  }

  const supabase = getSupabase()
  
  // Get current month's entries
  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999).toISOString()

  const [entriesResult, friendsResult] = await Promise.all([
    supabase
      .from('entries')
      .select('id', { count: 'exact', head: true })
      .eq('userId', userId)
      .gte('date', startOfMonth)
      .lte('date', endOfMonth),
    supabase
      .from('friend_requests')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'accepted')
      .or(`senderId.eq.${userId},receiverId.eq.${userId}`),
  ])

  return {
    entriesThisMonth: entriesResult.count || 0,
    entriesLimit: status.isPremium ? Infinity : FREE_LIMITS.ENTRIES_PER_MONTH,
    friendsCount: friendsResult.count || 0,
    friendsLimit: status.isPremium ? Infinity : FREE_LIMITS.FRIENDS_MAX,
    isPremium: status.isPremium,
  }
}


