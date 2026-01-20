import { NextResponse } from 'next/server'
import { getSupabase } from '@/lib/supabase'

interface GlobalSOTD {
  songTitle: string
  artist: string
  albumTitle: string
  albumArt: string | null
  trackId: string
  count: number
  date: string
  firstLoggedBy: {
    username: string | null
    name: string | null
  } | null
}

// Get the Global Song of the Day (most logged song from yesterday)
export async function GET() {
  try {
    const supabase = getSupabase()
    
    // Get yesterday's date
    const now = new Date()
    const yesterday = new Date(now)
    yesterday.setDate(yesterday.getDate() - 1)
    const yesterdayStr = yesterday.toISOString().split('T')[0]
    
    const startOfDay = `${yesterdayStr}T00:00:00.000Z`
    const endOfDay = `${yesterdayStr}T23:59:59.999Z`

    // Get all entries from yesterday, grouped by trackId
    const { data: entries, error } = await supabase
      .from('entries')
      .select('songTitle, artist, albumTitle, albumArt, trackId, userId, createdAt')
      .gte('date', startOfDay)
      .lte('date', endOfDay)
      .order('createdAt', { ascending: true })

    if (error) {
      console.error('[global-sotd] Error fetching entries:', error)
      throw error
    }

    if (!entries || entries.length === 0) {
      return NextResponse.json({ 
        globalSOTD: null,
        message: 'No entries from yesterday',
        date: yesterdayStr 
      })
    }

    // Group entries by trackId (or by songTitle+artist if no trackId)
    const songCounts = new Map<string, {
      songTitle: string
      artist: string
      albumTitle: string
      albumArt: string | null
      trackId: string
      count: number
      firstEntry: any
    }>()

    for (const entry of entries) {
      const key = entry.trackId || `${entry.songTitle}::${entry.artist}`
      
      if (songCounts.has(key)) {
        const existing = songCounts.get(key)!
        existing.count++
      } else {
        songCounts.set(key, {
          songTitle: entry.songTitle,
          artist: entry.artist,
          albumTitle: entry.albumTitle || '',
          albumArt: entry.albumArt || null,
          trackId: entry.trackId || '',
          count: 1,
          firstEntry: entry,
        })
      }
    }

    // Find the song with the highest count (tie goes to first logged)
    let topSong: typeof songCounts extends Map<string, infer V> ? V : never = null as any
    for (const song of songCounts.values()) {
      if (!topSong || song.count > topSong.count) {
        topSong = song
      }
    }

    if (!topSong) {
      return NextResponse.json({ 
        globalSOTD: null,
        message: 'No songs found',
        date: yesterdayStr 
      })
    }

    // Get the user who first logged this song
    let firstLogger = null
    if (topSong.firstEntry?.userId) {
      const { data: user } = await supabase
        .from('users')
        .select('username, name')
        .eq('id', topSong.firstEntry.userId)
        .single()
      
      if (user) {
        firstLogger = {
          username: user.username,
          name: user.name,
        }
      }
    }

    const globalSOTD: GlobalSOTD = {
      songTitle: topSong.songTitle,
      artist: topSong.artist,
      albumTitle: topSong.albumTitle,
      albumArt: topSong.albumArt,
      trackId: topSong.trackId,
      count: topSong.count,
      date: yesterdayStr,
      firstLoggedBy: firstLogger,
    }

    // Also get top 5 for a mini leaderboard
    const topSongs = Array.from(songCounts.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)
      .map(s => ({
        songTitle: s.songTitle,
        artist: s.artist,
        albumArt: s.albumArt,
        trackId: s.trackId,
        count: s.count,
      }))

    return NextResponse.json({ 
      globalSOTD,
      topSongs,
      totalEntriesYesterday: entries.length,
      uniqueSongsYesterday: songCounts.size,
      date: yesterdayStr,
    })
  } catch (error: any) {
    console.error('[global-sotd] Error:', error?.message || error)
    return NextResponse.json(
      { error: 'Failed to get global song of the day' },
      { status: 500 }
    )
  }
}

