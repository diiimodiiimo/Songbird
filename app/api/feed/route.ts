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
      .select('id, date, songTitle, artist, albumTitle, albumArt, createdAt, userId, trackId')
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

    // Get vibe counts using Supabase
    const entryIds = (entries || []).map(e => e.id)
    
    let vibeCountMap = new Map<string, number>()
    let userVibeSet = new Set<string>()
    let commentCountMap = new Map<string, number>()

    if (entryIds.length > 0) {
      // Get vibe counts per entry
      const { data: vibeCounts } = await supabase
        .from('vibes')
        .select('entryId')
        .in('entryId', entryIds)
      
      if (vibeCounts) {
        const counts: Record<string, number> = {}
        vibeCounts.forEach(v => {
          counts[v.entryId] = (counts[v.entryId] || 0) + 1
        })
        vibeCountMap = new Map(Object.entries(counts))
      }

      // Get user's vibes
      const { data: userVibes } = await supabase
        .from('vibes')
        .select('entryId')
        .in('entryId', entryIds)
        .eq('userId', userId)
      
      if (userVibes) {
        userVibeSet = new Set(userVibes.map(v => v.entryId))
      }

      // Get comment counts per entry
      const { data: commentCounts } = await supabase
        .from('comments')
        .select('entryId')
        .in('entryId', entryIds)
      
      if (commentCounts) {
        const counts: Record<string, number> = {}
        commentCounts.forEach(c => {
          counts[c.entryId] = (counts[c.entryId] || 0) + 1
        })
        commentCountMap = new Map(Object.entries(counts))
      }
    }

    // Format entries for feed
    const feedEntries = (entries || []).map((entry) => ({
      id: entry.id,
      date: new Date(entry.date).toISOString().split('T')[0],
      songTitle: entry.songTitle,
      artist: entry.artist,
      albumTitle: entry.albumTitle,
      albumArt: entry.albumArt,
      trackId: entry.trackId,
      user: userMap.get(entry.userId) || null,
      mentions: [],
      createdAt: entry.createdAt,
      vibeCount: vibeCountMap.get(entry.id) || 0,
      hasVibed: userVibeSet.has(entry.id),
      commentCount: commentCountMap.get(entry.id) || 0,
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
