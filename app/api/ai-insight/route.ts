import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { getSupabase } from '@/lib/supabase'
import { getUserIdFromClerk } from '@/lib/clerk-sync'
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
  notes?: string
  people: string[]
}

interface HistoricalContext {
  artistTotalPlays: { [artist: string]: number }
  songAppearedBefore: boolean
  previousSongDate?: string
  personGenrePatterns: { [person: string]: { [genre: string]: number } }
  consecutiveYearsSameGenre: number
  userFirstEntryYear: number
  totalEntries: number
}

// ============================================================================
// HELPERS
// ============================================================================

function randomChoice<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

function simplifyGenre(genre: string): string {
  const g = genre.toLowerCase()
  if (g.includes('rap') || g.includes('hip hop') || g.includes('trap')) return 'rap'
  if (g.includes('pop') && !g.includes('k-pop')) return 'pop'
  if (g.includes('k-pop') || g.includes('kpop')) return 'k-pop'
  if (g.includes('r&b') || g.includes('soul') || g.includes('rnb')) return 'r&b'
  if (g.includes('rock') || g.includes('metal') || g.includes('punk')) return 'rock'
  if (g.includes('country')) return 'country'
  if (g.includes('electronic') || g.includes('edm') || g.includes('house') || g.includes('techno')) return 'electronic'
  if (g.includes('indie')) return 'indie'
  if (g.includes('jazz')) return 'jazz'
  if (g.includes('classical')) return 'classical'
  if (g.includes('latin') || g.includes('reggaeton')) return 'latin'
  if (g.includes('afro')) return 'afrobeats'
  return genre.split(' ')[0]
}

function extractNoteHighlights(notes: string): string[] {
  if (!notes) return []
  const highlights: string[] = []
  const lower = notes.toLowerCase()
  
  // Life events
  const lifeEvents = [
    'birthday', 'wedding', 'graduation', 'christmas', 'new year', 'thanksgiving',
    'super bowl', 'concert', 'festival', 'vacation', 'road trip', 'first date',
    'breakup', 'anniversary', 'funeral', 'prom', 'homecoming', 'party'
  ]
  lifeEvents.forEach(e => { if (lower.includes(e)) highlights.push(e) })
  
  // Feelings/states
  const feelings = [
    'happy', 'sad', 'stressed', 'anxious', 'excited', 'tired', 'sick',
    'hungover', 'drunk', 'high', 'bored', 'lonely', 'grateful', 'nostalgic',
    'miserable', 'amazing', 'perfect', 'terrible', 'rough', 'good day', 'bad day'
  ]
  feelings.forEach(f => { if (lower.includes(f)) highlights.push(f) })
  
  // School/work
  const schoolWork = [
    'exam', 'midterm', 'final', 'test', 'homework', 'project', 'deadline',
    'interview', 'meeting', 'presentation', 'work', 'class', 'school', 'college'
  ]
  schoolWork.forEach(s => { if (lower.includes(s)) highlights.push(s) })
  
  return highlights.slice(0, 3) // max 3 highlights
}

// ============================================================================
// DATA FETCHING - Get historical context from full database
// ============================================================================

async function getHistoricalContext(
  userId: string,
  currentArtists: string[],
  currentSong: string,
  currentPeople: string[],
  currentGenres: string[]
): Promise<HistoricalContext> {
  const supabase = getSupabase()
  
  // Fetch user's full entry history (limited fields for performance)
  const { data: allEntries } = await supabase
    .from('entries')
    .select('artist, songTitle, date')
    .eq('userId', userId)
    .order('date', { ascending: false })
    .limit(2000)
  
  const entries = allEntries || []
  
  // Count total plays per artist
  const artistTotalPlays: { [artist: string]: number } = {}
  entries.forEach((e: any) => {
    artistTotalPlays[e.artist] = (artistTotalPlays[e.artist] || 0) + 1
  })
  
  // Check if this exact song has appeared before
  const previousOccurrence = entries.find((e: any) => 
    e.songTitle === currentSong && e.artist === currentArtists[0]
  )
  const songAppearedBefore = !!previousOccurrence
  const previousSongDate = previousOccurrence?.date
  
  // Get first entry year
  const oldestEntry = entries[entries.length - 1]
  const userFirstEntryYear = oldestEntry 
    ? new Date(oldestEntry.date).getFullYear() 
    : new Date().getFullYear()
  
  // Person-genre patterns (need to fetch person_references)
  const personGenrePatterns: { [person: string]: { [genre: string]: number } } = {}
  
  if (currentPeople.length > 0) {
    // Get entries where these people were tagged
    const { data: personRefs } = await supabase
      .from('person_references')
      .select('name, entryId')
      .in('name', currentPeople)
      .limit(500)
    
    if (personRefs && personRefs.length > 0) {
      const entryIds = personRefs.map((p: any) => p.entryId)
      const { data: taggedEntries } = await supabase
        .from('entries')
        .select('id, artist')
        .in('id', entryIds)
        .limit(500)
      
      // We'd need to fetch genres for these artists too
      // For now, just count artist associations per person
      // This is a simplified version - full implementation would cache genres
    }
  }
  
  return {
    artistTotalPlays,
    songAppearedBefore,
    previousSongDate,
    personGenrePatterns,
    consecutiveYearsSameGenre: 0, // would need more complex calculation
    userFirstEntryYear,
    totalEntries: entries.length,
  }
}

