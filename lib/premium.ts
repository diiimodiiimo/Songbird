import { getSupabase } from './supabase'

/**
 * Check if a user has premium access (via Clerk ID)
 */
export async function isPremiumUser(clerkId: string): Promise<boolean> {
  try {
    const supabase = getSupabase()
    const { data: user, error } = await supabase
      .from('users')
      .select('isPremium')
      .eq('clerkId', clerkId)
      .single()

    if (error) return false
    return user?.isPremium ?? false
  } catch (error) {
    console.error('[premium] Error checking premium status:', error)
    return false
  }
}

/**
 * Check if a user is a founding member (via Clerk ID)
 */
export async function isFoundingMember(clerkId: string): Promise<boolean> {
  try {
    const supabase = getSupabase()
    const { data: user, error } = await supabase
      .from('users')
      .select('isFoundingMember')
      .eq('clerkId', clerkId)
      .single()

    if (error) return false
    return user?.isFoundingMember ?? false
  } catch (error) {
    console.error('[premium] Error checking founding member status:', error)
    return false
  }
}

/**
 * Get full premium status for a user (via Clerk ID)
 */
export async function getUserPremiumStatus(clerkId: string): Promise<{
  isPremium: boolean
  isFoundingMember: boolean
  premiumSince: Date | null
  stripeCustomerId: string | null
}> {
  try {
    const supabase = getSupabase()
    const { data: user, error } = await supabase
      .from('users')
      .select('isPremium, isFoundingMember, premiumSince, stripeCustomerId')
      .eq('clerkId', clerkId)
      .single()

    if (error || !user) {
      return {
        isPremium: false,
        isFoundingMember: false,
        premiumSince: null,
        stripeCustomerId: null,
      }
    }

    return {
      isPremium: user.isPremium ?? false,
      isFoundingMember: user.isFoundingMember ?? false,
      premiumSince: user.premiumSince ? new Date(user.premiumSince) : null,
      stripeCustomerId: user.stripeCustomerId ?? null,
    }
  } catch (error) {
    console.error('[premium] Error getting premium status:', error)
    return {
      isPremium: false,
      isFoundingMember: false,
      premiumSince: null,
      stripeCustomerId: null,
    }
  }
}

/**
 * Check if a user has premium access (via database user ID)
 */
export async function isPremiumUserById(userId: string): Promise<boolean> {
  try {
    const supabase = getSupabase()
    const { data: user, error } = await supabase
      .from('users')
      .select('isPremium')
      .eq('id', userId)
      .single()

    if (error) return false
    return user?.isPremium ?? false
  } catch (error) {
    console.error('[premium] Error checking premium status by ID:', error)
    return false
  }
}

/**
 * Get founding member count (for checking availability)
 */
export async function getFoundingMemberCount(): Promise<number> {
  try {
    const supabase = getSupabase()
    const { count, error } = await supabase
      .from('users')
      .select('id', { count: 'exact', head: true })
      .eq('isFoundingMember', true)

    if (error) return 0
    return count || 0
  } catch (error) {
    console.error('[premium] Error getting founding member count:', error)
    return 0
  }
}

/**
 * Premium feature flags
 * Returns what features a user can access based on premium status
 */
export function getPremiumFeatures(isPremium: boolean) {
  return {
    // Birds: Premium users get all unlocked, free users earn via streaks
    allBirdsUnlocked: isPremium,
    // On This Day: Free = 30 days, Premium = full history
    onThisDayFullHistory: isPremium,
    // Analytics: Free = basic, Premium = full history
    analyticsFullHistory: isPremium,
    // Wrapped: Only premium
    wrappedEnabled: isPremium,
    // Data export: Only premium
    exportEnabled: isPremium,
    // Friend limit: Free = 20, Premium = unlimited
    friendLimit: isPremium ? Infinity : 20,
  }
}
