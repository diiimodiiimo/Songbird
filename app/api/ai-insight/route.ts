import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
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

// ============================================================================
// TYPES
// ============================================================================

interface YearEntry {
  year: number
  song: string
  artist: string
  genre?: string
  person?: string
}

// ============================================================================
// HELPERS
// ============================================================================

function randomChoice<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

// Simplify genre to broad category
function simplifyGenre(genre: string): string {
  const g = genre.toLowerCase()
  if (g.includes('rap') || g.includes('hip hop') || g.includes('trap')) return 'rap'
  if (g.includes('pop')) return 'pop'
  if (g.includes('r&b') || g.includes('soul')) return 'r&b'
  if (g.includes('rock') || g.includes('metal') || g.includes('punk')) return 'rock'
  if (g.includes('country')) return 'country'
  if (g.includes('electronic') || g.includes('edm') || g.includes('house') || g.includes('techno')) return 'electronic'
  if (g.includes('indie')) return 'indie'
  if (g.includes('jazz')) return 'jazz'
  if (g.includes('classical')) return 'classical'
  if (g.includes('latin') || g.includes('reggaeton')) return 'latin'
  return genre.split(' ')[0] // just take first word
}

// ============================================================================
// BUILD DATA
// ============================================================================

async function buildEntries(
  artists: string[],
  songs: string[],
  years: number[],
  people: string[],
): Promise<YearEntry[]> {
  const entries: YearEntry[] = []
  
  for (let i = 0; i < artists.length; i++) {
    entries.push({
      year: years[i] || new Date().getFullYear(),
      song: songs[i] || '',
      artist: artists[i] || '',
      person: people[i] || undefined,
    })
  }
  
  // Sort by year descending (newest first)
  entries.sort((a, b) => b.year - a.year)
  
  // Fetch genres
  const artistGenreMap: { [key: string]: string } = {}
  try {
    await getAccessToken()
    const uniqueArtists = Array.from(new Set(artists))
    
    for (const artist of uniqueArtists.slice(0, 10)) {
      try {
        const results = await spotifyApi.searchArtists(artist, { limit: 1 })
        const spotifyArtist = results.body.artists?.items[0]
        if (spotifyArtist?.genres && spotifyArtist.genres.length > 0) {
          artistGenreMap[artist] = simplifyGenre(spotifyArtist.genres[0])
        }
      } catch (err) {
        // continue
      }
    }
  } catch (err) {
    // continue without genres
  }
  
  entries.forEach(e => {
    e.genre = artistGenreMap[e.artist] || undefined
  })
  
  return entries
}

// ============================================================================
// NARRATIVE GENERATORS
// ============================================================================

