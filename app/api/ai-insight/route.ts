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
  totalEntries: number
  userFirstEntryYear: number
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
  if (g.includes('latin') || g.includes('reggaeton')) return 'latin'
  return genre.split(' ')[0]
}

function extractNoteKeywords(notes: string): string[] {
  if (!notes) return []
  const lower = notes.toLowerCase()
  const keywords: string[] = []
  
  const terms = [
    'birthday', 'wedding', 'graduation', 'christmas', 'new year', 'thanksgiving',
    'super bowl', 'concert', 'festival', 'vacation', 'road trip', 'first date',
    'breakup', 'anniversary', 'party', 'exam', 'midterm', 'final', 'interview',
    'happy', 'sad', 'stressed', 'anxious', 'excited', 'tired', 'sick', 'hungover',
    'miserable', 'amazing', 'perfect', 'terrible', 'rough', 'great', 'awful'
  ]
  
  terms.forEach(t => { if (lower.includes(t)) keywords.push(t) })
  return keywords.slice(0, 2)
}

// ============================================================================
// DATA FETCHING
// ============================================================================

async function getHistoricalContext(
  userId: string,
  currentArtists: string[],
  currentSong: string
): Promise<HistoricalContext> {
  const supabase = getSupabase()
  
  const { data: allEntries } = await supabase
    .from('entries')
    .select('artist, songTitle, date')
    .eq('userId', userId)
    .order('date', { ascending: false })
    .limit(2000)
  
  const entries = allEntries || []
  
  const artistTotalPlays: { [artist: string]: number } = {}
  entries.forEach((e: any) => {
    artistTotalPlays[e.artist] = (artistTotalPlays[e.artist] || 0) + 1
  })
  
  const previousOccurrence = entries.find((e: any) => 
    e.songTitle === currentSong && e.artist === currentArtists[0]
  )
  
  const oldestEntry = entries[entries.length - 1]
  const userFirstEntryYear = oldestEntry 
    ? new Date(oldestEntry.date).getFullYear() 
    : new Date().getFullYear()
  
  return {
    artistTotalPlays,
    songAppearedBefore: !!previousOccurrence,
    previousSongDate: previousOccurrence?.date,
    totalEntries: entries.length,
    userFirstEntryYear,
  }
}

async function buildEntries(
  artists: string[],
  songs: string[],
  years: number[],
  people: string[],
  notes: string[]
): Promise<{ entries: YearEntry[], genres: string[] }> {
  const entries: YearEntry[] = []
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
      } catch (err) { /* continue */ }
    }
  } catch (err) { /* continue */ }
  
  for (let i = 0; i < artists.length; i++) {
    entries.push({
      year: years[i] || new Date().getFullYear(),
      song: songs[i] || '',
      artist: artists[i] || '',
      genre: artistGenreMap[artists[i]] || undefined,
      notes: notes[i] || undefined,
      people: [],
    })
  }
  
  entries.sort((a, b) => b.year - a.year)
  
  return { entries, genres: Object.values(artistGenreMap) }
}

// ============================================================================
// MULTI-YEAR STRUCTURAL TEMPLATES - Each one is COMPLETELY different
// ============================================================================

type MultiYearTemplate = (
  entries: YearEntry[],
  people: string[],
  history: HistoricalContext
) => string | null

