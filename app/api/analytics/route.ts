import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { getSupabase } from '@/lib/supabase'
import { getPrismaUserIdFromClerk } from '@/lib/clerk-sync'

export async function GET(request: Request) {
  try {
    const { userId: clerkUserId } = await auth()
    if (!clerkUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const prismaUserId = await getPrismaUserIdFromClerk(clerkUserId)
    if (!prismaUserId) {
      return NextResponse.json({ error: 'User not found in database' }, { status: 404 })
    }

    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId') || prismaUserId
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    const supabase = getSupabase()

    let query = supabase
      .from('entries')
      .select('artist, songTitle, date, albumArt')
      .eq('userId', userId)

    if (startDate && endDate) {
      query = query.gte('date', startDate).lte('date', endDate)
    }

    const { data: entries, error } = await query

    if (error) throw error

    // Get person references for entries
    const entryIds = (entries || []).map(e => e.id).filter(Boolean)
    let personRefs: any[] = []
    if (entryIds.length > 0) {
      const { data } = await supabase
        .from('person_references')
        .select('entryId, name')
        .in('entryId', entryIds)
      personRefs = data || []
    }

    // Group person refs by entry
    const personRefsByEntry = new Map<string, string[]>()
    personRefs.forEach((pr) => {
      const existing = personRefsByEntry.get(pr.entryId) || []
      existing.push(pr.name)
      personRefsByEntry.set(pr.entryId, existing)
    })

    // Calculate top artists
    const artistCounts: Record<string, number> = {}
    ;(entries || []).forEach((entry) => {
      artistCounts[entry.artist] = (artistCounts[entry.artist] || 0) + 1
    })

    const topArtists = Object.entries(artistCounts)
      .map(([artist, count]) => ({ artist, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)

    // Calculate top songs
    const songCounts: Record<string, number> = {}
    ;(entries || []).forEach((entry) => {
      const key = `${entry.songTitle} - ${entry.artist}`
      songCounts[key] = (songCounts[key] || 0) + 1
    })

    const topSongs = Object.entries(songCounts)
      .map(([song, count]) => {
        const [songTitle, artist] = song.split(' - ')
        const entry = (entries || []).find(e => e.songTitle === songTitle && e.artist === artist)
        return { 
          songTitle, 
          artist, 
          count,
          albumArt: entry?.albumArt || null
        }
      })
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)

    // Calculate top people
    const peopleCounts: Record<string, number> = {}
    personRefs.forEach((pr) => {
      peopleCounts[pr.name] = (peopleCounts[pr.name] || 0) + 1
    })

    const topPeople = Object.entries(peopleCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 20)

    return NextResponse.json({ topArtists, topSongs, topPeople })
  } catch (error: any) {
    console.error('[analytics] Error:', error?.message || error)
    return NextResponse.json(
      { error: 'Failed to fetch analytics', message: error?.message },
      { status: 500 }
    )
  }
}
