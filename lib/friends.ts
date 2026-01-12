import { getSupabase } from './supabase'

/**
 * Check if two users are friends (have an accepted friend request)
 */
export async function areFriends(userId1: string, userId2: string): Promise<boolean> {
  const supabase = getSupabase()
  
  const { data } = await supabase
    .from('friend_requests')
    .select('id')
    .eq('status', 'accepted')
    .or(`and(senderId.eq.${userId1},receiverId.eq.${userId2}),and(senderId.eq.${userId2},receiverId.eq.${userId1})`)
    .limit(1)
    .maybeSingle()

  return !!data
}

/**
 * Get all friend IDs for a user
 */
export async function getFriendIds(userId: string): Promise<string[]> {
  const supabase = getSupabase()
  
  const { data: friendRequests } = await supabase
    .from('friend_requests')
    .select('senderId, receiverId')
    .eq('status', 'accepted')
    .or(`senderId.eq.${userId},receiverId.eq.${userId}`)

  if (!friendRequests) return []

  return friendRequests.map((request) =>
    request.senderId === userId ? request.receiverId : request.senderId
  )
}