const multiYearTemplates: MultiYearTemplate[] = [
  
  // STRUCTURE 1: Lead with the outlier year
  (entries, people, history) => {
    const genres = entries.map(e => e.genre).filter(g => g) as string[]
    const genreCounts: {[g:string]: number} = {}
    genres.forEach(g => { genreCounts[g] = (genreCounts[g] || 0) + 1 })
    const sorted = Object.entries(genreCounts).sort((a,b) => b[1] - a[1])
    
    if (sorted.length < 2) return null
    
    const dominant = sorted[0][0]
    const outlier = entries.find(e => e.genre && e.genre !== dominant)
    if (!outlier) return null
    
    const dominantEntries = entries.filter(e => e.genre === dominant)
    
    let s = `${outlier.year} was the odd one out. While ${dominantEntries.map(e => e.year).join(', ')} all went ${dominant}, you picked ${outlier.artist}'s "${outlier.song}" that year`
    if (outlier.genre) s += `, pure ${outlier.genre}`
    s += '.'
    
    if (outlier.notes) {
      const kw = extractNoteKeywords(outlier.notes)
      if (kw.length > 0) s += ` Your notes say "${kw[0]}" so maybe that explains it.`
    }
    
    if (people.length > 0) s += ` ${people[0]} was around that year.`
    
    return s
  },

  // STRUCTURE 2: Lead with a person
  (entries, people, history) => {
    if (people.length === 0) return null
    
    const person = people[0]
    const newest = entries[0]
    
    let s = `${person} shows up in these memories.`
    s += ` This year it was "${newest.song}" by ${newest.artist}`
    
    if (entries.length > 1) {
      const others = entries.slice(1).map(e => `${e.artist} in ${e.year}`).join(', ')
      s += `, before that you had ${others}`
    }
    s += '.'
    
    const totalPlays = history.artistTotalPlays[newest.artist] || 0
    if (totalPlays >= 10) s += ` ${newest.artist} is one of your regulars with ${totalPlays} total plays.`
    
    return s
  },

  // STRUCTURE 3: Lead with repeated song
  (entries, people, history) => {
    if (!history.songAppearedBefore || !history.previousSongDate) return null
    
    const newest = entries[0]
    const prevDate = new Date(history.previousSongDate)
    const monthName = prevDate.toLocaleString('default', { month: 'long' })
    
    let s = `You've played "${newest.song}" before. Back in ${monthName} ${prevDate.getFullYear()}, same track.`
    s += ` ${newest.artist} clearly has staying power for you`
    
    const totalPlays = history.artistTotalPlays[newest.artist] || 0
    if (totalPlays >= 5) s += `, ${totalPlays} plays total`
    s += '.'
    
    if (entries.length > 1) {
      s += ` The other years on this date went different: ${entries.slice(1).map(e => `${e.artist} (${e.year})`).join(', ')}.`
    }
    
    return s
  },

  // STRUCTURE 4: Lead with artist loyalty
  (entries, people, history) => {
    const artistCounts: {[a:string]: YearEntry[]} = {}
    entries.forEach(e => {
      if (!artistCounts[e.artist]) artistCounts[e.artist] = []
      artistCounts[e.artist].push(e)
    })
    
    const repeater = Object.entries(artistCounts).find(([_, ents]) => ents.length >= 2)
    if (!repeater) return null
    
    const [artist, artistEntries] = repeater
    const years = artistEntries.map(e => e.year).sort((a,b) => b - a)
    const songs = artistEntries.map(e => `"${e.song}"`)
    
    let s = `${artist} owns this date. ${years.join(' and ')} both went to them`
    s += `, with ${songs.join(' and ')}`
    
    const totalPlays = history.artistTotalPlays[artist] || 0
    if (totalPlays >= 15) s += `. They're in your top artists overall with ${totalPlays} plays`
    s += '.'
    
    const others = entries.filter(e => e.artist !== artist)
    if (others.length > 0) {
      s += ` ${others.map(e => `${e.year} was ${e.artist}`).join(', ')}.`
    }
    
    if (people.length > 0) s += ` ${people[0]} was there for at least one.`
    
    return s
  },

  // STRUCTURE 5: Lead with notes/life event
  (entries, people, history) => {
    for (const e of entries) {
      if (e.notes) {
        const kw = extractNoteKeywords(e.notes)
        if (kw.length > 0) {
          let s = `${e.year} had "${kw[0]}" energy based on your notes. The song was "${e.song}" by ${e.artist}.`
          
          const others = entries.filter(x => x.year !== e.year)
          if (others.length > 0) {
            s += ` Other years: ${others.map(x => `${x.artist} in ${x.year}`).join(', ')}.`
          }
          
          if (e.genre) {
            const sameGenre = entries.filter(x => x.genre === e.genre && x.year !== e.year)
            if (sameGenre.length > 0) {
              s += ` The ${e.genre} theme also showed up in ${sameGenre.map(x => x.year).join(', ')}.`
            }
          }
          
          if (people.length > 0) s += ` ${people[0]} is tagged somewhere in here.`
          
          return s
        }
      }
    }
    return null
  },

  // STRUCTURE 6: Chronological journey (oldest to newest)
  (entries, people, history) => {
    if (entries.length < 3) return null
    
    const sorted = [...entries].sort((a,b) => a.year - b.year) // oldest first
    const oldest = sorted[0]
    const newest = sorted[sorted.length - 1]
    
    let s = `It started in ${oldest.year} with ${oldest.artist}'s "${oldest.song}".`
    
    const middle = sorted.slice(1, -1)
    if (middle.length === 1) {
      s += ` Then ${middle[0].year} brought ${middle[0].artist}.`
    } else if (middle.length > 1) {
      s += ` ${middle.map(e => `${e.year} was ${e.artist}`).join(', ')}.`
    }
    
    s += ` Now in ${newest.year}, it's "${newest.song}" by ${newest.artist}.`
    
    if (oldest.genre && newest.genre) {
      if (oldest.genre === newest.genre) {
        s += ` Still ${oldest.genre} after all these years.`
      } else {
        s += ` Went from ${oldest.genre} to ${newest.genre}.`
      }
    }
    
    return s
  },

  // STRUCTURE 7: Genre consistency focus
  (entries, people, history) => {
    const genres = entries.map(e => e.genre).filter(g => g) as string[]
    const uniqueGenres = Array.from(new Set(genres))
    
    if (uniqueGenres.length !== 1 || genres.length < 3) return null
    
    const genre = uniqueGenres[0]
    const artists = entries.map(e => e.artist)
    
    let s = `${genre} every single year. ${entries.map(e => `${e.year}: ${e.artist}`).join('. ')}.`
    s += ` You know what you like on this date.`
    
    const topArtist = artists.sort((a,b) => 
      (history.artistTotalPlays[b] || 0) - (history.artistTotalPlays[a] || 0)
    )[0]
    const plays = history.artistTotalPlays[topArtist] || 0
    if (plays >= 10) s += ` ${topArtist} leads with ${plays} total plays.`
    
    if (people.length > 0) s += ` ${people[0]} shares some of these.`
    
    return s
  },

  // STRUCTURE 8: Short and punchy (no fluff)
  (entries, people, history) => {
    if (entries.length < 2) return null
    
    const newest = entries[0]
    const parts = entries.map(e => `${e.year}: ${e.artist}`)
    
    let s = parts.join('. ') + '.'
    
    if (people.length > 0) s += ` ${people[0]} involved.`
    
    const totalPlays = history.artistTotalPlays[newest.artist] || 0
    if (totalPlays >= 15) s += ` ${newest.artist} at ${totalPlays} total.`
    
    return s
  },

  // STRUCTURE 9: Question format
  (entries, people, history) => {
    const newest = entries[0]
    const genres = entries.map(e => e.genre).filter(g => g) as string[]
    const uniqueGenres = Array.from(new Set(genres))
    
    let s = `Why ${newest.artist} this year?`
    
    if (uniqueGenres.length === 1 && genres.length >= 2) {
      s += ` Maybe because ${uniqueGenres[0]} has been your go-to on this date.`
      s += ` ${entries.slice(1).map(e => `${e.year} was also ${e.genre} with ${e.artist}`).join(', ')}.`
    } else if (entries.length > 1) {
      s += ` Before this it was ${entries.slice(1).map(e => `${e.artist} in ${e.year}`).join(', ')}.`
    }
    
    if (people.length > 0) s += ` ${people[0]} might know.`
    
    return s
  },

  // STRUCTURE 10: Two-year comparison
  (entries, people, history) => {
    if (entries.length !== 2) return null
    
    const [newer, older] = entries
    
    let s = `${newer.year} vs ${older.year}. `
    s += `"${newer.song}" by ${newer.artist} this time, "${older.song}" by ${older.artist} before.`
    
    if (newer.genre && older.genre) {
      if (newer.genre === older.genre) {
        s += ` Both ${newer.genre}.`
      } else {
        s += ` ${newer.genre} now, ${older.genre} then.`
      }
    }
    
    if (people.length > 0) s += ` ${people[0]} was part of one of these.`
    
    const newerPlays = history.artistTotalPlays[newer.artist] || 0
    const olderPlays = history.artistTotalPlays[older.artist] || 0
    if (newerPlays > olderPlays && newerPlays >= 10) {
      s += ` ${newer.artist} has become more of a regular since then.`
    }
    
    return s
  },
]

