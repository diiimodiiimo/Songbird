import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { getSupabase } from '@/lib/supabase'
import { z } from 'zod'
import { getPrismaUserIdFromClerk } from '@/lib/clerk-sync'
import { sendPushToUser } from '@/lib/sendPushToUser'

const friendRequestSchema = z.object({
  receiverUsername: z.string().min(1).max(50),
})

// GET - List friend requests (sent and received)
export async function GET(request: Request) {
  try {
    const { userId: clerkUserId } = await auth()
    if (!clerkUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = await getPrismaUserIdFromClerk(clerkUserId)
    if (!userId) {
      return NextResponse.json({ error: 'User not found in database' }, { status: 404 })
    }

    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') || 'all'

    const supabase = getSupabase()

    let query = supabase
      .from('friend_requests')
      .select('id, senderId, receiverId, status, createdAt')
      .order('createdAt', { ascending: false })

    if (type === 'sent') {
      query = query.eq('senderId', userId)
    } else if (type === 'received') {
      query = query.eq('receiverId', userId)
    } else {
      query = query.or(`senderId.eq.${userId},receiverId.eq.${userId}`)
    }

    const { data: requests, error } = await query

    if (error) throw error

    // Get all user IDs involved
    const userIds = new Set<string>()
    ;(requests || []).forEach((r) => {
      userIds.add(r.senderId)
      userIds.add(r.receiverId)
    })

    // Fetch user info
    const { data: users } = await supabase
      .from('users')
      .select('id, email, name, image')
      .in('id', Array.from(userIds))

    const userMap = new Map((users || []).map(u => [u.id, u]))

    const enrichedRequests = (requests || []).map((r) => ({
      ...r,
      sender: userMap.get(r.senderId) || null,
      receiver: userMap.get(r.receiverId) || null,
    }))

    return NextResponse.json({ requests: enrichedRequests })
  } catch (error: any) {
    console.error('[friends/requests] GET Error:', error?.message || error)
    return NextResponse.json(
      { error: 'Failed to fetch friend requests', message: error?.message },
      { status: 500 }
    )
  }
}

// POST - Send a friend request
export async function POST(request: Request) {
  try {
    const { userId: clerkUserId } = await auth()
    if (!clerkUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = await getPrismaUserIdFromClerk(clerkUserId)
    if (!userId) {
      return NextResponse.json({ error: 'User not found in database' }, { status: 404 })
    }

    const body = await request.json()
    const { receiverUsername } = friendRequestSchema.parse(body)

    const supabase = getSupabase()

    // Find the receiver user by username
    const { data: receiver } = await supabase
      .from('users')
      .select('id, email, name, image')
      .eq('username', receiverUsername)
      .single()

    if (!receiver) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    if (receiver.id === userId) {
      return NextResponse.json(
        { error: 'Cannot send friend request to yourself' },
        { status: 400 }
      )
    }

    // Check if a request already exists
    const { data: existingRequest } = await supabase
      .from('friend_requests')
      .select('id, status')
      .or(`and(senderId.eq.${userId},receiverId.eq.${receiver.id}),and(senderId.eq.${receiver.id},receiverId.eq.${userId})`)
      .maybeSingle()

    if (existingRequest) {
      if (existingRequest.status === 'pending') {
        return NextResponse.json({ error: 'Friend request already exists' }, { status: 400 })
      }
      if (existingRequest.status === 'accepted') {
        return NextResponse.json({ error: 'You are already friends' }, { status: 400 })
      }
    }

    // Create the friend request
    const { data: friendRequest, error } = await supabase
      .from('friend_requests')
      .insert({
        senderId: userId,
        receiverId: receiver.id,
        status: 'pending',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
      .select('id, senderId, receiverId, status, createdAt')
      .single()

    if (error) throw error

    // Create notification for the receiver
    await supabase.from('notifications').insert({
      userId: receiver.id,
      type: 'friend_request',
      relatedId: friendRequest.id,
      read: false,
      createdAt: new Date().toISOString(),
    })

    // Get sender info for push notification
    const { data: sender } = await supabase
      .from('users')
      .select('name, username')
      .eq('id', userId)
      .single()

    // Send push notification (async, don't wait)
    sendPushToUser(receiver.id, 'friend_request', {
      userName: sender?.name || sender?.username || 'Someone',
      requestId: friendRequest.id
    }).catch(err => console.error('[friends/requests] Push error:', err))

    return NextResponse.json({
      friendRequest: {
        ...friendRequest,
        receiver,
      },
    }, { status: 201 })
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      )
    }
    console.error('[friends/requests] POST Error:', error?.message || error)
    return NextResponse.json(
      { error: 'Failed to create friend request', message: error?.message },
      { status: 500 }
    )
  }
}
