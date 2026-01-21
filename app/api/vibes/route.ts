import { NextResponse } from 'next/server'
import { auth, currentUser } from '@clerk/nextjs/server'
import { getSupabase } from '@/lib/supabase'
import { getPrismaUserIdFromClerk } from '@/lib/clerk-sync'
import { sendPushToUser } from '@/lib/sendPushToUser'

// Toggle vibe on an entry
export async function POST(request: Request) {
  try {
    const { userId: clerkUserId } = await auth()
    if (!clerkUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { entryId } = await request.json()
    if (!entryId) {
      return NextResponse.json({ error: 'Entry ID required' }, { status: 400 })
    }

    const userId = await getPrismaUserIdFromClerk(clerkUserId)
    if (!userId) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const supabase = getSupabase()

    // Check if vibe exists
    const { data: existingVibe } = await supabase
      .from('vibes')
      .select('id')
      .eq('entryId', entryId)
      .eq('userId', userId)
      .single()

    if (existingVibe) {
      // Remove vibe (toggle off)
      await supabase
        .from('vibes')
        .delete()
        .eq('id', existingVibe.id)
      
      return NextResponse.json({ vibed: false, message: 'Vibe removed' })
    } else {
      // Add vibe (toggle on)
      const vibeId = `vibe_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
      const { error: insertError } = await supabase
        .from('vibes')
        .insert({
          id: vibeId,
          entryId,
          userId,
        })

      if (insertError) {
        console.error('[vibes] Insert error:', insertError)
        throw insertError
      }

      // Get the entry to find the owner and send notification
      const { data: entry } = await supabase
        .from('entries')
        .select('id, userId, songTitle')
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
            type: 'vibe',
            relatedId: entryId,
          })

        // Get current user's name for push notification
        const { data: currentUserData } = await supabase
          .from('users')
          .select('name, username')
          .eq('id', userId)
          .single()

        // Send push notification (async, don't wait)
        sendPushToUser(entry.userId, 'vibe', {
          userName: currentUserData?.name || currentUserData?.username || 'Someone',
          songTitle: entry.songTitle,
          entryId: entry.id
        }).catch(err => console.error('[vibes] Push error:', err))
      }

      return NextResponse.json({ vibed: true, message: 'Vibe added' })
    }
  } catch (error: any) {
    console.error('Error toggling vibe:', error?.message || error)
    return NextResponse.json({ error: 'Failed to toggle vibe' }, { status: 500 })
  }
}

// Get user's vibed songs
export async function GET(request: Request) {
  try {
    const { userId: clerkUserId } = await auth()
    if (!clerkUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const targetUserId = searchParams.get('userId')

    const userId = await getPrismaUserIdFromClerk(clerkUserId)
    if (!userId) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const supabase = getSupabase()

    // Get vibes for the target user (or current user if not specified)
    const queryUserId = targetUserId || userId

    const { data: vibes, error } = await supabase
      .from('vibes')
      .select('id, entryId, createdAt')
      .eq('userId', queryUserId)
      .order('createdAt', { ascending: false })

    if (error) throw error

    // Get entry details for each vibe
    const entryIds = (vibes || []).map(v => v.entryId)
    
    if (entryIds.length === 0) {
      return NextResponse.json({ vibes: [] })
    }

    const { data: entries } = await supabase
      .from('entries')
      .select('id, songTitle, artist, albumTitle, albumArt, date, trackId, userId')
      .in('id', entryIds)

    const { data: users } = await supabase
      .from('users')
      .select('id, username, name, email, image')
      .in('id', (entries || []).map(e => e.userId))

    const userMap = new Map((users || []).map(u => [u.id, u]))
    const entryMap = new Map((entries || []).map(e => [e.id, { ...e, user: userMap.get(e.userId) }]))

    const enrichedVibes = (vibes || []).map(vibe => ({
      id: vibe.id,
      entry: entryMap.get(vibe.entryId) || null,
    })).filter(v => v.entry !== null)

    return NextResponse.json({ vibes: enrichedVibes })
  } catch (error: any) {
    console.error('Error fetching vibes:', error?.message || error)
    return NextResponse.json({ error: 'Failed to fetch vibes' }, { status: 500 })
  }
}