// ============================================================================
// RECENT TEMPLATES - Different structures for "this week" insights
// ============================================================================

type RecentTemplate = (
  entries: YearEntry[],
  people: string[],
  history: HistoricalContext
) => string | null

const recentTemplates: RecentTemplate[] = [
  
  // STRUCTURE 1: Artist phase
  (entries, people, history) => {
    const artistCounts: {[a:string]: number} = {}
    entries.forEach(e => { artistCounts[e.artist] = (artistCounts[e.artist] || 0) + 1 })
    const top = Object.entries(artistCounts).sort((a,b) => b[1] - a[1])[0]
    
    if (!top || top[1] < 2) return null
    
    const songs = entries.filter(e => e.artist === top[0]).slice(0,2).map(e => `"${e.song}"`)
    let s = `${top[0]} mode this week. ${songs.join(' and ')} both got plays`
    
    const total = history.artistTotalPlays[top[0]] || 0
    if (total >= 20) s += `, and they're already at ${total} total in your log`
    s += '.'
    
    if (people.length > 0) s += ` ${people[0]} is in the mix.`
    
    return s
  },

  // STRUCTURE 2: Genre lock
  (entries, people, history) => {
    const genres = entries.map(e => e.genre).filter(g => g) as string[]
    const unique = Array.from(new Set(genres))
    
    if (unique.length !== 1 || genres.length < 3) return null
    
    let s = `Locked into ${unique[0]} right now: ${entries.slice(0,3).map(e => e.artist).join(', ')}.`
    
    for (const e of entries.slice(0,3)) {
      if (e.notes) {
        const kw = extractNoteKeywords(e.notes)
        if (kw.length > 0) {
          s += ` Notes mention "${kw[0]}".`
          break
        }
      }
    }
    
    if (people.length > 0) s += ` ${people[0]} somewhere in there.`
    
    return s
  },

  // STRUCTURE 3: Scatter mode
  (entries, people, history) => {
    const unique = Array.from(new Set(entries.map(e => e.artist)))
    if (unique.length < 4) return null
    
    let s = `All over the place this week: ${unique.slice(0,4).join(', ')}.`
    
    const genres = entries.map(e => e.genre).filter(g => g) as string[]
    const uniqueG = Array.from(new Set(genres))
    if (uniqueG.length >= 2) {
      s += ` ${uniqueG[0]} to ${uniqueG[1]} and back.`
    }
    
    if (people.length > 0) s += ` ${people[0]} caught some of it.`
    
    return s
  },

  // STRUCTURE 4: Most recent focus
  (entries, people, history) => {
    if (entries.length < 1) return null
    
    const e = entries[0]
    let s = `Latest: "${e.song}" by ${e.artist}`
    
    const total = history.artistTotalPlays[e.artist] || 0
    if (total >= 15) s += `, your ${total}th play of them`
    
    if (e.genre) s += `. ${e.genre} mood`
    s += '.'
    
    if (entries.length > 1) {
      s += ` Before that: ${entries.slice(1,3).map(x => x.artist).join(', ')}.`
    }
    
    if (people.length > 0) s += ` ${people[0]} around.`
    
    return s
  },

  // STRUCTURE 5: Notes-led
  (entries, people, history) => {
    for (const e of entries.slice(0,3)) {
      if (e.notes) {
        const kw = extractNoteKeywords(e.notes)
        if (kw.length > 0) {
          let s = `"${kw[0]}" vibes this week.`
          s += ` "${e.song}" by ${e.artist} fit the mood.`
          
          const others = entries.filter(x => x !== e).slice(0,2)
          if (others.length > 0) {
            s += ` Also played ${others.map(x => x.artist).join(', ')}.`
          }
          
          return s
        }
      }
    }
    return null
  },
]