// ============================================================================
// BUILD ENTRIES WITH GENRES
// ============================================================================

async function buildEntries(
  artists: string[],
  songs: string[],
  years: number[],
  people: string[],
  notes: string[]
): Promise<{ entries: YearEntry[], genres: string[] }> {
  const entries: YearEntry[] = []
  const artistGenreMap: { [key: string]: string } = {}
  
  // Fetch genres from Spotify
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
  
  for (let i = 0; i < artists.length; i++) {
    entries.push({
      year: years[i] || new Date().getFullYear(),
      song: songs[i] || '',
      artist: artists[i] || '',
      genre: artistGenreMap[artists[i]] || undefined,
      notes: notes[i] || undefined,
      people: [], // Will be filled per-entry if we have that data
    })
  }
  
  // Sort by year descending (newest first)
  entries.sort((a, b) => b.year - a.year)
  
  const allGenres = Object.values(artistGenreMap)
  
  return { entries, genres: allGenres }
}

// ============================================================================
// NARRATIVE GENERATION
// ============================================================================

function generateMultiYearNarrative(
  entries: YearEntry[], 
  allPeople: string[],
  history: HistoricalContext
): string {
  if (entries.length === 0) return ''
  
  const newest = entries[0]
  const oldest = entries[entries.length - 1]
  const yearSpan = newest.year - oldest.year + 1
  
  // Analyze patterns
  const genreByYear: { [year: number]: string } = {}
  entries.forEach(e => { if (e.genre) genreByYear[e.year] = e.genre })
  
  const genres = entries.map(e => e.genre).filter(g => g) as string[]
  const uniqueGenres = Array.from(new Set(genres))
  const dominantGenre = genres.length > 0
    ? Object.entries(genres.reduce((acc, g) => { acc[g] = (acc[g] || 0) + 1; return acc }, {} as {[k:string]:number}))
        .sort((a, b) => b[1] - a[1])[0]?.[0]
    : null
  
  const genreOutliers = dominantGenre 
    ? entries.filter(e => e.genre && e.genre !== dominantGenre)
    : []
  const genreConsistent = dominantGenre
    ? entries.filter(e => e.genre === dominantGenre)
    : []
  
  // Check for repeating artists
  const artistCounts: { [a: string]: YearEntry[] } = {}
  entries.forEach(e => {
    if (!artistCounts[e.artist]) artistCounts[e.artist] = []
    artistCounts[e.artist].push(e)
  })
  const repeatingArtist = Object.entries(artistCounts).find(([_, ents]) => ents.length >= 2)
  
  // Extract note highlights across years
  const allNoteHighlights: { year: number, highlights: string[] }[] = []
  entries.forEach(e => {
    if (e.notes) {
      const highlights = extractNoteHighlights(e.notes)
      if (highlights.length > 0) {
        allNoteHighlights.push({ year: e.year, highlights })
      }
    }
  })
  
  // Build narrative
  let narrative = ''
  
  // --- OPENING: Set the scene with years ---
  if (yearSpan >= 3) {
    narrative += `${yearSpan} years of this date. `
  }
  
  // --- SECTION 1: Start with most recent ---
  narrative += `This year it was "${newest.song}" by ${newest.artist}`
  
  // Add historical depth for the artist
  const artistTotal = history.artistTotalPlays[newest.artist] || 0
  if (artistTotal >= 10) {
    narrative += `, who you've logged ${artistTotal} times overall`
  } else if (artistTotal >= 5) {
    narrative += `, a regular in your rotation`
  }
  narrative += '. '
  
  // --- SECTION 2: Walk through the years with patterns ---
  if (entries.length === 2) {
    const prev = entries[1]
    if (newest.genre && prev.genre && newest.genre === prev.genre) {
      narrative += `Last year was also ${newest.genre} with "${prev.song}" by ${prev.artist}. `
    } else if (newest.genre && prev.genre) {
      narrative += `${prev.year} went a different direction with ${prev.genre} from ${prev.artist}. `
    } else {
      narrative += `Before that in ${prev.year}, it was ${prev.artist} with "${prev.song}". `
    }
  } else if (entries.length >= 3) {
    // Multiple years - find the story
    
    if (repeatingArtist) {
      const [artist, artistEntries] = repeatingArtist
      const years = artistEntries.map(e => e.year).sort((a, b) => b - a)
      const songs = artistEntries.map(e => `"${e.song}"`).join(' and ')
      narrative += `${artist} keeps coming back on this date, showing up in ${years.join(' and ')} with ${songs}. `
      
      const others = entries.filter(e => e.artist !== artist)
      if (others.length === 1) {
        narrative += `The only exception was ${others[0].year} when you went with ${others[0].artist}. `
      } else if (others.length > 1) {
        const otherStr = others.map(e => `${e.artist} in ${e.year}`).join(', ')
        narrative += `${otherStr} filled in the other years. `
      }
    } else if (dominantGenre && genreConsistent.length >= 2 && genreOutliers.length >= 1) {
      // Genre pattern with outliers
      const consistentYears = genreConsistent.map(e => e.year).sort((a, b) => b - a)
      const consistentArtists = genreConsistent.map(e => e.artist).join(', ')
      
      narrative += `${dominantGenre} runs deep on this date, with ${consistentArtists} holding it down in ${consistentYears.join(', ')}. `
      
      const outlier = genreOutliers[0]
      narrative += `But ${outlier.year} broke the pattern with ${outlier.genre} from ${outlier.artist}'s "${outlier.song}". `
    } else {
      // No clear pattern - tell the journey
      const middle = entries.slice(1, -1)
      
      narrative += `Going back: `
      const journey = entries.slice(1).map(e => {
        let part = `${e.year} was ${e.artist}`
        if (e.genre && e.genre !== newest.genre) {
          part += ` (${e.genre})`
        }
        return part
      })
      narrative += journey.join(', ') + '. '
    }
  }
  
  // --- SECTION 3: Note highlights (life context) ---
  if (allNoteHighlights.length > 0) {
    const highlight = allNoteHighlights[0]
    const eventText = highlight.highlights[0]
    if (eventText) {
      narrative += `Your notes from ${highlight.year} mention "${eventText}" so that song carries that memory now. `
    }
  }
  
  // --- SECTION 4: People ---
  if (allPeople.length > 0) {
    if (allPeople.length === 1) {
      narrative += `${allPeople[0]} was part of at least one of these moments. `
    } else {
      narrative += `${allPeople.slice(0, 2).join(' and ')} show up in these memories. `
    }
  }
  
  // --- SECTION 5: Song history ---
  if (history.songAppearedBefore && history.previousSongDate) {
    const prevDate = new Date(history.previousSongDate)
    const monthName = prevDate.toLocaleString('default', { month: 'long' })
    narrative += `"${newest.song}" actually showed up before, back in ${monthName} ${prevDate.getFullYear()}. `
  }
  
  return narrative.trim()
}

