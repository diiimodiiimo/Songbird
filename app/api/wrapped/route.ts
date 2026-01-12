import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import SpotifyWebApi from 'spotify-web-api-node'
import { getPrismaUserIdFromClerk } from '@/lib/clerk-sync'

const spotifyApi = new SpotifyWebApi({
  clientId: process.env.SPOTIFY_CLIENT_ID!,
  clientSecret: process.env.SPOTIFY_CLIENT_SECRET!,
})

async function getSpotifyAccessToken() {
  const data = await spotifyApi.clientCredentialsGrant()
  spotifyApi.setAccessToken(data.body.access_token)
  return data.body.access_token
}

// Helper to get season from date
// Winter: Jan-Mar, Spring: Apr-Jun, Summer: Jul-Sep, Fall: Oct-Dec
function getSeason(date: Date): 'winter' | 'spring' | 'summer' | 'fall' {
  const month = date.getMonth() + 1 // 1-12
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

    // Convert Clerk user ID to Prisma user ID
    const userId = await getPrismaUserIdFromClerk(clerkUserId)
    if (!userId) {
      return NextResponse.json({ error: 'User not found in database' }, { status: 404 })
    }

    const { searchParams } = new URL(request.url)
    const year = searchParams.get('year') || new Date().getFullYear().toString()

    const yearNum = parseInt(year)
    // Use UTC dates to match how entries are stored (at noon UTC)
    const startDate = new Date(Date.UTC(yearNum, 0, 1, 0, 0, 0, 0)) // Jan 1 UTC
    const endDate = new Date(Date.UTC(yearNum, 11, 31, 23, 59, 59, 999)) // Dec 31 UTC

    // Get all entries for the calendar year (including notes for sentiment analysis)
    // First, let's check if user has any entries at all
    const allUserEntries = await prisma.entry.findMany({
      where: {
        userId: userId,
      },
      select: {
        date: true,
      },
      take: 1,
    })

    const entries = await prisma.entry.findMany({
      where: {
        userId: userId,
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      select: {
        id: true,
        date: true,
        songTitle: true,
        artist: true,
        albumTitle: true,
        albumArt: true,
        durationMs: true,
        explicit: true,
        popularity: true,
        releaseDate: true,
        trackId: true,
        uri: true,
        notes: true,
        people: {
          select: {
            name: true,
          },
        },
      },
      orderBy: {
        date: 'asc',
      },
    })

    if (entries.length === 0) {
      // Check if user has entries in other years
      const availableYears: number[] = []
      if (allUserEntries.length > 0) {
        const allEntries = await prisma.entry.findMany({
          where: {
            userId: userId,
          },
          select: {
            date: true,
          },
        })
        const years = new Set(allEntries.map(e => new Date(e.date).getFullYear()))
        availableYears.push(...Array.from(years).sort((a, b) => b - a))
      }

      return NextResponse.json({
        error: 'No entries found for this year',
        year: yearNum,
        availableYears: availableYears.length > 0 ? availableYears : null,
      }, { status: 404 })
    }

    // 1. Total entries
    const totalEntries = entries.length

    // 2. Longest streak (consecutive days with entries)
    let longestStreak = 0
    let currentStreak = 0
    let lastDate: Date | null = null

    entries.forEach((entry) => {
      const entryDate = new Date(entry.date)
      entryDate.setHours(0, 0, 0, 0)

      if (lastDate) {
        const daysDiff = Math.floor((entryDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24))
        if (daysDiff === 1) {
          // Consecutive day
          currentStreak++
        } else {
          // Streak broken
          longestStreak = Math.max(longestStreak, currentStreak)
          currentStreak = 1
        }
      } else {
        currentStreak = 1
      }
      lastDate = entryDate
    })
    longestStreak = Math.max(longestStreak, currentStreak)

    // 3. Top artists (year + by season)
    const artistCounts: Record<string, number> = {}
    const seasonArtists: Record<'winter' | 'spring' | 'summer' | 'fall', Record<string, number>> = {
      winter: {},
      spring: {},
      summer: {},
      fall: {},
    }

    entries.forEach((entry) => {
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

    // 4. Top songs
    const songCounts: Record<string, number> = {}
    entries.forEach((entry) => {
      const key = `${entry.songTitle} - ${entry.artist}`
      songCounts[key] = (songCounts[key] || 0) + 1
    })

    const topSongs = Object.entries(songCounts)
      .map(([song, count]) => {
        const [songTitle, artist] = song.split(' - ')
        return { songTitle, artist, count }
      })
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)

    // Get album art for top songs
    const topSongsWithArt = topSongs.map((song) => {
      const entry = entries.find(e => e.songTitle === song.songTitle && e.artist === song.artist)
      return {
        ...song,
        albumArt: entry?.albumArt || null,
      }
    })

    // 5. Most repeated song (removed from cards but keeping in data for now)

    // 6. Returning artists over time (artists that appear in multiple months)
    const artistMonths: Record<string, Set<number>> = {}
    entries.forEach((entry) => {
      const month = new Date(entry.date).getMonth()
      if (!artistMonths[entry.artist]) {
        artistMonths[entry.artist] = new Set()
      }
      artistMonths[entry.artist].add(month)
    })

    const returningArtists = Object.entries(artistMonths)
      .filter(([_, months]) => months.size >= 2) // Appeared in 2+ months
      .map(([artist, months]) => ({
        artist,
        monthCount: months.size,
        totalCount: artistCounts[artist] || 0,
      }))
      .sort((a, b) => b.monthCount - a.monthCount || b.totalCount - a.totalCount)
      .slice(0, 5)

    // 7. Friend stats (People in Your Day)
    const peopleCounts: Record<string, number> = {}
    entries.forEach((entry) => {
      entry.people.forEach((person) => {
        peopleCounts[person.name] = (peopleCounts[person.name] || 0) + 1
      })
    })

    const topPeople = Object.entries(peopleCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)

    const mostMentionedPerson = topPeople.length > 0 ? topPeople[0] : null

    // 8. Keyword Frequency Analysis (Option 1)
    // Extract common words from notes for each artist and person
    const artistKeywords: Record<string, Record<string, number>> = {} // artist -> word -> count
    const personKeywords: Record<string, Record<string, number>> = {} // person -> word -> count
    
    // Common stop words to exclude
    const stopWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'from', 'as', 'is', 'was', 'are', 'were', 'been', 'be', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'must', 'can', 'this', 'that', 'these', 'those', 'i', 'you', 'he', 'she', 'it', 'we', 'they', 'me', 'him', 'her', 'us', 'them'])
    
    // Simple word extraction (split by spaces, remove punctuation)
    const extractWords = (text: string): string[] => {
      return text
        .toLowerCase()
        .replace(/[^\w\s]/g, ' ') // Replace punctuation with spaces
        .split(/\s+/)
        .filter(word => word.length > 2 && !stopWords.has(word)) // Only words > 2 chars, not stop words
    }

    // 9. Note-Song Sentiment Matching
    // Use Spotify audio features (valence/energy) to compare with note sentiment
    const positiveWords = ['happy', 'great', 'amazing', 'love', 'wonderful', 'beautiful', 'perfect', 'excited', 'joy', 'bliss', 'grateful', 'blessed', 'fantastic', 'awesome', 'incredible', 'best', 'favorite', 'enjoyed', 'fun', 'good', 'nice', 'sweet', 'lovely', 'brilliant', 'excellent', 'loved', 'amazing', 'incredible', 'perfect', 'wonderful']
    const negativeWords = ['sad', 'bad', 'hard', 'difficult', 'tough', 'struggle', 'pain', 'hurt', 'angry', 'frustrated', 'disappointed', 'worried', 'anxious', 'stress', 'tired', 'exhausted', 'lonely', 'miss', 'lost', 'confused', 'overwhelmed']
    
    const noteSongMatches: Array<{
      songTitle: string
      artist: string
      trackId: string
      noteSentiment: 'positive' | 'negative' | 'neutral'
      songValence: number | null
      matchType: 'aligned' | 'diverged' | 'unknown'
    }> = []

    // Get Spotify access token once (reused for all tracks)
    let spotifyTokenObtained = false
    try {
      await getSpotifyAccessToken()
      spotifyTokenObtained = true
    } catch (error) {
      console.error('Error getting Spotify token:', error)
    }

    // Process entries for keyword frequency and sentiment matching
    for (const entry of entries) {
      if (!entry.notes) continue

      const notesLower = entry.notes.toLowerCase()
      const words = extractWords(entry.notes)
      
      // Track keywords by artist
      if (!artistKeywords[entry.artist]) {
        artistKeywords[entry.artist] = {}
      }
      words.forEach(word => {
        artistKeywords[entry.artist][word] = (artistKeywords[entry.artist][word] || 0) + 1
      })

      // Track keywords by person
      entry.people.forEach((person) => {
        if (!personKeywords[person.name]) {
          personKeywords[person.name] = {}
        }
        words.forEach(word => {
          personKeywords[person.name][word] = (personKeywords[person.name][word] || 0) + 1
        })
      })

      // Note sentiment analysis
      const foundPositiveWords = positiveWords.filter(word => notesLower.includes(word))
      const foundNegativeWords = negativeWords.filter(word => notesLower.includes(word))
      const positiveCount = foundPositiveWords.length
      const negativeCount = foundNegativeWords.length
      const noteSentiment: 'positive' | 'negative' | 'neutral' = positiveCount > negativeCount ? 'positive' : negativeCount > positiveCount ? 'negative' : 'neutral'

      // Get song audio features for sentiment matching (only if we have token)
      if (spotifyTokenObtained) {
        try {
          const audioFeatures = await spotifyApi.getAudioFeaturesForTrack(entry.trackId)
          const songValence = audioFeatures.body.valence // 0.0 (sad) to 1.0 (happy)
          
          // Determine match type
          let matchType: 'aligned' | 'diverged' | 'unknown' = 'unknown'
          if (noteSentiment === 'positive' && songValence > 0.6) {
            matchType = 'aligned' // Both positive
          } else if (noteSentiment === 'negative' && songValence < 0.4) {
            matchType = 'aligned' // Both negative
          } else if (noteSentiment === 'positive' && songValence < 0.4) {
            matchType = 'diverged' // Note positive, song sad
          } else if (noteSentiment === 'negative' && songValence > 0.6) {
            matchType = 'diverged' // Note negative, song happy
          }

          noteSongMatches.push({
            songTitle: entry.songTitle,
            artist: entry.artist,
            trackId: entry.trackId,
            noteSentiment,
            songValence,
            matchType,
          })
        } catch (error) {
          // If we can't get audio features, skip this entry
          console.error(`Error getting audio features for ${entry.trackId}:`, error)
        }
      }
    }

    // Get top keywords for each artist (top 5 most frequent)
    const artistTopKeywords: Record<string, Array<{ word: string; count: number }>> = {}
    Object.entries(artistKeywords).forEach(([artist, words]) => {
      artistTopKeywords[artist] = Object.entries(words)
        .map(([word, count]) => ({ word, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5)
    })

    // Get top keywords for each person (top 5 most frequent)
    const personTopKeywords: Record<string, Array<{ word: string; count: number }>> = {}
    Object.entries(personKeywords).forEach(([person, words]) => {
      personTopKeywords[person] = Object.entries(words)
        .map(([word, count]) => ({ word, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5)
    })

    // Analyze note-song sentiment matches
    const alignedMatches = noteSongMatches.filter(m => m.matchType === 'aligned')
    const divergedMatches = noteSongMatches.filter(m => m.matchType === 'diverged')
    const alignmentRate = noteSongMatches.length > 0 
      ? (alignedMatches.length / noteSongMatches.length) * 100 
      : 0

    // Find most aligned and most diverged songs
    const mostAlignedSong = alignedMatches.length > 0 
      ? alignedMatches[Math.floor(Math.random() * Math.min(5, alignedMatches.length))] // Pick a random one from top 5
      : null
    const mostDivergedSong = divergedMatches.length > 0
      ? divergedMatches[Math.floor(Math.random() * Math.min(5, divergedMatches.length))] // Pick a random one from top 5
      : null

    // Get top artists with keywords (for display)
    const topArtistsWithKeywords = topArtists
      .filter(artist => artistTopKeywords[artist.artist] && artistTopKeywords[artist.artist].length > 0)
      .slice(0, 3)
      .map(artist => ({
        artist: artist.artist,
        keywords: artistTopKeywords[artist.artist],
      }))

    // Get top people with keywords (for display)
    const topPeopleWithKeywords = topPeople
      .filter(person => personTopKeywords[person.name] && personTopKeywords[person.name].length > 0)
      .slice(0, 3)
      .map(person => ({
        person: person.name,
        keywords: personTopKeywords[person.name],
      }))


    // Get seasonal progression (artists and songs by season)
    const seasonalData: Record<'winter' | 'spring' | 'summer' | 'fall', { artists: string[]; songs: Array<{ songTitle: string; artist: string }> }> = {
      winter: { artists: [], songs: [] },
      spring: { artists: [], songs: [] },
      summer: { artists: [], songs: [] },
      fall: { artists: [], songs: [] },
    }

    entries.forEach((entry) => {
      const season = getSeason(new Date(entry.date))
      if (!seasonalData[season].artists.includes(entry.artist)) {
        seasonalData[season].artists.push(entry.artist)
      }
      const songKey = `${entry.songTitle} - ${entry.artist}`
      if (!seasonalData[season].songs.some(s => s.songTitle === entry.songTitle && s.artist === entry.artist)) {
        seasonalData[season].songs.push({ songTitle: entry.songTitle, artist: entry.artist })
      }
    })

    return NextResponse.json({
      year: yearNum,
      totalEntries,
      longestStreak,
      topArtists,
      topArtistsBySeason,
      topSongs: topSongsWithArt,
      returningArtists,
      topPeople,
      mostMentionedPerson,
      seasonalData,
      keywordAnalysis: {
        topArtistsWithKeywords,
        topPeopleWithKeywords,
      },
      noteSongMatching: {
        alignmentRate: Math.round(alignmentRate),
        totalMatches: noteSongMatches.length,
        mostAlignedSong,
        mostDivergedSong,
      },
    })
  } catch (error) {
    console.error('Error fetching wrapped data:', error)
    return NextResponse.json(
      { error: 'Failed to fetch wrapped data' },
      { status: 500 }
    )
  }
}

