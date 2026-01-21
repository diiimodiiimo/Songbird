import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { getSupabase } from '@/lib/supabase'
import { getPrismaUserIdFromClerk } from '@/lib/clerk-sync'
import { sendPushToUser } from '@/lib/sendPushToUser'

// Create a comment on an entry
export async function POST(request: Request) {
  try {
    const { userId: clerkUserId } = await auth()
    if (!clerkUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { entryId, content } = await request.json()
    if (!entryId || !content?.trim()) {
      return NextResponse.json({ error: 'Entry ID and content required' }, { status: 400 })
    }

    const userId = await getPrismaUserIdFromClerk(clerkUserId)
    if (!userId) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const supabase = getSupabase()

    // Create the comment
    const commentId = `comment_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
    const now = new Date().toISOString()
    const { data: comment, error: insertError } = await supabase
      .from('comments')
      .insert({
        id: commentId,
        entryId,
        userId,
        content: content.trim(),
        updatedAt: now,
      })
      .select('id, content, createdAt, userId')
      .single()

    if (insertError) {
      console.error('[comments] Insert error:', insertError)
      throw insertError
    }

    // Get user info for the comment
    const { data: user } = await supabase
      .from('users')
      .select('id, username, name, email, image')
      .eq('id', userId)
      .single()

    // Get the entry to find the owner and send notification
    const { data: entry } = await supabase
      .from('entries')
      .select('id, userId')
      .eq('id', entryId)
      .single()

    if (entry && entry.userId !== userId) {
      // Create notification for the entry owner
      const notificationId = `notif_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
      await supabase
        .from('notifications')
        .insert({
          id: notificationId,
          userId: entry.userId,
          type: 'comment',
          relatedId: comment.id,
        })

      // Send push notification (async, don't wait)
      sendPushToUser(entry.userId, 'comment', {
        userName: user?.name || user?.username || 'Someone',
        commentId: comment.id
      }).catch(err => console.error('[comments] Push error:', err))
    }

    return NextResponse.json({ 
      comment: {
        ...comment,
        user,
      }
    })
  } catch (error: any) {
    console.error('Error creating comment:', error?.message || error)
    return NextResponse.json({ error: 'Failed to create comment' }, { status: 500 })
  }
}

// Get comments for an entry
export async function GET(request: Request) {
  try {
    const { userId: clerkUserId } = await auth()
    if (!clerkUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const entryId = searchParams.get('entryId')

    if (!entryId) {
      return NextResponse.json({ error: 'Entry ID required' }, { status: 400 })
    }

    const supabase = getSupabase()

    const { data: comments, error } = await supabase
      .from('comments')
      .select('id, content, createdAt, userId')
      .eq('entryId', entryId)
      .order('createdAt', { ascending: true })

    if (error) throw error

    // Get user info for each comment
    const userIds = Array.from(new Set((comments || []).map(c => c.userId)))
    
    const { data: users } = await supabase
      .from('users')
      .select('id, username, name, email, image')
      .in('id', userIds)

    const userMap = new Map((users || []).map(u => [u.id, u]))

    const enrichedComments = (comments || []).map(comment => ({
      ...comment,
      user: userMap.get(comment.userId) || null,
    }))

    return NextResponse.json({ comments: enrichedComments })
  } catch (error: any) {
    console.error('Error fetching comments:', error?.message || error)
    return NextResponse.json({ error: 'Failed to fetch comments' }, { status: 500 })
  }
}