function generateSingleDayNarrative(
  entries: YearEntry[], 
  allPeople: string[],
  history: HistoricalContext
): string {
  if (entries.length === 0) return ''
  
  if (entries.length === 1) {
    const e = entries[0]
    let s = `"${e.song}" by ${e.artist}`
    
    const artistTotal = history.artistTotalPlays[e.artist] || 0
    if (artistTotal >= 20) {
      s += `, one of your most played artists overall`
    } else if (artistTotal >= 5) {
      s += `, a familiar name in your log`
    }
    
    if (e.genre) {
      s += `. ${e.genre} mood`
    }
    
    if (allPeople.length > 0) {
      s += `. With ${allPeople[0]}`
    }
    
    if (e.notes) {
      const highlights = extractNoteHighlights(e.notes)
      if (highlights.length > 0) {
        s += `. Your notes mention "${highlights[0]}"`
      }
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
    let s = `${topArtist[0]} on repeat, ${songs} both got plays`
    
    if (sorted.length > 1) {
      s += `. Also threw in some ${sorted.slice(1, 3).map(([a]) => a).join(', ')}`
    }
    
    if (allPeople.length > 0) {
      s += `. ${allPeople[0]} was there for this`
    }
    
    return s + '.'
  }
  
  // Different artists
  const genres = entries.map(e => e.genre).filter(g => g) as string[]
  const uniqueGenres = Array.from(new Set(genres))
  
  if (uniqueGenres.length === 1 && genres.length >= 2) {
    return `All ${uniqueGenres[0]} today with ${entries.map(e => e.artist).join(', ')}.${allPeople.length > 0 ? ` ${allPeople[0]} approved.` : ''}`
  }
  
  let s = `${entries.map(e => e.artist).join(', ')} all in one day`
  if (entries[0].song) {
    s += `. "${entries[0].song}" kicked it off`
  }
  if (allPeople.length > 0) {
    s += `. ${allPeople[0]} was there`
  }
  return s + '.'
}

function generateRecentNarrative(
  entries: YearEntry[], 
  allPeople: string[],
  history: HistoricalContext
): string {
  // RECENT = What you're into RIGHT NOW, current momentum, this week's vibe
  // Different from On This Day which is historical reflection
  
  if (entries.length === 0) return ''
  
  const artistCounts: { [a: string]: number } = {}
  entries.forEach(e => { artistCounts[e.artist] = (artistCounts[e.artist] || 0) + 1 })
  
  const sorted = Object.entries(artistCounts).sort((a, b) => b[1] - a[1])
  const topArtist = sorted[0]
  const uniqueArtists = Object.keys(artistCounts)
  
  const genres = entries.map(e => e.genre).filter(g => g) as string[]
  const uniqueGenres = Array.from(new Set(genres))
  
  // Check for note highlights in recent entries
  const recentHighlights: string[] = []
  entries.slice(0, 3).forEach(e => {
    if (e.notes) {
      const h = extractNoteHighlights(e.notes)
      if (h.length > 0) recentHighlights.push(...h)
    }
  })
  
  // --- PATTERN 1: Same artist multiple times this week ---
  if (topArtist && topArtist[1] >= 2) {
    const relevantSongs = entries.filter(e => e.artist === topArtist[0]).slice(0, 2).map(e => `"${e.song}"`)
    let s = `This week has been a ${topArtist[0]} week. ${relevantSongs.join(' and ')} both got plays`
    
    const totalPlays = history.artistTotalPlays[topArtist[0]] || 0
    if (totalPlays >= 20) {
      s += `, and they're already one of your top artists all-time`
    } else if (totalPlays >= 10) {
      s += `, adding to your ${totalPlays} total plays of them`
    }
    
    // Add context from notes
    if (recentHighlights.length > 0) {
      s += `. Sounds like you've had "${recentHighlights[0]}" energy going on`
    }
    
    if (allPeople.length > 0) {
      s += `. ${allPeople[0]} has been in the picture`
    }
    
    return s + '.'
  }
  
  // --- PATTERN 2: Locked into one genre ---
  if (uniqueGenres.length === 1 && genres.length >= 3) {
    let s = `You're in a ${uniqueGenres[0]} pocket right now: ${entries.slice(0, 3).map(e => e.artist).join(', ')}`
    
    if (recentHighlights.length > 0) {
      s += `. Your notes mention "${recentHighlights[0]}" which might explain the mood`
    }
    
    if (allPeople.length > 0) {
      s += `. ${allPeople[0]} is somewhere in this week`
    }
    
    return s + '.'
  }
  
  // --- PATTERN 3: Variety mode ---
  if (uniqueArtists.length >= 4) {
    let s = `Your week has been scattered: ${uniqueArtists.slice(0, 4).join(', ')}`
    
    if (uniqueGenres.length >= 2) {
      s += `. Going from ${uniqueGenres[0]} to ${uniqueGenres[1]} and back`
    } else {
      s += `. Different artists but the vibe is consistent`
    }
    
    if (allPeople.length > 0) {
      s += `. ${allPeople[0]} was around for some of it`
    }
    
    return s + '.'
  }
  
  // --- PATTERN 4: Small sample, focus on most recent ---
  if (entries.length >= 2) {
    const newest = entries[0]
    const second = entries[1]
    
    let s = `"${newest.song}" by ${newest.artist} was your most recent`
    
    if (newest.artist === second.artist) {
      s += `, and before that you also played ${newest.artist}`
    } else if (newest.genre && second.genre && newest.genre === second.genre) {
      s += `. Before that was ${second.artist}, keeping the ${newest.genre} going`
    } else {
      s += `. ${second.artist} came before that`
    }
    
    if (allPeople.length > 0) {
      s += `. ${allPeople[0]} was part of this stretch`
    }
    
    return s + '.'
  }
  
  // --- FALLBACK: Single recent entry ---
  const e = entries[0]
  let s = `"${e.song}" by ${e.artist} is your latest`
  if (e.genre) {
    s += `. ${e.genre} mood right now`
  }
  if (allPeople.length > 0) {
    s += `. With ${allPeople[0]}`
  }
  return s + '.'
}

function generateJourneyNarrative(
  entryCount: number, 
  entries: YearEntry[],
  history: HistoricalContext
): string {
  if (entryCount === 0) {
    return "Your first song is waiting. Pick something that matters to you right now."
  }
  
  if (entryCount === 1 && entries.length >= 1) {
    const e = entries[0]
    return `It starts with "${e.song}" by ${e.artist}. Your first entry. The beginning of the log.`
  }
  
  if (entryCount <= 7 && entries.length >= 1) {
    const artists = Array.from(new Set(entries.map(e => e.artist)))
    const first = entries[entries.length - 1]
    
    if (artists.length === 1) {
      return `${entryCount} songs in and it's all ${artists[0]} so far. You know what you like.`
    }
    
    return `${entryCount} songs logged. Started with "${first.song}" by ${first.artist} and you've been building from there.`
  }
  
  if (entryCount <= 30 && entries.length >= 1) {
    const artists = Array.from(new Set(entries.map(e => e.artist)))
    const genres = Array.from(new Set(entries.map(e => e.genre).filter(g => g)))
    
    if (genres.length === 1 && genres[0]) {
      return `${entryCount} entries, mostly ${genres[0]}. Your taste is taking shape.`
    }
    
    return `${entryCount} entries so far across ${artists.length} different artists. You're building something.`
  }
  
  // 30+ entries
  const yearsActive = new Date().getFullYear() - history.userFirstEntryYear + 1
  if (yearsActive >= 2) {
    return `${entryCount} songs over ${yearsActive} years now. This is becoming a real archive of your life.`
  }
  
  return `${entryCount} entries and counting. Your musical log is growing.`
}

// ============================================================================
// MAIN ROUTE
// ============================================================================

export async function POST(request: Request) {
  try {
    const { userId: clerkUserId } = await auth()
    if (!clerkUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const prismaUserId = await getUserIdFromClerk(clerkUserId)
    if (!prismaUserId) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const { 
      artists, 
      songs, 
      date,
      people,
      years,
      notes,
      context,
      entryCount,
    } = await request.json()

    if (!artists || !Array.isArray(artists) || artists.length === 0) {
      return NextResponse.json({ error: 'No artists provided' }, { status: 400 })
    }

    const peopleList: string[] = people || []
    const yearsList: number[] = years || artists.map(() => new Date().getFullYear())
    const notesList: string[] = notes || []

    // Build entries with genres
    const { entries, genres } = await buildEntries(artists, songs, yearsList, peopleList, notesList)

    // Get historical context from full database
    const history = await getHistoricalContext(
      prismaUserId,
      artists,
      songs[0] || '',
      peopleList,
      genres
    )

    let insight: string

    // Handle journey context (new users)
    if (context === 'journey' && entryCount !== undefined) {
      insight = generateJourneyNarrative(entryCount, entries, history)
      if (insight) {
        return NextResponse.json({ insight })
      }
    }

    // Handle recent context
    if (context === 'recent') {
      insight = generateRecentNarrative(entries, peopleList, history)
      return NextResponse.json({ insight })
    }

    // Multi-year (On This Day) or single day
    const uniqueYears = Array.from(new Set(yearsList))
    if (uniqueYears.length > 1) {
      insight = generateMultiYearNarrative(entries, peopleList, history)
    } else {
      insight = generateSingleDayNarrative(entries, peopleList, history)
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
