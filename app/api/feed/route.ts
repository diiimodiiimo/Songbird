import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { getSupabase } from '@/lib/supabase'
import { getFriendIds } from '@/lib/friends'
import { getPrismaUserIdFromClerk } from '@/lib/clerk-sync'
import { checkRateLimit, getRateLimitHeaders } from '@/lib/rate-limit'

// GET - Get feed (entries from user + friends, so user can see vibes/comments on their posts)
// Query params:
//   - cursor: ISO date string (optional) - the date of the last entry from previous page (for pagination, loads older entries)
//   - limit: number (optional, default 20) - number of entries to return
export async function GET(request: Request) {
  try {
    const { userId: clerkUserId } = await auth()
    
    if (!clerkUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    // Rate limiting - check after auth to avoid unnecessary work
    const rateLimitResult = await checkRateLimit(clerkUserId, 'READ')
    if (!rateLimitResult.allowed) {
      return rateLimitResult.response!
    }

    const userId = await getPrismaUserIdFromClerk(clerkUserId)
    if (!userId) {
      return NextResponse.json({ error: 'User not found in database' }, { status: 404 })
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url)
    const cursorParam = searchParams.get('cursor')
    const limitParam = searchParams.get('limit')
    const limit = limitParam ? Math.min(parseInt(limitParam, 10), 50) : 20 // Default 20, max 50

    // Get all friend IDs
    const friendIds = await getFriendIds(userId)

    // Include both user's own entries AND friends' entries
    const allUserIds = [userId, ...friendIds]

    const supabase = getSupabase()

    // Build query with pagination
    let query = supabase
      .from('entries')
      .select('id, date, songTitle, artist, albumTitle, albumArt, createdAt, userId, trackId')
      .in('userId', allUserIds)
      .order('date', { ascending: false })
      .limit(limit + 1) // Fetch one extra to check if there are more

    // If cursor is provided (for pagination), get entries before the cursor
    // Cursor format: "date:entryId" or just "date" for backwards compatibility
    if (cursorParam) {
      try {
        const [cursorDateStr] = cursorParam.split(':')
        const cursorDate = new Date(cursorDateStr)
        
        // Validate date
        if (isNaN(cursorDate.getTime())) {
          throw new Error('Invalid cursor date')
        }
        
        // Simple approach: filter by date < cursor date
        // Client-side deduplication handles any edge cases with same-date entries
        query = query.lt('date', cursorDate.toISOString())
      } catch (err) {
        console.error('[feed] Invalid cursor format:', cursorParam, err)
        // Continue without cursor filter if invalid
      }
    }

    const { data: entries, error } = await query

    if (error) {
      console.error('[feed] Supabase query error:', error)
      throw error
    }

    // Check if there are more entries
    const hasMore = entries && entries.length > limit
    const entriesToReturn = hasMore ? entries.slice(0, limit) : (entries || [])
    
    // Create cursor from last entry (date + id for uniqueness when multiple entries share same date)
    const lastEntry = entriesToReturn.length > 0 ? entriesToReturn[entriesToReturn.length - 1] : null
    const cursor = lastEntry 
      ? `${new Date(lastEntry.date).toISOString()}:${lastEntry.id}`
      : null

    // Get user info for user + all friends
    const { data: users } = await supabase
      .from('users')
      .select('id, email, name, username, image')
      .in('id', allUserIds)

    const userMap = new Map((users || []).map(u => [u.id, u]))

    // Get vibe counts using Supabase
    const entryIds = entriesToReturn.map(e => e.id)
    
    let vibeCountMap = new Map<string, number>()
    let userVibeSet = new Set<string>()
    let commentCountMap = new Map<string, number>()
    let mentionsMap = new Map<string, Array<{ id: string; user: any }>>()

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

      // Get mentions for all entries
      const { data: mentions } = await supabase
        .from('mentions')
        .select('id, entryId, userId')
        .in('entryId', entryIds)

      if (mentions && mentions.length > 0) {
        // Get unique mentioned user IDs
        const mentionedUserIds = Array.from(new Set(mentions.map(m => m.userId)))
        
        // Fetch mentioned users' info
        const { data: mentionedUsers } = await supabase
          .from('users')
          .select('id, email, name, username, image')
          .in('id', mentionedUserIds)

        const mentionedUserMap = new Map((mentionedUsers || []).map(u => [u.id, u]))

        // Group mentions by entryId
        mentions.forEach(m => {
          const entryMentions = mentionsMap.get(m.entryId) || []
          const mentionUser = mentionedUserMap.get(m.userId)
          if (mentionUser) {
            entryMentions.push({ id: m.id, user: mentionUser })
          }
          mentionsMap.set(m.entryId, entryMentions)
        })
      }
    }

    // Format entries for feed
    const feedEntries = entriesToReturn.map((entry) => ({
      id: entry.id,
      date: new Date(entry.date).toISOString().split('T')[0],
      songTitle: entry.songTitle,
      artist: entry.artist,
      albumTitle: entry.albumTitle,
      albumArt: entry.albumArt,
      trackId: entry.trackId,
      user: userMap.get(entry.userId) || null,
      mentions: mentionsMap.get(entry.id) || [],
      createdAt: entry.createdAt,
      vibeCount: vibeCountMap.get(entry.id) || 0,
      hasVibed: userVibeSet.has(entry.id),
      commentCount: commentCountMap.get(entry.id) || 0,
      isOwnEntry: entry.userId === userId, // Flag to identify user's own entries
    }))

    return NextResponse.json({ 
      entries: feedEntries, 
      currentUserId: userId,
      hasMore,
      cursor: cursor
    })
  } catch (error: any) {
    console.error('[feed] Error:', error?.message || error)
    return NextResponse.json(
      { error: 'Failed to fetch feed', message: error?.message },
      { status: 500 }
    )
  }
}
