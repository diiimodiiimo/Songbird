import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { getSupabase } from '@/lib/supabase'
import { getUserIdFromClerk } from '@/lib/clerk-sync'
import { checkRateLimit, getRateLimitHeaders } from '@/lib/rate-limit'

// Simple ID generator
function generateId(): string {
  const timestamp = Date.now().toString(36)
  const randomPart = Math.random().toString(36).substring(2, 15)
  return `c${timestamp}${randomPart}`
}

// POST - Block a user
export async function POST(request: Request) {
  try {
    const { userId: clerkUserId } = await auth()
    
    // Rate limiting
    const rateLimitResult = await checkRateLimit(clerkUserId, 'WRITE')
    if (!rateLimitResult.allowed) {
      return rateLimitResult.response!
    }

    if (!clerkUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const blockerId = await getUserIdFromClerk(clerkUserId)
    if (!blockerId) {
      return NextResponse.json({ error: 'User not found in database' }, { status: 404 })
    }

    const body = await request.json()
    const { blockedUsername } = body

    if (!blockedUsername) {
      return NextResponse.json({ error: 'Username required' }, { status: 400 })
    }

    const supabase = getSupabase()

    // Find the user to block
    const { data: blockedUser } = await supabase
      .from('users')
      .select('id')
      .eq('username', blockedUsername)
      .single()

    if (!blockedUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    if (blockedUser.id === blockerId) {
      return NextResponse.json({ error: 'Cannot block yourself' }, { status: 400 })
    }

    // Check if already blocked
    const { data: existingBlock } = await supabase
      .from('blocked_users')
      .select('id')
      .eq('blockerId', blockerId)
      .eq('blockedId', blockedUser.id)
      .maybeSingle()

    if (existingBlock) {
      return NextResponse.json({ error: 'User already blocked' }, { status: 400 })
    }

    // Create block
    const { data: block, error } = await supabase
      .from('blocked_users')
      .insert({
        id: generateId(),
        blockerId,
        blockedId: blockedUser.id,
        createdAt: new Date().toISOString(),
      })
      .select('id')
      .single()

    if (error) {
      console.error('[block] Error:', error)
      throw error
    }

    // Remove friend relationship if exists
    await supabase
      .from('friend_requests')
      .delete()
      .or(`and(senderId.eq.${blockerId},receiverId.eq.${blockedUser.id}),and(senderId.eq.${blockedUser.id},receiverId.eq.${blockerId})`)

    return NextResponse.json({ success: true, blockId: block.id }, {
      headers: await getRateLimitHeaders(clerkUserId, 'WRITE'),
    })
  } catch (error: any) {
    console.error('[block] POST Error:', error?.message || error)
    return NextResponse.json(
      { error: 'Failed to block user', message: error?.message },
      { status: 500 }
    )
  }
}

// DELETE - Unblock a user
export async function DELETE(request: Request) {
  try {
    const { userId: clerkUserId } = await auth()
    
    if (!clerkUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const blockerId = await getUserIdFromClerk(clerkUserId)
    if (!blockerId) {
      return NextResponse.json({ error: 'User not found in database' }, { status: 404 })
    }

    const { searchParams } = new URL(request.url)
    const blockedUsername = searchParams.get('username')

    if (!blockedUsername) {
      return NextResponse.json({ error: 'Username required' }, { status: 400 })
    }

    const supabase = getSupabase()

    // Find the blocked user
    const { data: blockedUser } = await supabase
      .from('users')
      .select('id')
      .eq('username', blockedUsername)
      .single()

    if (!blockedUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Remove block
    const { error } = await supabase
      .from('blocked_users')
      .delete()
      .eq('blockerId', blockerId)
      .eq('blockedId', blockedUser.id)

    if (error) {
      console.error('[block] DELETE Error:', error)
      throw error
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('[block] DELETE Error:', error?.message || error)
    return NextResponse.json(
      { error: 'Failed to unblock user', message: error?.message },
      { status: 500 }
    )
  }
}

// GET - Get list of blocked users
export async function GET() {
  try {
    const { userId: clerkUserId } = await auth()
    
    if (!clerkUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const blockerId = await getUserIdFromClerk(clerkUserId)
    if (!blockerId) {
      return NextResponse.json({ error: 'User not found in database' }, { status: 404 })
    }

    const supabase = getSupabase()

    // Get blocked users with user info
    const { data: blocks, error } = await supabase
      .from('blocked_users')
      .select('blockedId, createdAt')
      .eq('blockerId', blockerId)
      .order('createdAt', { ascending: false })

    if (error) throw error

    if (!blocks || blocks.length === 0) {
      return NextResponse.json({ blockedUsers: [] })
    }

    const blockedIds = blocks.map(b => b.blockedId)

    // Get user info for blocked users
    const { data: users } = await supabase
      .from('users')
      .select('id, username, name, image')
      .in('id', blockedIds)

    const userMap = new Map((users || []).map(u => [u.id, u]))

    const blockedUsers = blocks.map(block => ({
      id: block.blockedId,
      username: userMap.get(block.blockedId)?.username,
      name: userMap.get(block.blockedId)?.name,
      image: userMap.get(block.blockedId)?.image,
      blockedAt: block.createdAt,
    }))

    return NextResponse.json({ blockedUsers })
  } catch (error: any) {
    console.error('[block] GET Error:', error?.message || error)
    return NextResponse.json(
      { error: 'Failed to fetch blocked users', message: error?.message },
      { status: 500 }
    )
  }
}


