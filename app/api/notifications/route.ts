import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { getSupabase } from '@/lib/supabase'
import { getUserIdFromClerk } from '@/lib/clerk-sync'

// GET - Get notifications for current user
export async function GET(request: Request) {
  try {
    const { userId: clerkUserId } = await auth()
    if (!clerkUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = await getUserIdFromClerk(clerkUserId)
    if (!userId) {
      return NextResponse.json({ error: 'User not found in database' }, { status: 404 })
    }

    const { searchParams } = new URL(request.url)
    const unreadOnly = searchParams.get('unreadOnly') === 'true'

    const supabase = getSupabase()
    
    let query = supabase
      .from('notifications')
      .select('*')
      .eq('userId', userId)
      .order('createdAt', { ascending: false })
      .limit(50)

    if (unreadOnly) {
      query = query.eq('read', false)
    }

    const { data: notifications, error } = await query

    if (error) {
      console.error('[notifications] Error:', error)
      throw error
    }

    // Enrich notifications with related data
    const enrichedNotifications = await Promise.all(
      (notifications || []).map(async (notification) => {
        let relatedData = null

        if (notification.type === 'mention' && notification.relatedId) {
          const { data: entry } = await supabase
            .from('entries')
            .select('id, songTitle, artist, date, userId')
            .eq('id', notification.relatedId)
            .single()
          
          if (entry) {
            const { data: user } = await supabase
              .from('users')
              .select('id, email, name, image')
              .eq('id', entry.userId)
              .single()
            relatedData = { ...entry, user }
          }
        } else if (notification.type === 'friend_request_accepted' && notification.relatedId) {
          const { data: friendRequest } = await supabase
            .from('friend_requests')
            .select('id, senderId, receiverId, status')
            .eq('id', notification.relatedId)
            .single()

          if (friendRequest) {
            const [senderRes, receiverRes] = await Promise.all([
              supabase.from('users').select('id, email, name, image').eq('id', friendRequest.senderId).single(),
              supabase.from('users').select('id, email, name, image').eq('id', friendRequest.receiverId).single(),
            ])
            relatedData = {
              ...friendRequest,
              sender: senderRes.data,
              receiver: receiverRes.data,
            }
          }
        } else if (notification.type === 'vibe' && notification.relatedId) {
          // relatedId is the entryId for vibe notifications
          const { data: entry } = await supabase
            .from('entries')
            .select('id, songTitle, artist, date')
            .eq('id', notification.relatedId)
            .single()
          
          if (entry) {
            relatedData = entry
          }
        } else if (notification.type === 'comment' && notification.relatedId) {
          // relatedId is the commentId for comment notifications
          const { data: comment } = await supabase
            .from('comments')
            .select('id, content, userId, entryId')
            .eq('id', notification.relatedId)
            .single()
          
          if (comment) {
            const { data: user } = await supabase
              .from('users')
              .select('id, email, name, image')
              .eq('id', comment.userId)
              .single()
            relatedData = { ...comment, user }
          }
        } else if (notification.type === 'friend_request' && notification.relatedId) {
          const { data: friendRequest } = await supabase
            .from('friend_requests')
            .select('id, senderId, receiverId, status')
            .eq('id', notification.relatedId)
            .single()

          if (friendRequest) {
            const { data: sender } = await supabase
              .from('users')
              .select('id, email, name, image')
              .eq('id', friendRequest.senderId)
              .single()
            relatedData = { ...friendRequest, sender }
          }
        }

        return {
          ...notification,
          relatedData,
        }
      })
    )

    return NextResponse.json({ notifications: enrichedNotifications })
  } catch (error: any) {
    console.error('Error fetching notifications:', error?.message || error)
    return NextResponse.json(
      { error: 'Failed to fetch notifications', message: error?.message },
      { status: 500 }
    )
  }
}

// PATCH - Mark notifications as read
export async function PATCH(request: Request) {
  try {
    const { userId: clerkUserId } = await auth()
    if (!clerkUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = await getUserIdFromClerk(clerkUserId)
    if (!userId) {
      return NextResponse.json({ error: 'User not found in database' }, { status: 404 })
    }

    const body = await request.json()
    const { notificationIds } = body

    if (!Array.isArray(notificationIds)) {
      return NextResponse.json(
        { error: 'notificationIds must be an array' },
        { status: 400 }
      )
    }

    const supabase = getSupabase()
    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('userId', userId)
      .in('id', notificationIds)

    if (error) {
      console.error('[notifications] Update error:', error)
      throw error
    }

    return NextResponse.json({ message: 'Notifications marked as read' })
  } catch (error: any) {
    console.error('Error updating notifications:', error?.message || error)
    return NextResponse.json(
      { error: 'Failed to update notifications', message: error?.message },
      { status: 500 }
    )
  }
}
