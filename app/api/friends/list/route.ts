import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { getSupabase } from '@/lib/supabase'
import { getPrismaUserIdFromClerk } from '@/lib/clerk-sync'

// GET - List all friends (accepted friend requests)
export async function GET() {
  try {
    const { userId: clerkUserId } = await auth()
    if (!clerkUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = await getPrismaUserIdFromClerk(clerkUserId)
    if (!userId) {
      return NextResponse.json({ error: 'User not found in database' }, { status: 404 })
    }

    const supabase = getSupabase()

    // Get all accepted friend requests
    const { data: friendRequests, error } = await supabase
      .from('friend_requests')
      .select('senderId, receiverId')
      .eq('status', 'accepted')
      .or(`senderId.eq.${userId},receiverId.eq.${userId}`)

    if (error) throw error

    if (!friendRequests || friendRequests.length === 0) {
      return NextResponse.json({ friends: [] })
    }

    // Get friend IDs
    const friendIds = friendRequests.map((request) =>
      request.senderId === userId ? request.receiverId : request.senderId
    )

    // Get friend user info
    const { data: friends } = await supabase
      .from('users')
      .select('id, email, name, image')
      .in('id', friendIds)

    return NextResponse.json({ friends: friends || [] })
  } catch (error: any) {
    console.error('[friends/list] Error:', error?.message || error)
    return NextResponse.json(
      { error: 'Failed to fetch friends', message: error?.message },
      { status: 500 }
    )
  }
}