function generateMultiYearNarrative(entries: YearEntry[], allPeople: string[]): string {
  if (entries.length === 0) return ''
  if (entries.length === 1) {
    const e = entries[0]
    return `This year it was "${e.song}" by ${e.artist}.${allPeople.length > 0 ? ` ${allPeople[0]} was part of it.` : ''}`
  }
  
  const newest = entries[0]
  const oldest = entries[entries.length - 1]
  
  // Analyze genre patterns
  const genreByYear: { [year: number]: string } = {}
  entries.forEach(e => {
    if (e.genre) genreByYear[e.year] = e.genre
  })
  
  const genres = entries.map(e => e.genre).filter(g => g) as string[]
  const uniqueGenres = Array.from(new Set(genres))
  const mostCommonGenre = genres.length > 0 
    ? Object.entries(genres.reduce((acc, g) => { acc[g] = (acc[g] || 0) + 1; return acc }, {} as {[k:string]:number}))
        .sort((a, b) => b[1] - a[1])[0]?.[0]
    : null
  
  // Find which entries break from the common genre
  const outliers = entries.filter(e => e.genre && e.genre !== mostCommonGenre)
  const consistent = entries.filter(e => e.genre === mostCommonGenre)
  
  // Check for repeating artists
  const artistCounts: { [a: string]: YearEntry[] } = {}
  entries.forEach(e => {
    if (!artistCounts[e.artist]) artistCounts[e.artist] = []
    artistCounts[e.artist].push(e)
  })
  const repeatingArtist = Object.entries(artistCounts).find(([_, entries]) => entries.length >= 2)
  
  // Build the narrative
  let narrative = ''
  
  // Start with the most recent
  narrative += `This year, "${newest.song}" by ${newest.artist} was your pick`
  if (newest.genre) {
    narrative += ` for the ${newest.genre} side of things`
  }
  narrative += '. '
  
  // Handle 2 years
  if (entries.length === 2) {
    const prev = entries[1]
    if (newest.genre && prev.genre && newest.genre === prev.genre) {
      narrative += `Back in ${prev.year}, you kept it ${prev.genre} too with "${prev.song}" by ${prev.artist}.`
    } else if (prev.genre) {
      narrative += `Last time around in ${prev.year}, you went ${prev.genre} with "${prev.song}" by ${prev.artist}.`
    } else {
      narrative += `In ${prev.year}, it was "${prev.song}" by ${prev.artist}.`
    }
    
    if (allPeople.length > 0) {
      narrative += ` ${allPeople[0]} was around for at least one of these.`
    }
    
    return narrative
  }
  
  // Handle 3+ years
  if (repeatingArtist) {
    const [artist, artistEntries] = repeatingArtist
    const years = artistEntries.map(e => e.year).sort((a, b) => b - a)
    narrative += `${artist} keeps coming back, showing up in ${years.join(' and ')}. `
    
    const others = entries.filter(e => e.artist !== artist)
    if (others.length > 0) {
      const otherParts = others.map(e => `${e.year} was ${e.artist}`)
      narrative += `Meanwhile, ${otherParts.join(', and ')}.`
    }
  } else if (mostCommonGenre && consistent.length >= 2 && outliers.length >= 1) {
    // There's a pattern with an outlier
    const consistentYears = consistent.map(e => e.year).sort((a, b) => b - a)
    const consistentArtists = consistent.map(e => e.artist)
    
    narrative += `The ${mostCommonGenre} stayed consistent through ${consistentYears.join(', ')} with ${consistentArtists.join(', ')}. `
    
    const outlier = outliers[0]
    narrative += `But ${outlier.year} switched it up with some ${outlier.genre} from ${outlier.artist}'s "${outlier.song}".`
  } else {
    // No clear pattern, just tell the story
    const middle = entries.slice(1, -1)
    
    if (middle.length > 0) {
      const middleParts = middle.map(e => {
        if (e.genre) {
          return `${e.year} brought ${e.genre} vibes with ${e.artist}`
        }
        return `${e.year} had ${e.artist}`
      })
      narrative += middleParts.join(', ') + '. '
    }
    
    narrative += `And going all the way back to ${oldest.year}, it was "${oldest.song}" by ${oldest.artist}.`
  }
  
  // Add people context
  if (allPeople.length > 0) {
    if (allPeople.length === 1) {
      narrative += ` ${allPeople[0]} was there through some of this.`
    } else {
      narrative += ` ${allPeople.slice(0, 2).join(' and ')} were part of these memories.`
    }
  }
  
  return narrative
}

function generateSingleDayNarrative(entries: YearEntry[], allPeople: string[]): string {
  if (entries.length === 0) return ''
  
  if (entries.length === 1) {
    const e = entries[0]
    let s = `"${e.song}" by ${e.artist}`
    if (e.genre) s += `, some ${e.genre}`
    if (allPeople.length > 0) {
      s += ` with ${allPeople[0]}`
    }
    return s + '.'
  }
  
  // Multiple songs same day
  const artistCounts: { [a: string]: YearEntry[] } = {}
  entries.forEach(e => {
    if (!artistCounts[e.artist]) artistCounts[e.artist] = []
    artistCounts[e.artist].push(e)
  })
  
  const sorted = Object.entries(artistCounts).sort((a, b) => b[1].length - a[1].length)
  const topArtist = sorted[0]
  
  if (topArtist[1].length >= 2) {
    const songs = topArtist[1].map(e => `"${e.song}"`).join(' and ')
    let s = `You were really in a ${topArtist[0]} mood, playing ${songs}.`
    if (sorted.length > 1) {
      s += ` Also threw in some ${sorted.slice(1).map(([a]) => a).join(', ')}.`
    }
    if (allPeople.length > 0) {
      s += ` ${allPeople[0]} was vibing too.`
    }
    return s
  }
  
  // Different artists, look for genre thread
  const genres = entries.map(e => e.genre).filter(g => g) as string[]
  const uniqueGenres = Array.from(new Set(genres))
  
  if (uniqueGenres.length === 1 && genres.length >= 2) {
    const g = uniqueGenres[0]
    let s = `All ${g} today: ${entries.map(e => e.artist).join(', ')}.`
    if (allPeople.length > 0) {
      s += ` ${allPeople[0]} approved.`
    }
    return s
  }
  
  // Mixed bag
  let s = `${entries.map(e => e.artist).join(', ')} all in one day.`
  if (entries[0].song) {
    s += ` Started with "${entries[0].song}".`
  }
  if (allPeople.length > 0) {
    s += ` ${allPeople[0]} was there for it.`
  }
  return s
}

