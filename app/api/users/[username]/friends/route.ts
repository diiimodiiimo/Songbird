import { NextResponse } from 'next/server'
import { getSupabase } from '@/lib/supabase'

// GET - Get public friends list for a user
export async function GET(
  request: Request,
  { params }: { params: { username: string } }
) {
  try {
    const supabase = getSupabase()
    const { username } = params

    // Find the user by username or email
    const { data: targetUser, error: userError } = await supabase
      .from('users')
      .select('id, username, name, email')
      .or(`username.eq.${username},email.eq.${username}`)
      .single()

    if (userError || !targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Get accepted friend requests where user is sender or receiver
    const { data: friendRequests, error: frError } = await supabase
      .from('friend_requests')
      .select('senderId, receiverId')
      .or(`senderId.eq.${targetUser.id},receiverId.eq.${targetUser.id}`)
      .eq('status', 'accepted')

    if (frError) {
      console.error('[user-friends] Error fetching friend requests:', frError)
      return NextResponse.json({ friends: [] })
    }

    if (!friendRequests || friendRequests.length === 0) {
      return NextResponse.json({ friends: [] })
    }

    // Extract friend IDs
    const friendIds = friendRequests.map(fr => 
      fr.senderId === targetUser.id ? fr.receiverId : fr.senderId
    )

    // Fetch friend profiles
    const { data: friends, error: friendsError } = await supabase
      .from('users')
      .select('id, username, name, image')
      .in('id', friendIds)

    if (friendsError) {
      console.error('[user-friends] Error fetching friend profiles:', friendsError)
      return NextResponse.json({ friends: [] })
    }

    return NextResponse.json({ friends: friends || [] })
  } catch (error: any) {
    console.error('[users/friends] Error:', error?.message || error)
    return NextResponse.json(
      { error: 'Failed to fetch friends' },
      { status: 500 }
    )
  }
}