// ============================================================================
// SINGLE DAY / JOURNEY TEMPLATES
// ============================================================================

function generateSingleDayNarrative(
  entries: YearEntry[], 
  people: string[],
  history: HistoricalContext
): string {
  if (entries.length === 0) return ''
  
  if (entries.length === 1) {
    const e = entries[0]
    const total = history.artistTotalPlays[e.artist] || 0
    
    // Randomly pick a structure
    const structures = [
      () => {
        let s = `"${e.song}" by ${e.artist}`
        if (total >= 20) s += `, one of your most played`
        if (e.genre) s += `. ${e.genre}`
        if (people.length > 0) s += `. With ${people[0]}`
        return s + '.'
      },
      () => {
        let s = `${e.artist} got the pick today with "${e.song}"`
        if (total >= 10) s += `. Play #${total} for them`
        if (people.length > 0) s += `. ${people[0]} there`
        return s + '.'
      },
      () => {
        if (e.notes) {
          const kw = extractNoteKeywords(e.notes)
          if (kw.length > 0) {
            return `"${kw[0]}" day. "${e.song}" by ${e.artist} was the soundtrack.${people.length > 0 ? ` ${people[0]} involved.` : ''}`
          }
        }
        return `"${e.song}" by ${e.artist}.${e.genre ? ` ${e.genre}.` : ''}${people.length > 0 ? ` ${people[0]}.` : ''}`
      },
    ]
    
    return randomChoice(structures)()
  }
  
  // Multiple songs same day - simplified
  const artists = entries.map(e => e.artist)
  const unique = Array.from(new Set(artists))
  
  if (unique.length === 1) {
    return `${unique[0]} on repeat today. ${entries.map(e => `"${e.song}"`).join(', ')}.${people.length > 0 ? ` ${people[0]} there.` : ''}`
  }
  
  return `${unique.join(', ')} today.${people.length > 0 ? ` With ${people[0]}.` : ''}`
}

