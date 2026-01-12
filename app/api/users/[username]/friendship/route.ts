import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { getSupabase } from '@/lib/supabase'
import { getPrismaUserIdFromClerk } from '@/lib/clerk-sync'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ username: string }> }
) {
  try {
    const { userId: clerkUserId } = await auth()
    if (!clerkUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const currentUserId = await getPrismaUserIdFromClerk(clerkUserId)
    if (!currentUserId) {
      return NextResponse.json({ error: 'User not found in database' }, { status: 404 })
    }

    const { username } = await params
    const supabase = getSupabase()

    // Find the profile user by username, email, or name
    let { data: profileUser } = await supabase
      .from('users')
      .select('id')
      .or(`username.eq.${username},email.eq.${username}`)
      .maybeSingle()

    // If not found, try case-insensitive name search
    if (!profileUser) {
      const searchTerm = username.toLowerCase()
      const { data: allUsers } = await supabase
        .from('users')
        .select('id, name, email')
      
      const foundUser = (allUsers || []).find(u => 
        u.name?.toLowerCase() === searchTerm ||
        u.email?.toLowerCase().split('@')[0] === searchTerm
      )
      if (foundUser) {
        profileUser = { id: foundUser.id }
      }
    }

    if (!profileUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Check if it's the same user
    if (profileUser.id === currentUserId) {
      return NextResponse.json({ 
        isOwnProfile: true,
        isFriend: false,
        hasPendingRequest: false,
        requestDirection: null,
      })
    }

    // Check friendship status
    const { data: friendRequest } = await supabase
      .from('friend_requests')
      .select('id, senderId, receiverId, status')
      .or(`and(senderId.eq.${currentUserId},receiverId.eq.${profileUser.id}),and(senderId.eq.${profileUser.id},receiverId.eq.${currentUserId})`)
      .maybeSingle()

    if (!friendRequest) {
      return NextResponse.json({
        isOwnProfile: false,
        isFriend: false,
        hasPendingRequest: false,
        requestDirection: null,
      })
    }

    const isFriend = friendRequest.status === 'accepted'
    const hasPendingRequest = friendRequest.status === 'pending'
    const requestDirection = friendRequest.senderId === currentUserId ? 'sent' : 'received'

    return NextResponse.json({
      isOwnProfile: false,
      isFriend,
      hasPendingRequest,
      requestDirection,
      requestId: friendRequest.id,
    })
  } catch (error: any) {
    console.error('[users/[username]/friendship] Error:', error?.message || error)
    return NextResponse.json(
      { error: 'Failed to check friendship status', message: error?.message },
      { status: 500 }
    )
  }
}
