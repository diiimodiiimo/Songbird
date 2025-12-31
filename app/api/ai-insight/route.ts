import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import SpotifyWebApi from 'spotify-web-api-node'

const spotifyApi = new SpotifyWebApi({
  clientId: process.env.SPOTIPY_CLIENT_ID,
  clientSecret: process.env.SPOTIPY_CLIENT_SECRET,
})

async function getAccessToken() {
  try {
    const data = await spotifyApi.clientCredentialsGrant()
    spotifyApi.setAccessToken(data.body.access_token)
    return data.body.access_token
  } catch (error) {
    console.error('Error getting access token:', error)
    throw error
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { artists, songs, date } = await request.json()

    if (!artists || !Array.isArray(artists) || artists.length === 0) {
      return NextResponse.json({ error: 'No artists provided' }, { status: 400 })
    }

    // Count artist occurrences
    const artistCounts: { [key: string]: number } = {}
    artists.forEach((artist: string) => {
      artistCounts[artist] = (artistCounts[artist] || 0) + 1
    })

    const uniqueArtists = Array.from(new Set(artists))
    const topArtist = Object.entries(artistCounts).sort((a, b) => b[1] - a[1])[0]?.[0]

    // Fetch genre information from Spotify for smarter analysis
    let artistGenres: { [key: string]: string[] } = {}
    let genreAnalysis: { [key: string]: number } = {}
    
    try {
      await getAccessToken()
      
      // Fetch genres for unique artists (limit to avoid rate limits)
      for (const artist of uniqueArtists.slice(0, 10)) {
        try {
          const results = await spotifyApi.searchArtists(artist, { limit: 1 })
          const spotifyArtist = results.body.artists?.items[0]
          if (spotifyArtist?.genres && spotifyArtist.genres.length > 0) {
            artistGenres[artist] = spotifyArtist.genres
            spotifyArtist.genres.forEach((genre: string) => {
              genreAnalysis[genre] = (genreAnalysis[genre] || 0) + 1
            })
          }
        } catch (err) {
          // Continue if artist not found
          console.error(`Error fetching genre for ${artist}:`, err)
        }
      }
    } catch (err) {
      console.error('Error fetching Spotify data:', err)
      // Continue with basic analysis if Spotify fails
    }

    // Analyze song titles for themes
    const allSongTitles = songs.join(' ').toLowerCase()
    const allArtists = artists.join(' ').toLowerCase()
    const allText = allSongTitles + ' ' + allArtists

    // Detect themes from song titles
    const themeKeywords: { [key: string]: string[] } = {
      love: ['love', 'heart', 'kiss', 'romance', 'darling', 'baby', 'sweet'],
      party: ['party', 'dance', 'club', 'night', 'celebration', 'fun'],
      emotional: ['cry', 'tears', 'sad', 'lonely', 'hurt', 'pain', 'broken'],
      energetic: ['fire', 'energy', 'power', 'strong', 'wild', 'intense'],
      chill: ['calm', 'peace', 'quiet', 'soft', 'gentle', 'smooth', 'easy'],
      nostalgic: ['memory', 'remember', 'old', 'past', 'yesterday', 'time'],
    }

    const detectedThemes: string[] = []
    for (const [theme, keywords] of Object.entries(themeKeywords)) {
      if (keywords.some(keyword => allSongTitles.includes(keyword))) {
        detectedThemes.push(theme)
      }
    }

    // Analyze genre patterns
    const topGenres = Object.entries(genreAnalysis)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([genre]) => genre)

    // Build smart insight
    let insight = ''

    // Pattern 1: Single artist deep dive
    if (uniqueArtists.length === 1) {
      const genres = artistGenres[topArtist || ''] || []
      const genreDesc = genres.length > 0 ? `, blending ${genres.slice(0, 2).join(' and ')}` : ''
      insight = `A deep dive into ${topArtist}${genreDesc}—${artists.length} ${artists.length === 1 ? 'track' : 'tracks'} showing your connection to their sound.`
    }
    // Pattern 2: Dominant artist with support
    else if (uniqueArtists.length <= 3 && topArtist && artistCounts[topArtist] >= 2) {
      const otherArtists = uniqueArtists.filter(a => a !== topArtist)
      const genres = artistGenres[topArtist || ''] || []
      const genreDesc = genres.length > 0 ? ` (${genres[0]})` : ''
      insight = `${topArtist}${genreDesc} dominates this day, with ${otherArtists.length === 1 ? otherArtists[0] : otherArtists.join(' and ')} adding ${otherArtists.length === 1 ? 'a different flavor' : 'variety'}.`
    }
    // Pattern 3: Genre-cohesive selection
    else if (topGenres.length >= 2 && topGenres[0] && genreAnalysis[topGenres[0]] >= 2) {
      insight = `A ${topGenres[0]}-focused day with ${uniqueArtists.length} artists—${uniqueArtists.slice(0, 3).join(', ')}${uniqueArtists.length > 3 ? ' and more' : ''}—creating a cohesive ${topGenres[0]} atmosphere.`
    }
    // Pattern 4: Small curated mix
    else if (uniqueArtists.length <= 5) {
      const genres = topGenres.length > 0 ? ` (${topGenres.join(', ')})` : ''
      insight = `A curated selection of ${uniqueArtists.length} artists${genres}—${uniqueArtists.slice(0, 3).join(', ')}${uniqueArtists.length > 3 ? ' and more' : ''}—showing intentional listening.`
    }
    // Pattern 5: Eclectic exploration
    else {
      insight = `An eclectic journey through ${uniqueArtists.length} different artists—from ${uniqueArtists[0]} to ${uniqueArtists[uniqueArtists.length - 1]}—showing a day of musical exploration across genres.`
    }

    // Add theme detection
    if (detectedThemes.length > 0) {
      const themeText = detectedThemes.length === 1 
        ? detectedThemes[0] 
        : detectedThemes.slice(0, 2).join(' and ')
      insight += ` The ${themeText} theme${detectedThemes.length > 1 ? 's' : ''} ${detectedThemes.length > 1 ? 'emerge' : 'emerges'} through the song titles.`
    }

    // Add genre insight if available
    if (topGenres.length === 1 && topGenres[0]) {
      insight += ` The ${topGenres[0]} sound ties everything together.`
    } else if (topGenres.length >= 2) {
      insight += ` ${topGenres[0]} and ${topGenres[1]} blend throughout.`
    }

    return NextResponse.json({ insight })
  } catch (error: any) {
    console.error('Error generating AI insight:', error)
    return NextResponse.json(
      { error: 'Failed to generate insight', message: error?.message },
      { status: 500 }
    )
  }
}

