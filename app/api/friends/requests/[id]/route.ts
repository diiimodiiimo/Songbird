import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { getSupabase } from '@/lib/supabase'
import { z } from 'zod'
import { getPrismaUserIdFromClerk } from '@/lib/clerk-sync'
import { sendPushToUser } from '@/lib/sendPushToUser'

const updateRequestSchema = z.object({
  action: z.enum(['accept', 'decline']),
})

// PUT - Accept or decline a friend request
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId: clerkUserId } = await auth()
    if (!clerkUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = await getPrismaUserIdFromClerk(clerkUserId)
    if (!userId) {
      return NextResponse.json({ error: 'User not found in database' }, { status: 404 })
    }

    const { id } = await params
    const body = await request.json()
    const { action } = updateRequestSchema.parse(body)

    const supabase = getSupabase()

    // Find the friend request
    const { data: friendRequest } = await supabase
      .from('friend_requests')
      .select('id, senderId, receiverId, status')
      .eq('id', id)
      .single()

    if (!friendRequest) {
      return NextResponse.json({ error: 'Friend request not found' }, { status: 404 })
    }

    if (friendRequest.receiverId !== userId) {
      return NextResponse.json(
        { error: 'You can only respond to requests sent to you' },
        { status: 403 }
      )
    }

    if (friendRequest.status !== 'pending') {
      return NextResponse.json(
        { error: 'Friend request has already been processed' },
        { status: 400 }
      )
    }

    // Update the request status
    const newStatus = action === 'accept' ? 'accepted' : 'declined'
    const { error: updateError } = await supabase
      .from('friend_requests')
      .update({ status: newStatus, updatedAt: new Date().toISOString() })
      .eq('id', id)

    if (updateError) throw updateError

    // Get user info
    const { data: users } = await supabase
      .from('users')
      .select('id, email, name, image')
      .in('id', [friendRequest.senderId, friendRequest.receiverId])

    const userMap = new Map((users || []).map(u => [u.id, u]))

    // If accepted, create notification and send push
    if (action === 'accept') {
      await supabase.from('notifications').insert({
        userId: friendRequest.senderId,
        type: 'friend_request_accepted',
        relatedId: friendRequest.id,
        read: false,
        createdAt: new Date().toISOString(),
      })

      // Get accepter's name for push notification
      const accepterName = userMap.get(userId)?.name || 'Someone'

      // Send push notification (async, don't wait)
      sendPushToUser(friendRequest.senderId, 'friend_request_accepted', {
        userName: accepterName,
        requestId: friendRequest.id
      }).catch(err => console.error('[friends/requests/[id]] Push error:', err))
    }

    return NextResponse.json({
      friendRequest: {
        ...friendRequest,
        status: newStatus,
        sender: userMap.get(friendRequest.senderId) || null,
        receiver: userMap.get(friendRequest.receiverId) || null,
      },
    })
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      )
    }
    console.error('[friends/requests/[id]] PUT Error:', error?.message || error)
    return NextResponse.json(
      { error: 'Failed to update friend request', message: error?.message },
      { status: 500 }
    )
  }
}

// DELETE - Cancel a friend request
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId: clerkUserId } = await auth()
    if (!clerkUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = await getPrismaUserIdFromClerk(clerkUserId)
    if (!userId) {
      return NextResponse.json({ error: 'User not found in database' }, { status: 404 })
    }

    const { id } = await params
    const supabase = getSupabase()

    const { data: friendRequest } = await supabase
      .from('friend_requests')
      .select('id, senderId')
      .eq('id', id)
      .single()

    if (!friendRequest) {
      return NextResponse.json({ error: 'Friend request not found' }, { status: 404 })
    }

    if (friendRequest.senderId !== userId) {
      return NextResponse.json(
        { error: 'You can only cancel requests you sent' },
        { status: 403 }
      )
    }

    const { error } = await supabase.from('friend_requests').delete().eq('id', id)

    if (error) throw error

    return NextResponse.json({ message: 'Friend request cancelled' })
  } catch (error: any) {
    console.error('[friends/requests/[id]] DELETE Error:', error?.message || error)
    return NextResponse.json(
      { error: 'Failed to cancel friend request', message: error?.message },
      { status: 500 }
    )
  }
}
