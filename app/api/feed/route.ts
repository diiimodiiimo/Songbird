import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { getSupabase } from '@/lib/supabase'
import { getFriendIds } from '@/lib/friends'
import { getPrismaUserIdFromClerk } from '@/lib/clerk-sync'

// GET - Get friends feed (entries from friends, showing only song + mentions)
export async function GET() {
  try {
    const { userId: clerkUserId } = await auth()
    if (!clerkUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = await getPrismaUserIdFromClerk(clerkUserId)
    if (!userId) {
      return NextResponse.json({ error: 'User not found in database' }, { status: 404 })
    }

    // Get all friend IDs
    const friendIds = await getFriendIds(userId)

    if (friendIds.length === 0) {
      return NextResponse.json({ entries: [] })
    }

    const supabase = getSupabase()

    // Get entries from friends
    const { data: entries, error } = await supabase
      .from('entries')
      .select('id, date, songTitle, artist, albumTitle, albumArt, createdAt, userId')
      .in('userId', friendIds)
      .order('createdAt', { ascending: false })
      .limit(50)

    if (error) throw error

    // Get user info for all friend IDs
    const { data: users } = await supabase
      .from('users')
      .select('id, email, name, username, image')
      .in('id', friendIds)

    const userMap = new Map((users || []).map(u => [u.id, u]))

    // Format entries for feed
    const feedEntries = (entries || []).map((entry) => ({
      id: entry.id,
      date: new Date(entry.date).toISOString().split('T')[0],
      songTitle: entry.songTitle,
      artist: entry.artist,
      albumTitle: entry.albumTitle,
      albumArt: entry.albumArt,
      user: userMap.get(entry.userId) || null,
      mentions: [],
      createdAt: entry.createdAt,
    }))

    return NextResponse.json({ entries: feedEntries })
  } catch (error: any) {
    console.error('[feed] Error:', error?.message || error)
    return NextResponse.json(
      { error: 'Failed to fetch feed', message: error?.message },
      { status: 500 }
    )
  }
}
