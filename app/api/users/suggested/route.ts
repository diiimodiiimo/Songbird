import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { getSupabase } from '@/lib/supabase'
import { getUserIdFromClerk } from '@/lib/clerk-sync'
import { getFriendIds } from '@/lib/friends'
import { checkRateLimit, getRateLimitHeaders } from '@/lib/rate-limit'

// GET - Get suggested users sorted by mutual friends count
export async function GET(request: Request) {
  try {
    const { userId: clerkUserId } = await auth()

    if (!clerkUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Rate limiting
    const rateLimitResult = await checkRateLimit(clerkUserId, 'READ')
    if (!rateLimitResult.allowed) {
      return rateLimitResult.response!
    }

    const userId = await getUserIdFromClerk(clerkUserId)
    if (!userId) {
      return NextResponse.json({ error: 'User not found in database' }, { status: 404 })
    }

    const { searchParams } = new URL(request.url)
    const limitParam = searchParams.get('limit')
    const limit = limitParam ? Math.min(parseInt(limitParam, 10), 50) : 20

    const supabase = getSupabase()

    // Get current user's friend IDs
    const myFriendIds = await getFriendIds(userId)
    const myFriendSet = new Set(myFriendIds)

    // Get all pending friend request user IDs (both sent and received) to exclude them
    const { data: pendingRequests } = await supabase
      .from('friend_requests')
      .select('senderId, receiverId')
      .eq('status', 'pending')
      .or(`senderId.eq.${userId},receiverId.eq.${userId}`)

    const pendingUserIds = new Set<string>()
    ;(pendingRequests || []).forEach(r => {
      if (r.senderId === userId) pendingUserIds.add(r.receiverId)
      if (r.receiverId === userId) pendingUserIds.add(r.senderId)
    })

    // Get blocked user IDs to exclude them
    const { data: blockedUsers } = await supabase
      .from('blocked_users')
      .select('blockedId, blockerId')
      .or(`blockerId.eq.${userId},blockedId.eq.${userId}`)

    const blockedUserIds = new Set<string>()
    ;(blockedUsers || []).forEach(b => {
      if (b.blockerId === userId) blockedUserIds.add(b.blockedId)
      if (b.blockedId === userId) blockedUserIds.add(b.blockerId)
    })

    // Get all users except the current user
    const { data: allUsers, error } = await supabase
      .from('users')
      .select('id, username, name, image')
      .neq('id', userId)
      .not('username', 'is', null)

    if (error) throw error

    // Filter out existing friends, pending requests, and blocked users
    const candidates = (allUsers || []).filter(
      u => !myFriendSet.has(u.id) && !pendingUserIds.has(u.id) && !blockedUserIds.has(u.id)
    )

    if (candidates.length === 0) {
      return NextResponse.json({ users: [] }, {
        headers: await getRateLimitHeaders(clerkUserId, 'READ'),
      })
    }

    // For each candidate, compute mutual friends count
    // Get all accepted friend requests for candidate users in bulk
    const candidateIds = candidates.map(c => c.id)

    const { data: candidateFriendships } = await supabase
      .from('friend_requests')
      .select('senderId, receiverId')
      .eq('status', 'accepted')
      .or(
        candidateIds
          .map(id => `senderId.eq.${id},receiverId.eq.${id}`)
          .join(',')
      )

    // Build a map: candidateId -> Set of their friend IDs
    const candidateFriendsMap = new Map<string, Set<string>>()
    ;(candidateFriendships || []).forEach(fr => {
      // For sender
      if (candidateIds.includes(fr.senderId)) {
        const friends = candidateFriendsMap.get(fr.senderId) || new Set()
        friends.add(fr.receiverId)
        candidateFriendsMap.set(fr.senderId, friends)
      }
      // For receiver
      if (candidateIds.includes(fr.receiverId)) {
        const friends = candidateFriendsMap.get(fr.receiverId) || new Set()
        friends.add(fr.senderId)
        candidateFriendsMap.set(fr.receiverId, friends)
      }
    })

    // Calculate mutual friends for each candidate
    const usersWithMutuals = candidates.map(user => {
      const theirFriends = candidateFriendsMap.get(user.id) || new Set()
      let mutualCount = 0
      for (const friendId of myFriendIds) {
        if (theirFriends.has(friendId)) {
          mutualCount++
        }
      }
      return {
        id: user.id,
        username: user.username,
        name: user.name,
        image: user.image,
        mutualFriends: mutualCount,
      }
    })

    // Only show users who have at least one mutual friend
    const withMutuals = usersWithMutuals.filter(u => u.mutualFriends > 0)

    // Sort by mutual friends descending, then by name alphabetically
    withMutuals.sort((a, b) => {
      if (b.mutualFriends !== a.mutualFriends) return b.mutualFriends - a.mutualFriends
      return (a.name || a.username || '').localeCompare(b.name || b.username || '')
    })

    const result = withMutuals.slice(0, limit)

    return NextResponse.json({ users: result }, {
      headers: await getRateLimitHeaders(clerkUserId, 'READ'),
    })
  } catch (error: any) {
    console.error('[users/suggested] Error:', error?.message || error)
    return NextResponse.json(
      { error: 'Failed to fetch suggested users', message: error?.message },
      { status: 500 }
    )
  }
}


