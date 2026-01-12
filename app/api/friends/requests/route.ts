import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { getSupabase } from '@/lib/supabase'
import { z } from 'zod'
import { getPrismaUserIdFromClerk } from '@/lib/clerk-sync'

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
      .select('id, email, name, username, image')
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
    console.log('[friend-request] Starting request, clerkUserId:', clerkUserId)
    
    if (!clerkUserId) {
      console.log('[friend-request] No clerkUserId - unauthorized')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = await getPrismaUserIdFromClerk(clerkUserId)
    console.log('[friend-request] Database userId:', userId)
    
    if (!userId) {
      console.log('[friend-request] User not found in database')
      return NextResponse.json({ error: 'User not found in database' }, { status: 404 })
    }

    const body = await request.json()
    console.log('[friend-request] Request body:', body)
    const { receiverUsername } = friendRequestSchema.parse(body)
    console.log('[friend-request] Looking for receiver:', receiverUsername)

    const supabase = getSupabase()

    // Find the receiver user by username, email, or name
    // First try exact username match
    let { data: receiver } = await supabase
      .from('users')
      .select('id, email, name, username, image')
      .eq('username', receiverUsername)
      .maybeSingle()

    // If not found by username, try email (without @domain if provided)
    if (!receiver) {
      const searchTerm = receiverUsername.toLowerCase()
      const { data: allUsers } = await supabase
        .from('users')
        .select('id, email, name, username, image')
      
      // Find by email prefix, full email, or name
      receiver = (allUsers || []).find(u => 
        u.email?.toLowerCase() === searchTerm ||
        u.email?.toLowerCase().split('@')[0] === searchTerm ||
        u.name?.toLowerCase() === searchTerm
      ) || null
    }

    if (!receiver) {
      console.log('[friend-request] Receiver not found for:', receiverUsername)
      return NextResponse.json({ 
        error: 'User not found', 
        hint: 'Try searching by their email or full name' 
      }, { status: 404 })
    }

    console.log('[friend-request] Found receiver:', receiver.id, receiver.username || receiver.email)

    if (receiver.id === userId) {
      console.log('[friend-request] Trying to add self as friend')
      return NextResponse.json(
        { error: 'Cannot send friend request to yourself' },
        { status: 400 }
      )
    }

    // Check if a request already exists
    console.log('[friend-request] Checking for existing request between', userId, 'and', receiver.id)
    const { data: existingRequest, error: existingError } = await supabase
      .from('friend_requests')
      .select('id, status')
      .or(`and(senderId.eq.${userId},receiverId.eq.${receiver.id}),and(senderId.eq.${receiver.id},receiverId.eq.${userId})`)
      .maybeSingle()

    if (existingError) {
      console.error('[friend-request] Error checking existing:', existingError)
    }

    if (existingRequest) {
      console.log('[friend-request] Existing request found:', existingRequest)
      if (existingRequest.status === 'pending') {
        return NextResponse.json({ error: 'Friend request already exists' }, { status: 400 })
      }
      if (existingRequest.status === 'accepted') {
        return NextResponse.json({ error: 'You are already friends' }, { status: 400 })
      }
    }

    // Create the friend request with generated ID
    const requestId = `fr_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
    console.log('[friend-request] Creating new request from', userId, 'to', receiver.id, 'with id:', requestId)
    
    const { data: friendRequest, error } = await supabase
      .from('friend_requests')
      .insert({
        id: requestId,
        senderId: userId,
        receiverId: receiver.id,
        status: 'pending',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
      .select('id, senderId, receiverId, status, createdAt')
      .single()

    if (error) {
      console.error('[friend-request] Insert error:', error)
      throw error
    }
    
    console.log('[friend-request] Successfully created:', friendRequest)

    // Create notification for the receiver about the friend request
    const notifId = `notif_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
    await supabase.from('notifications').insert({
      id: notifId,
      userId: receiver.id,
      type: 'friend_request',
      relatedId: friendRequest.id,
      read: false,
      createdAt: new Date().toISOString(),
    })
    console.log('[friend-request] Notification created for receiver')

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
