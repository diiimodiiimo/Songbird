import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { getSupabase } from '@/lib/supabase'
import { getPrismaUserIdFromClerk } from '@/lib/clerk-sync'

// Simple ID generator
function generateId(): string {
  const timestamp = Date.now().toString(36)
  const randomPart = Math.random().toString(36).substring(2, 15)
  return `c${timestamp}${randomPart}`
}

export async function POST(request: Request) {
  try {
    const { userId: clerkId } = await auth()

    if (!clerkId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { code } = body

    if (!code) {
      return NextResponse.json({ error: 'Invite code required' }, { status: 400 })
    }

    // Get current user
    const currentUserId = await getPrismaUserIdFromClerk(clerkId)
    if (!currentUserId) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const supabase = getSupabase()

    // Find the invite sender
    let senderId: string | null = null

    // First check if it's a user's personal invite code
    const { data: userWithCode } = await supabase
      .from('users')
      .select('id')
      .eq('inviteCode', code)
      .single()

    if (userWithCode) {
      senderId = userWithCode.id
    } else {
      // Check invite records
      const { data: invite } = await supabase
        .from('invites')
        .select('senderId, status')
        .eq('code', code)
        .single()

      if (invite && invite.status !== 'accepted') {
        senderId = invite.senderId

        // Mark invite as accepted
        await supabase
          .from('invites')
          .update({
            status: 'accepted',
            receiverId: currentUserId,
            usedAt: new Date().toISOString(),
          })
          .eq('code', code)
      }
    }

    // Don't create friend request if sender is the same as receiver
    if (senderId && senderId !== currentUserId) {
      // Check if friend request already exists
      const { data: existingRequest } = await supabase
        .from('friend_requests')
        .select('id')
        .or(`and(senderId.eq.${senderId},receiverId.eq.${currentUserId}),and(senderId.eq.${currentUserId},receiverId.eq.${senderId})`)
        .single()

      if (!existingRequest) {
        // Create a friend request from the inviter to the new user
        await supabase
          .from('friend_requests')
          .insert({
            id: generateId(),
            senderId,
            receiverId: currentUserId,
            status: 'pending',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          })

        // Create notification for the sender
        await supabase
          .from('notifications')
          .insert({
            id: generateId(),
            userId: senderId,
            type: 'invite_accepted',
            relatedId: currentUserId,
            read: false,
            createdAt: new Date().toISOString(),
          })
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error accepting invite:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
