import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { getSupabase } from '@/lib/supabase'

export async function GET(request: Request) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const timeFilter = searchParams.get('time') || 'all'

    const supabase = getSupabase()

    // Calculate date range based on time filter
    let startDate: string | undefined
    const now = new Date()

    if (timeFilter === 'week') {
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString()
    } else if (timeFilter === 'month') {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
    } else if (timeFilter === 'year') {
      startDate = new Date(now.getFullYear(), 0, 1).toISOString()
    }

    // Get entries
    let query = supabase.from('entries').select('artist, songTitle, albumArt')
    if (startDate) {
      query = query.gte('date', startDate)
    }

    const { data: entries, error } = await query

    if (error) throw error

    // Count artists
    const artistCounts: Record<string, number> = {}
    ;(entries || []).forEach((entry) => {
      artistCounts[entry.artist] = (artistCounts[entry.artist] || 0) + 1
    })

    const topArtists = Object.entries(artistCounts)
      .map(([artist, count]) => ({ artist, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 50)

    // Count songs
    const songCounts: Record<string, { songTitle: string; artist: string; albumArt: string | null; count: number }> = {}
    ;(entries || []).forEach((entry) => {
      const key = `${entry.songTitle}|||${entry.artist}`
      if (!songCounts[key]) {
        songCounts[key] = {
          songTitle: entry.songTitle,
          artist: entry.artist,
          albumArt: entry.albumArt,
          count: 0,
        }
      }
      songCounts[key].count++
    })

    const topSongs = Object.values(songCounts)
      .sort((a, b) => b.count - a.count)
      .slice(0, 50)

    // Get total stats
    const { count: totalUsers } = await supabase
      .from('users')
      .select('id', { count: 'exact', head: true })

    return NextResponse.json({
      topArtists,
      topSongs,
      stats: {
        totalUsers: totalUsers || 0,
        totalEntries: (entries || []).length,
        timeFilter,
      },
    })
  } catch (error: any) {
    console.error('[leaderboard] Error:', error?.message || error)
    return NextResponse.json(
      { error: 'Failed to fetch leaderboard data', message: error?.message },
      { status: 500 }
    )
  }
}
