import { getSupabase } from './supabase'

/**
 * Check if a user is blocked by another user
 */
export async function isUserBlocked(blockerId: string, blockedId: string): Promise<boolean> {
  const supabase = getSupabase()
  
  const { data } = await supabase
    .from('blocked_users')
    .select('id')
    .eq('blockerId', blockerId)
    .eq('blockedId', blockedId)
    .maybeSingle()

  return !!data
}

/**
 * Get all blocked user IDs for a user
 */
export async function getBlockedUserIds(userId: string): Promise<string[]> {
  const supabase = getSupabase()
  
  const { data } = await supabase
    .from('blocked_users')
    .select('blockedId')
    .eq('blockerId', userId)

  return (data || []).map(b => b.blockedId)
}

/**
 * Check if current user has blocked or is blocked by another user
 */
export async function getBlockStatus(userId1: string, userId2: string): Promise<{
  user1BlockedUser2: boolean
  user2BlockedUser1: boolean
}> {
  const supabase = getSupabase()
  
  const [block1, block2] = await Promise.all([
    supabase
      .from('blocked_users')
      .select('id')
      .eq('blockerId', userId1)
      .eq('blockedId', userId2)
      .maybeSingle(),
    supabase
      .from('blocked_users')
      .select('id')
      .eq('blockerId', userId2)
      .eq('blockedId', userId1)
      .maybeSingle(),
  ])

  return {
    user1BlockedUser2: !!block1.data,
    user2BlockedUser1: !!block2.data,
  }
}