function generateRecentNarrative(entries: YearEntry[], allPeople: string[]): string {
  if (entries.length === 0) return ''
  
  const artistCounts: { [a: string]: number } = {}
  entries.forEach(e => { artistCounts[e.artist] = (artistCounts[e.artist] || 0) + 1 })
  
  const sorted = Object.entries(artistCounts).sort((a, b) => b[1] - a[1])
  const topArtist = sorted[0]
  
  const genres = entries.map(e => e.genre).filter(g => g) as string[]
  const uniqueGenres = Array.from(new Set(genres))
  
  if (topArtist && topArtist[1] >= 2) {
    const relevantSongs = entries.filter(e => e.artist === topArtist[0]).slice(0, 2).map(e => `"${e.song}"`)
    let s = `You've been on a ${topArtist[0]} kick lately, ${relevantSongs.join(' and ')} both made appearances.`
    if (sorted.length > 1) {
      s += ` Some ${sorted.slice(1, 3).map(([a]) => a).join(' and ')} mixed in too.`
    }
    if (allPeople.length > 0) {
      s += ` ${allPeople[0]} caught some of these moments.`
    }
    return s
  }
  
  if (uniqueGenres.length === 1 && genres.length >= 3) {
    const g = uniqueGenres[0]
    let s = `Your recent plays are heavy on the ${g}: ${entries.slice(0, 3).map(e => e.artist).join(', ')}.`
    if (allPeople.length > 0) {
      s += ` ${allPeople[0]} is in the mix somewhere.`
    }
    return s
  }
  
  // Variety
  if (entries.length >= 3) {
    let s = `Lately you've been all over the place: ${entries.slice(0, 4).map(e => e.artist).join(', ')}.`
    if (uniqueGenres.length >= 2) {
      s += ` Going from ${uniqueGenres[0]} to ${uniqueGenres[1]}.`
    }
    if (allPeople.length > 0) {
      s += ` ${allPeople[0]} was part of some of it.`
    }
    return s
  }
  
  // Simple
  const e = entries[0]
  let s = `"${e.song}" by ${e.artist} was a recent one.`
  if (allPeople.length > 0) {
    s += ` With ${allPeople[0]}.`
  }
  return s
}

function generateJourneyNarrative(entryCount: number, entries: YearEntry[]): string {
  if (entryCount === 0) {
    return "Your first song is waiting. What's on your mind today?"
  }
  
  if (entryCount === 1 && entries.length >= 1) {
    const e = entries[0]
    return `It started with "${e.song}" by ${e.artist}. That's your first entry. Where you go from here is up to you.`
  }
  
  if (entryCount <= 5 && entries.length >= 1) {
    const artists = Array.from(new Set(entries.map(e => e.artist)))
    if (artists.length === 1) {
      return `${entryCount} songs in, and it's all ${artists[0]} so far. Looks like you've found your artist.`
    }
    const first = entries[entries.length - 1] // oldest
    return `${entryCount} songs logged. You started with "${first.song}" by ${first.artist}, and you've been adding to the story ever since.`
  }
  
  if (entryCount <= 14 && entries.length >= 1) {
    const artists = Array.from(new Set(entries.map(e => e.artist)))
    const genres = Array.from(new Set(entries.map(e => e.genre).filter(g => g)))
    
    let s = `${entryCount} entries deep now.`
    if (artists.length === 1) {
      s += ` Still riding with ${artists[0]}.`
    } else if (genres.length === 1) {
      s += ` Staying in the ${genres[0]} lane mostly.`
    } else {
      s += ` You've explored ${artists.length} different artists so far.`
    }
    return s
  }
  
  return ''
}

// ============================================================================
// MAIN
// ============================================================================

export async function POST(request: Request) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { 
      artists, 
      songs, 
      date,
      people,
      years,
      context,
      entryCount,
    } = await request.json()

    if (!artists || !Array.isArray(artists) || artists.length === 0) {
      return NextResponse.json({ error: 'No artists provided' }, { status: 400 })
    }

    const peopleList: string[] = people || []
    const yearsList: number[] = years || artists.map(() => new Date().getFullYear())

    // Build entries with genres
    const entries = await buildEntries(artists, songs, yearsList, peopleList)

    let insight: string

    // Handle journey context (new users)
    if (context === 'journey' && entryCount !== undefined) {
      insight = generateJourneyNarrative(entryCount, entries)
      if (insight) {
        return NextResponse.json({ insight })
      }
    }

    // Handle recent context
    if (context === 'recent') {
      insight = generateRecentNarrative(entries, peopleList)
      return NextResponse.json({ insight })
    }

    // Multi-year (On This Day) or single day
    const uniqueYears = Array.from(new Set(yearsList))
    if (uniqueYears.length > 1) {
      insight = generateMultiYearNarrative(entries, peopleList)
    } else {
      insight = generateSingleDayNarrative(entries, peopleList)
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