function generateJourneyNarrative(
  entryCount: number, 
  entries: YearEntry[],
  history: HistoricalContext
): string {
  if (entryCount === 0) {
    return randomChoice([
      "First song is waiting. Pick something that matters.",
      "Your log is empty. What's playing right now?",
      "No entries yet. Start with whatever you're feeling today.",
    ])
  }
  
  if (entryCount === 1 && entries.length >= 1) {
    const e = entries[0]
    return randomChoice([
      `Started with "${e.song}" by ${e.artist}. Entry #1.`,
      `First entry: ${e.artist}. "${e.song}". The log begins.`,
      `"${e.song}" by ${e.artist} kicks it off.`,
    ])
  }
  
  if (entryCount <= 7) {
    const artists = Array.from(new Set(entries.map(e => e.artist)))
    if (artists.length === 1) {
      return `${entryCount} songs, all ${artists[0]}. Committed.`
    }
    return `${entryCount} entries. ${artists.slice(0,3).join(', ')}. Building.`
  }
  
  if (entryCount <= 30) {
    const artists = Array.from(new Set(entries.map(e => e.artist)))
    return `${entryCount} songs logged across ${artists.length} artists. Keep going.`
  }
  
  return `${entryCount} entries now. This is becoming a real archive.`
}

// ============================================================================
// MAIN GENERATOR - Shuffles through templates
// ============================================================================

function generateMultiYearNarrative(
  entries: YearEntry[], 
  people: string[],
  history: HistoricalContext
): string {
  if (entries.length === 0) return ''
  if (entries.length === 1) return generateSingleDayNarrative(entries, people, history)
  
  // Shuffle templates and try each until one works
  const shuffled = [...multiYearTemplates].sort(() => Math.random() - 0.5)
  
  for (const template of shuffled) {
    const result = template(entries, people, history)
    if (result) return result
  }
  
  // Fallback
  const newest = entries[0]
  return `"${newest.song}" by ${newest.artist} this year. ${entries.slice(1).map(e => `${e.year}: ${e.artist}`).join(', ')} before.`
}

function generateRecentNarrative(
  entries: YearEntry[], 
  people: string[],
  history: HistoricalContext
): string {
  if (entries.length === 0) return ''
  
  // Shuffle templates and try each until one works
  const shuffled = [...recentTemplates].sort(() => Math.random() - 0.5)
  
  for (const template of shuffled) {
    const result = template(entries, people, history)
    if (result) return result
  }
  
  // Fallback
  const e = entries[0]
  return `"${e.song}" by ${e.artist} recently.${people.length > 0 ? ` ${people[0]} around.` : ''}`
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

    const { entries } = await buildEntries(artists, songs, yearsList, peopleList, notesList)
    
    // Add notes back to entries
    for (let i = 0; i < entries.length && i < notesList.length; i++) {
      // Notes were passed in same order as artists, need to match by index in original arrays
      const originalIndex = artists.indexOf(entries.find((e, idx) => {
        const origIdx = artists.findIndex((a, j) => a === e.artist && songs[j] === e.song && yearsList[j] === e.year)
        return origIdx >= 0
      })?.artist || '')
      if (originalIndex >= 0 && notesList[originalIndex]) {
        entries[i].notes = notesList[originalIndex]
      }
    }

    const history = await getHistoricalContext(prismaUserId, artists, songs[0] || '')

    let insight: string

    if (context === 'journey' && entryCount !== undefined) {
      insight = generateJourneyNarrative(entryCount, entries, history)
      return NextResponse.json({ insight })
    }

    if (context === 'recent') {
      insight = generateRecentNarrative(entries, peopleList, history)
      return NextResponse.json({ insight })
    }

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
