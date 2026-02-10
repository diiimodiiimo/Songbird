import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { getSupabase } from '@/lib/supabase'
import SpotifyWebApi from 'spotify-web-api-node'
import { getUserIdFromClerk } from '@/lib/clerk-sync'
import { canAccessWrapped } from '@/lib/paywall'

const spotifyApi = new SpotifyWebApi({
  clientId: process.env.SPOTIFY_CLIENT_ID!,
  clientSecret: process.env.SPOTIFY_CLIENT_SECRET!,
})

async function getSpotifyAccessToken() {
  const data = await spotifyApi.clientCredentialsGrant()
  spotifyApi.setAccessToken(data.body.access_token)
  return data.body.access_token
}

function getSeason(date: Date): 'winter' | 'spring' | 'summer' | 'fall' {
  const month = date.getMonth() + 1
  if (month >= 1 && month <= 3) return 'winter'
  if (month >= 4 && month <= 6) return 'spring'
  if (month >= 7 && month <= 9) return 'summer'
  return 'fall'
}

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

    // Check paywall: Wrapped is premium only
    const wrappedCheck = await canAccessWrapped(clerkUserId)
    if (!wrappedCheck.allowed) {
      return NextResponse.json(
        { 
          error: 'Premium feature',
          message: wrappedCheck.reason,
          upgradeRequired: true,
        },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const year = searchParams.get('year') || new Date().getFullYear().toString()
    const yearNum = parseInt(year)

    const startDate = new Date(Date.UTC(yearNum, 0, 1, 0, 0, 0, 0)).toISOString()
    const endDate = new Date(Date.UTC(yearNum, 11, 31, 23, 59, 59, 999)).toISOString()

    const supabase = getSupabase()

    // Get ALL entries for the year with pagination
    const allEntries: any[] = []
    let page = 0
    const pageSize = 1000
    let hasMore = true

    while (hasMore) {
      const { data: pageEntries, error: pageError } = await supabase
        .from('entries')
        .select('id, date, songTitle, artist, albumTitle, albumArt, durationMs, explicit, popularity, releaseDate, trackId, uri, notes')
        .eq('userId', userId)
        .gte('date', startDate)
        .lte('date', endDate)
        .order('date', { ascending: true })
        .range(page * pageSize, (page + 1) * pageSize - 1)

      if (pageError) throw pageError

      if (pageEntries && pageEntries.length > 0) {
        allEntries.push(...pageEntries)
        hasMore = pageEntries.length === pageSize
        page++
      } else {
        hasMore = false
      }

      // Safety limit
      if (page >= 10) break
    }

    const entries = allEntries

    if (!entries || entries.length === 0) {
      // Check available years
      const { data: allEntries } = await supabase
        .from('entries')
        .select('date')
        .eq('userId', userId)

      const years = new Set((allEntries || []).map(e => new Date(e.date).getFullYear()))
      const availableYears = Array.from(years).sort((a, b) => b - a)

      return NextResponse.json({
        error: 'No entries found for this year',
        year: yearNum,
        availableYears: availableYears.length > 0 ? availableYears : null,
      }, { status: 404 })
    }

    // Get person references for entries
    const entryIds = entries.map(e => e.id)
    const { data: personRefs } = await supabase
      .from('person_references')
      .select('entryId, name')
      .in('entryId', entryIds)

    const peopleByEntry = new Map<string, string[]>()
    ;(personRefs || []).forEach((pr) => {
      const existing = peopleByEntry.get(pr.entryId) || []
      existing.push(pr.name)
      peopleByEntry.set(pr.entryId, existing)
    })

    const entriesWithPeople = entries.map(e => ({
      ...e,
      people: (peopleByEntry.get(e.id) || []).map(name => ({ name }))
    }))

    // Calculate stats
    const totalEntries = entriesWithPeople.length

    // Longest streak
    let longestStreak = 0
    let currentStreak = 0
    let lastDate: Date | null = null

    entriesWithPeople.forEach((entry) => {
      const entryDate = new Date(entry.date)
      entryDate.setHours(0, 0, 0, 0)

      if (lastDate) {
        const daysDiff = Math.floor((entryDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24))
        if (daysDiff === 1) {
          currentStreak++
        } else {
          longestStreak = Math.max(longestStreak, currentStreak)
          currentStreak = 1
        }
      } else {
        currentStreak = 1
      }
      lastDate = entryDate
    })
    longestStreak = Math.max(longestStreak, currentStreak)

    // Top artists
    const artistCounts: Record<string, number> = {}
    const seasonArtists: Record<'winter' | 'spring' | 'summer' | 'fall', Record<string, number>> = {
      winter: {}, spring: {}, summer: {}, fall: {},
    }

    entriesWithPeople.forEach((entry) => {
      const season = getSeason(new Date(entry.date))
      artistCounts[entry.artist] = (artistCounts[entry.artist] || 0) + 1
      seasonArtists[season][entry.artist] = (seasonArtists[season][entry.artist] || 0) + 1
    })

    const topArtists = Object.entries(artistCounts)
      .map(([artist, count]) => ({ artist, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)

    const topArtistsBySeason: Record<string, Array<{ artist: string; count: number }>> = {}
    Object.entries(seasonArtists).forEach(([season, counts]) => {
      topArtistsBySeason[season] = Object.entries(counts)
        .map(([artist, count]) => ({ artist, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 3)
    })

    // Top songs
    const songCounts: Record<string, number> = {}
    entriesWithPeople.forEach((entry) => {
      const key = `${entry.songTitle} - ${entry.artist}`
      songCounts[key] = (songCounts[key] || 0) + 1
    })

    const topSongs = Object.entries(songCounts)
      .map(([song, count]) => {
        const [songTitle, artist] = song.split(' - ')
        const entry = entriesWithPeople.find(e => e.songTitle === songTitle && e.artist === artist)
        return { songTitle, artist, count, albumArt: entry?.albumArt || null }
      })
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)

    // Returning artists
    const artistMonths: Record<string, Set<number>> = {}
    entriesWithPeople.forEach((entry) => {
      const month = new Date(entry.date).getMonth()
      if (!artistMonths[entry.artist]) {
        artistMonths[entry.artist] = new Set()
      }
      artistMonths[entry.artist].add(month)
    })

    const returningArtists = Object.entries(artistMonths)
      .filter(([, months]) => months.size >= 2)
      .map(([artist, months]) => ({
        artist,
        monthCount: months.size,
        totalCount: artistCounts[artist] || 0,
      }))
      .sort((a, b) => b.monthCount - a.monthCount || b.totalCount - a.totalCount)
      .slice(0, 5)

    // Top people
    const peopleCounts: Record<string, number> = {}
    entriesWithPeople.forEach((entry) => {
      entry.people.forEach((person: { name: string; userId?: string | null }) => {
        peopleCounts[person.name] = (peopleCounts[person.name] || 0) + 1
      })
    })

    const topPeople = Object.entries(peopleCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)

    const mostMentionedPerson = topPeople.length > 0 ? topPeople[0] : null

    // Seasonal data
    const seasonalData: Record<'winter' | 'spring' | 'summer' | 'fall', { artists: string[]; songs: Array<{ songTitle: string; artist: string }> }> = {
      winter: { artists: [], songs: [] },
      spring: { artists: [], songs: [] },
      summer: { artists: [], songs: [] },
      fall: { artists: [], songs: [] },
    }

    entriesWithPeople.forEach((entry) => {
      const season = getSeason(new Date(entry.date))
      if (!seasonalData[season].artists.includes(entry.artist)) {
        seasonalData[season].artists.push(entry.artist)
      }
      if (!seasonalData[season].songs.some(s => s.songTitle === entry.songTitle && s.artist === entry.artist)) {
        seasonalData[season].songs.push({ songTitle: entry.songTitle, artist: entry.artist })
      }
    })

    // Simplified keyword and sentiment analysis
    const stopWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'from', 'as', 'is', 'was', 'are', 'were', 'been', 'be', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'must', 'can', 'this', 'that', 'these', 'those', 'i', 'you', 'he', 'she', 'it', 'we', 'they', 'me', 'him', 'her', 'us', 'them'])
    
    const extractWords = (text: string): string[] => {
      return text
        .toLowerCase()
        .replace(/[^\w\s]/g, ' ')
        .split(/\s+/)
        .filter(word => word.length > 2 && !stopWords.has(word))
    }

    const artistKeywords: Record<string, Record<string, number>> = {}
    const personKeywords: Record<string, Record<string, number>> = {}

    entriesWithPeople.forEach((entry) => {
      if (!entry.notes) return
      const words = extractWords(entry.notes)
      
      if (!artistKeywords[entry.artist]) artistKeywords[entry.artist] = {}
      words.forEach(word => {
        artistKeywords[entry.artist][word] = (artistKeywords[entry.artist][word] || 0) + 1
      })

      entry.people.forEach((person: { name: string }) => {
        if (!personKeywords[person.name]) personKeywords[person.name] = {}
        words.forEach(word => {
          personKeywords[person.name][word] = (personKeywords[person.name][word] || 0) + 1
        })
      })
    })

    const artistTopKeywords: Record<string, Array<{ word: string; count: number }>> = {}
    Object.entries(artistKeywords).forEach(([artist, words]) => {
      artistTopKeywords[artist] = Object.entries(words)
        .map(([word, count]) => ({ word, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5)
    })

    const topArtistsWithKeywords = topArtists
      .filter(artist => artistTopKeywords[artist.artist]?.length > 0)
      .slice(0, 3)
      .map(artist => ({
        artist: artist.artist,
        keywords: artistTopKeywords[artist.artist],
      }))

    const personTopKeywords: Record<string, Array<{ word: string; count: number }>> = {}
    Object.entries(personKeywords).forEach(([person, words]) => {
      personTopKeywords[person] = Object.entries(words)
        .map(([word, count]) => ({ word, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5)
    })

    const topPeopleWithKeywords = topPeople
      .filter(person => personTopKeywords[person.name]?.length > 0)
      .slice(0, 3)
      .map(person => ({
        person: person.name,
        keywords: personTopKeywords[person.name],
      }))

    return NextResponse.json({
      year: yearNum,
      totalEntries,
      longestStreak,
      topArtists,
      topArtistsBySeason,
      topSongs,
      returningArtists,
      topPeople,
      mostMentionedPerson,
      seasonalData,
      keywordAnalysis: {
        topArtistsWithKeywords,
        topPeopleWithKeywords,
      },
      noteSongMatching: {
        alignmentRate: 0,
        totalMatches: 0,
        mostAlignedSong: null,
        mostDivergedSong: null,
      },
    })
  } catch (error: any) {
    console.error('[wrapped] Error:', error?.message || error)
    return NextResponse.json(
      { error: 'Failed to fetch wrapped data', message: error?.message },
      { status: 500 }
    )
  }
}
