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
// EXPANDED THEME DETECTION LIBRARY
// ============================================================================

const themeKeywords: { [key: string]: string[] } = {
  // Emotional themes
  love: ['love', 'heart', 'kiss', 'romance', 'darling', 'baby', 'sweet', 'lover', 'beloved', 'adore', 'desire', 'passion', 'devotion', 'soulmate', 'forever', 'together'],
  heartbreak: ['cry', 'tears', 'sad', 'lonely', 'hurt', 'pain', 'broken', 'goodbye', 'miss', 'lost', 'gone', 'leave', 'left', 'apart', 'over', 'end', 'regret', 'sorry'],
  joy: ['happy', 'joy', 'smile', 'laugh', 'fun', 'celebrate', 'alive', 'free', 'wonderful', 'amazing', 'perfect', 'beautiful', 'blessed', 'grateful', 'sunshine'],
  anger: ['hate', 'angry', 'mad', 'fight', 'rage', 'fire', 'burn', 'destroy', 'war', 'enemy', 'revenge', 'bitter'],
  longing: ['wish', 'dream', 'hope', 'wait', 'someday', 'maybe', 'wondering', 'searching', 'looking', 'find', 'need', 'want'],
  reflection: ['think', 'wonder', 'remember', 'memory', 'past', 'time', 'yesterday', 'years', 'ago', 'looking back', 'used to', 'once'],
  
  // Energy/mood themes
  energetic: ['fire', 'energy', 'power', 'strong', 'wild', 'intense', 'electric', 'thunder', 'lightning', 'explode', 'rush', 'adrenaline'],
  chill: ['calm', 'peace', 'quiet', 'soft', 'gentle', 'smooth', 'easy', 'relax', 'slow', 'mellow', 'cool', 'breeze', 'drift'],
  party: ['party', 'dance', 'club', 'night', 'celebration', 'friday', 'saturday', 'weekend', 'drink', 'cheers', 'toast', 'vibe'],
  melancholy: ['rain', 'grey', 'blue', 'shadow', 'dark', 'cold', 'winter', 'alone', 'empty', 'hollow', 'fading'],
  
  // Life themes
  growth: ['rise', 'grow', 'change', 'new', 'begin', 'start', 'born', 'rebirth', 'transform', 'evolve', 'become', 'learn'],
  freedom: ['free', 'fly', 'escape', 'run', 'away', 'road', 'travel', 'journey', 'adventure', 'wild', 'open', 'horizon'],
  home: ['home', 'house', 'place', 'belong', 'family', 'safe', 'comfort', 'warm', 'return', 'back', 'roots', 'where'],
  youth: ['young', 'kid', 'child', 'teenage', 'school', 'summer', 'innocent', 'first', 'forever young', 'memories'],
  
  // Nature/setting themes
  night: ['night', 'moon', 'stars', 'midnight', 'dark', 'twilight', 'evening', 'late', 'dreams', 'sleep'],
  morning: ['morning', 'dawn', 'sunrise', 'wake', 'coffee', 'new day', 'early', 'fresh', 'bright'],
  summer: ['summer', 'sun', 'beach', 'heat', 'hot', 'vacation', 'july', 'august', 'pool', 'tan'],
  rain: ['rain', 'storm', 'thunder', 'umbrella', 'wet', 'pour', 'drops', 'clouds', 'grey'],
  
  // Activity themes
  driving: ['drive', 'road', 'car', 'highway', 'cruise', 'ride', 'wheels', 'fast', 'speed', 'miles'],
  dancing: ['dance', 'move', 'groove', 'step', 'rhythm', 'beat', 'sway', 'spin', 'floor'],
  dreaming: ['dream', 'sleep', 'fantasy', 'imagine', 'wish', 'clouds', 'float', 'wonder'],
  
  // Relationship themes
  friendship: ['friend', 'together', 'us', 'we', 'crew', 'squad', 'homies', 'brothers', 'sisters', 'ride or die'],
  devotion: ['always', 'forever', 'never', 'promise', 'vow', 'loyal', 'faithful', 'til', 'death'],
  seduction: ['body', 'touch', 'feel', 'skin', 'close', 'whisper', 'secret', 'tension', 'attraction'],
}

// Decade-specific vocabulary for release date analysis
const decadeVibes: { [key: string]: { adjectives: string[], descriptors: string[] } } = {
  '1960s': { adjectives: ['classic', 'timeless', 'foundational', 'revolutionary'], descriptors: ['golden era', 'the roots', 'where it all began'] },
  '1970s': { adjectives: ['groovy', 'funky', 'soulful', 'psychedelic'], descriptors: ['disco era', 'rock revolution', 'analog warmth'] },
  '1980s': { adjectives: ['synth-driven', 'neon', 'iconic', 'new wave'], descriptors: ['synthesizer dreams', '80s magic', 'retro-futurism'] },
  '1990s': { adjectives: ['raw', 'authentic', 'grunge-era', 'alternative'], descriptors: ['90s nostalgia', 'golden age', 'peak era'] },
  '2000s': { adjectives: ['millennial', 'Y2K', 'digital-age', 'transformative'], descriptors: ['early internet era', 'the 2000s wave', 'throwback'] },
  '2010s': { adjectives: ['streaming-era', 'genre-blending', 'viral', 'modern'], descriptors: ['the 2010s renaissance', 'recent classics', 'modern staples'] },
  '2020s': { adjectives: ['fresh', 'cutting-edge', 'contemporary', 'zeitgeist'], descriptors: ['right now', 'the moment', 'current wave'] },
}

// Popularity descriptors
const popularityDescriptors = {
  underground: ['deep cut', 'hidden gem', 'underground treasure', 'obscure find', 'cult favorite', 'well-kept secret'],
  indie: ['indie favorite', 'alternative pick', 'under-the-radar', 'critics\' choice', 'tastemaker selection'],
  midrange: ['solid choice', 'quality pick', 'fan favorite', 'respected track', 'proven favorite'],
  mainstream: ['chart-topper', 'crowd-pleaser', 'radio hit', 'mainstream favorite', 'certified banger'],
  mega: ['mega hit', 'cultural phenomenon', 'legendary track', 'iconic anthem', 'undeniable classic'],
}

// Season type and phrases
type Season = 'winter' | 'spring' | 'summer' | 'fall'

const seasonalPhrases: Record<Season, string[]> = {
  winter: ['winter wonderland vibes', 'cold weather comfort', 'cozy season soundtrack', 'hibernation mode', 'frost-kissed melodies'],
  spring: ['spring renewal energy', 'fresh beginnings', 'bloom season beats', 'thawing out', 'rebirth vibes'],
  summer: ['summer heat soundtrack', 'sun-soaked sounds', 'endless summer vibes', 'beach day beats', 'hot weather anthems'],
  fall: ['autumn ambiance', 'cozy fall vibes', 'harvest season sounds', 'golden hour melodies', 'sweater weather tunes'],
}

// Opening hooks - personalized variations
const openingHooks = [
  (topArtist: string, topSong: string) => `Let's decode this ${topArtist} moment.`,
  (topArtist: string, topSong: string) => `"${topSong}" set the tone.`,
  (topArtist: string, topSong: string) => `The music chose you today, and it sounds like ${topArtist}.`,
  (topArtist: string, topSong: string) => `If "${topSong}" were a movie scene...`,
  (topArtist: string, topSong: string) => `Starting with ${topArtist}?`,
  (topArtist: string, topSong: string) => `"${topSong}" says a lot.`,
  (topArtist: string, topSong: string) => `${topArtist} was calling your name.`,
  (topArtist: string, topSong: string) => `You reached for "${topSong}" today.`,
  (topArtist: string, topSong: string) => `${topArtist} energy detected.`,
  (topArtist: string, topSong: string) => `Let's talk about "${topSong}."`,
]

// Closing phrases - varied and personal
const closingPhrases = [
  (topArtist: string) => `That's the vibe, preserved in time.`,
  (topArtist: string) => `Future you will thank present you for logging this.`,
  (topArtist: string) => `Another chapter in your sonic autobiography.`,
  (topArtist: string) => `This is what it sounded like to be you.`,
  (topArtist: string) => `${topArtist} approved.`,
  (topArtist: string) => `Logged and remembered.`,
  (topArtist: string) => `The soundtrack to this moment.`,
  (topArtist: string) => `Your taste speaks for itself.`,
  (topArtist: string) => `Music and memory, intertwined.`,
  (topArtist: string) => `A snapshot of your ears.`,
  (topArtist: string) => `The playlist tells the story.`,
  (topArtist: string) => `Sealed in the archive.`,
]

// ============================================================================
// ANALYSIS HELPER FUNCTIONS
// ============================================================================

function getDecade(releaseDate: string): string {
  if (!releaseDate) return 'unknown'
  const year = parseInt(releaseDate.substring(0, 4))
  if (year < 1960) return '1950s'
  if (year < 1970) return '1960s'
  if (year < 1980) return '1970s'
  if (year < 1990) return '1980s'
  if (year < 2000) return '1990s'
  if (year < 2010) return '2000s'
  if (year < 2020) return '2010s'
  return '2020s'
}

function getSeason(date: string): Season {
  const month = parseInt(date.substring(5, 7))
  if (month >= 3 && month <= 5) return 'spring'
  if (month >= 6 && month <= 8) return 'summer'
  if (month >= 9 && month <= 11) return 'fall'
  return 'winter'
}

function getPopularityTier(popularity: number): string {
  if (popularity < 20) return 'underground'
  if (popularity < 40) return 'indie'
  if (popularity < 60) return 'midrange'
  if (popularity < 80) return 'mainstream'
  return 'mega'
}

function getDurationTier(durationMs: number): string {
  const minutes = durationMs / 60000
  if (minutes < 2.5) return 'short'
  if (minutes < 4.5) return 'standard'
  if (minutes < 7) return 'long'
  return 'epic'
}

function detectThemes(text: string): string[] {
  const lowercaseText = text.toLowerCase()
  const detected: string[] = []
  
  for (const [theme, keywords] of Object.entries(themeKeywords)) {
    if (keywords.some(keyword => lowercaseText.includes(keyword))) {
      detected.push(theme)
    }
  }
  
  return detected
}

function analyzeNotesSentiment(notes: string[]): { tone: string; keywords: string[] } {
  const allNotes = notes.filter(n => n).join(' ').toLowerCase()
  
  const positiveWords = ['amazing', 'love', 'best', 'great', 'perfect', 'incredible', 'wonderful', 'beautiful', 'happy', 'excited', 'grateful', 'blessed']
  const negativeWords = ['sad', 'miss', 'hard', 'difficult', 'tough', 'struggling', 'lost', 'lonely', 'anxious', 'stressed', 'worried']
  const nostalgicWords = ['remember', 'reminded', 'throwback', 'memories', 'nostalgia', 'used to', 'back when', 'childhood', 'high school', 'college']
  const socialWords = ['friends', 'family', 'with', 'together', 'party', 'hangout', 'road trip', 'vacation', 'wedding', 'birthday']
  
  let positive = 0, negative = 0, nostalgic = 0, social = 0
  const foundKeywords: string[] = []
  
  positiveWords.forEach(w => { if (allNotes.includes(w)) { positive++; foundKeywords.push(w) } })
  negativeWords.forEach(w => { if (allNotes.includes(w)) { negative++; foundKeywords.push(w) } })
  nostalgicWords.forEach(w => { if (allNotes.includes(w)) { nostalgic++; foundKeywords.push(w) } })
  socialWords.forEach(w => { if (allNotes.includes(w)) { social++; foundKeywords.push(w) } })
  
  let tone = 'neutral'
  if (nostalgic > 1) tone = 'nostalgic'
  else if (social > 1) tone = 'social'
  else if (positive > negative + 1) tone = 'positive'
  else if (negative > positive + 1) tone = 'reflective'
  
  return { tone, keywords: foundKeywords.slice(0, 5) }
}

function randomChoice<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

// ============================================================================
// INSIGHT DATA STRUCTURE
// ============================================================================

interface InsightData {
  // Artist data
  uniqueArtists: string[]
  topArtist: string
  artistCounts: { [key: string]: number }
  artistGenres: { [key: string]: string[] }
  topGenres: string[]
  
  // Song data
  songs: string[]
  topSong: string
  trackCount: number
  detectedThemes: string[]
  
  // Metadata analysis
  avgPopularity: number
  popularityTier: string
  avgDuration: number
  durationTier: string
  hasExplicit: boolean
  decadeBreakdown: { [key: string]: number }
  dominantDecade: string
  
  // Context
  season: Season
  yearsSpan: number
  yearsList: number[]
  
  // Notes analysis
  notesTone: string
  notesKeywords: string[]
  
  // People
  peopleTagged: string[]
}

function buildInsightData(
  artists: string[],
  songs: string[],
  date: string,
  artistGenres: { [key: string]: string[] },
  genreAnalysis: { [key: string]: number },
  entryMetadata?: {
    popularity?: number[]
    duration?: number[]
    explicit?: boolean[]
    releaseDate?: string[]
    notes?: string[]
    people?: string[]
    years?: number[]
  }
): InsightData {
  // Artist analysis
  const artistCounts: { [key: string]: number } = {}
  artists.forEach((artist: string) => {
    artistCounts[artist] = (artistCounts[artist] || 0) + 1
  })
  const uniqueArtists = Array.from(new Set(artists))
  const topArtist = Object.entries(artistCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || ''
  
  // Genre analysis
  const topGenres = Object.entries(genreAnalysis)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([genre]) => genre)
  
  // Theme detection
  const allText = [...songs, ...artists].join(' ')
  const detectedThemes = detectThemes(allText)
  
  // Metadata analysis
  const popularity = entryMetadata?.popularity || []
  const avgPopularity = popularity.length > 0 
    ? popularity.reduce((a, b) => a + b, 0) / popularity.length 
    : 50
  
  const duration = entryMetadata?.duration || []
  const avgDuration = duration.length > 0 
    ? duration.reduce((a, b) => a + b, 0) / duration.length 
    : 210000
  
  const explicit = entryMetadata?.explicit || []
  const hasExplicit = explicit.some(e => e)
  
  // Decade analysis
  const releaseDates = entryMetadata?.releaseDate || []
  const decadeBreakdown: { [key: string]: number } = {}
  releaseDates.forEach(rd => {
    if (rd) {
      const decade = getDecade(rd)
      decadeBreakdown[decade] = (decadeBreakdown[decade] || 0) + 1
    }
  })
  const dominantDecade = Object.entries(decadeBreakdown)
    .sort((a, b) => b[1] - a[1])[0]?.[0] || '2020s'
  
  // Notes analysis
  const notes = entryMetadata?.notes || []
  const { tone: notesTone, keywords: notesKeywords } = analyzeNotesSentiment(notes)
  
  // Years span for "On This Day"
  const years = entryMetadata?.years || []
  const yearsSpan = years.length > 0 ? Math.max(...years) - Math.min(...years) + 1 : 1
  
  return {
    uniqueArtists,
    topArtist,
    artistCounts,
    artistGenres,
    topGenres,
    songs,
    topSong: songs[0] || '',
    trackCount: artists.length,
    detectedThemes,
    avgPopularity,
    popularityTier: getPopularityTier(avgPopularity),
    avgDuration,
    durationTier: getDurationTier(avgDuration),
    hasExplicit,
    decadeBreakdown,
    dominantDecade,
    season: getSeason(date),
    yearsSpan,
    yearsList: Array.from(new Set(years)).sort(),
    notesTone,
    notesKeywords,
    peopleTagged: entryMetadata?.people || [],
  }
}

// ============================================================================
// 15 PERSONALIZED TEMPLATE FUNCTIONS
// ============================================================================

const insightTemplates = [
  // 1. Song-focused with artist context
  (data: InsightData) => {
    const hook = randomChoice(openingHooks)(data.topArtist, data.topSong)
    let body = ''
    
    if (data.trackCount === 1) {
      body = `"${data.topSong}" by ${data.topArtist} was your pick.`
      if (data.topGenres.length > 0) {
        body += ` That ${data.topGenres[0]} sound hit different today.`
      }
    } else if (data.uniqueArtists.length === 1) {
      body = `You gave ${data.topArtist} ${data.trackCount} plays today. Songs like "${data.songs[0]}"${data.songs.length > 1 ? ` and "${data.songs[1]}"` : ''} defined the mood.`
    } else {
      body = `"${data.topSong}" led the way, with ${data.uniqueArtists.length - 1} other artist${data.uniqueArtists.length > 2 ? 's' : ''} joining in.`
    }
    
    if (data.peopleTagged.length > 0) {
      body += ` Shared this moment with ${data.peopleTagged.slice(0, 2).join(' and ')}.`
    }
    
    return `${hook} ${body} ${randomChoice(closingPhrases)(data.topArtist)}`
  },

  // 2. People-centric (when people are tagged)
  (data: InsightData) => {
    if (data.peopleTagged.length > 0) {
      const people = data.peopleTagged.slice(0, 3)
      let result = `With ${people.join(', ')}, the soundtrack was ${data.topArtist}.`
      
      if (data.songs.length > 0) {
        result += ` "${data.topSong}" was playing.`
      }
      
      if (data.topGenres.length > 0) {
        result += ` ${data.topGenres[0]} brings people together.`
      }
      
      return result + ' ' + randomChoice(closingPhrases)(data.topArtist)
    }
    
    // Fallback if no people tagged
    let result = `Solo listening session with ${data.topArtist}.`
    if (data.songs.length > 0) {
      result += ` "${data.topSong}" on repeat.`
    }
    return result + ' ' + randomChoice(closingPhrases)(data.topArtist)
  },

  // 3. Multi-year "On This Day" comparison
  (data: InsightData) => {
    if (data.yearsSpan > 1 && data.yearsList.length > 1) {
      const oldestYear = Math.min(...data.yearsList)
      const newestYear = Math.max(...data.yearsList)
      
      let result = `From ${oldestYear} to ${newestYear}, this date has heard it all.`
      
      if (data.artistCounts[data.topArtist] > 1) {
        result += ` ${data.topArtist} shows up ${data.artistCounts[data.topArtist]} times across the years.`
      } else {
        result += ` Each year brought something different: ${data.uniqueArtists.slice(0, 3).join(', ')}.`
      }
      
      if (data.songs.length > 0) {
        result += ` "${data.topSong}" is part of the collection now.`
      }
      
      return result
    }
    
    // Single year fallback
    return `${data.yearsList[0] || 'This year'}: "${data.topSong}" by ${data.topArtist}. First entry for this date. ${randomChoice(closingPhrases)(data.topArtist)}`
  },

  // 4. Genre + specific songs
  (data: InsightData) => {
    if (data.topGenres.length > 0) {
      let result = `${data.topGenres[0]} day.`
      
      result += ` "${data.topSong}" by ${data.topArtist} led the charge.`
      
      if (data.uniqueArtists.length > 1) {
        const others = data.uniqueArtists.filter(a => a !== data.topArtist)
        result += ` Also featuring ${others.slice(0, 2).join(' and ')}.`
      }
      
      if (data.peopleTagged.length > 0) {
        result += ` ${data.peopleTagged[0]} was there for it.`
      }
      
      return result + ' ' + randomChoice(closingPhrases)(data.topArtist)
    }
    
    return `"${data.topSong}" by ${data.topArtist}. ${data.trackCount} track${data.trackCount > 1 ? 's' : ''} logged. ${randomChoice(closingPhrases)(data.topArtist)}`
  },

  // 5. Popularity-aware with specifics
  (data: InsightData) => {
    const popDesc = randomChoice(popularityDescriptors[data.popularityTier as keyof typeof popularityDescriptors] || popularityDescriptors.midrange)
    
    let result = `"${data.topSong}" is a ${popDesc}.`
    
    if (data.popularityTier === 'underground' || data.popularityTier === 'indie') {
      result += ` Not everyone knows ${data.topArtist} like you do.`
    } else if (data.popularityTier === 'mega' || data.popularityTier === 'mainstream') {
      result += ` ${data.topArtist} is everywhere for a reason.`
    }
    
    if (data.songs.length > 1) {
      result += ` Also played: "${data.songs[1]}".`
    }
    
    if (data.peopleTagged.length > 0) {
      result += ` Enjoyed with ${data.peopleTagged[0]}.`
    }
    
    return result
  },

  // 6. Decade nostalgia with song names
  (data: InsightData) => {
    if (data.dominantDecade !== 'unknown' && decadeVibes[data.dominantDecade]) {
      const vibes = decadeVibes[data.dominantDecade]
      
      let result = `${randomChoice(vibes.adjectives).charAt(0).toUpperCase() + randomChoice(vibes.adjectives).slice(1)} pick.`
      result += ` "${data.topSong}" brings that ${data.dominantDecade} energy.`
      result += ` ${data.topArtist} delivers.`
      
      if (data.uniqueArtists.length > 1) {
        result += ` Also on the playlist: ${data.uniqueArtists.filter(a => a !== data.topArtist).slice(0, 2).join(', ')}.`
      }
      
      return result + ' ' + randomChoice(closingPhrases)(data.topArtist)
    }
    
    return `"${data.topSong}" by ${data.topArtist}. Classic choice. ${randomChoice(closingPhrases)(data.topArtist)}`
  },

  // 7. Theme-driven with song evidence
  (data: InsightData) => {
    if (data.detectedThemes.length > 0) {
      const theme = data.detectedThemes[0]
      
      const themeIntros: { [key: string]: string } = {
        love: 'Love was in the air.',
        heartbreak: 'Processing some feelings.',
        joy: 'Good vibes only.',
        energetic: 'High energy day.',
        chill: 'Keeping it mellow.',
        party: 'Party mode activated.',
        night: 'Late night listening.',
        reflection: 'Thinking things through.',
        freedom: 'Breaking free.',
        nostalgia: 'Looking back.',
      }
      
      let result = themeIntros[theme] || `${theme.charAt(0).toUpperCase() + theme.slice(1)} vibes.`
      result += ` "${data.topSong}" by ${data.topArtist} fits perfectly.`
      
      if (data.songs.length > 1) {
        result += ` "${data.songs[1]}" added to the mood.`
      }
      
      if (data.peopleTagged.length > 0) {
        result += ` ${data.peopleTagged[0]} gets it.`
      }
      
      return result
    }
    
    return `"${data.topSong}" by ${data.topArtist}. The vibe was clear. ${randomChoice(closingPhrases)(data.topArtist)}`
  },

  // 8. Notes-informed with specifics
  (data: InsightData) => {
    let result = ''
    
    if (data.notesTone === 'nostalgic' && data.notesKeywords.length > 0) {
      result = `Memories tied to "${data.topSong}".`
      result += ` ${data.topArtist} takes you back.`
    } else if (data.notesTone === 'positive') {
      result = `Good times with "${data.topSong}" playing.`
      result += ` ${data.topArtist} matched the energy.`
    } else if (data.notesTone === 'social') {
      result = `Social moment soundtracked by ${data.topArtist}.`
      result += ` "${data.topSong}" was the pick.`
    } else {
      result = `"${data.topSong}" by ${data.topArtist} captured the moment.`
    }
    
    if (data.peopleTagged.length > 0) {
      result += ` With ${data.peopleTagged.slice(0, 2).join(' and ')}.`
    }
    
    return result + ' ' + randomChoice(closingPhrases)(data.topArtist)
  },

  // 9. Artist loyalty detector
  (data: InsightData) => {
    if (data.artistCounts[data.topArtist] >= 2) {
      let result = `${data.topArtist} ${data.artistCounts[data.topArtist]} times? Loyal listener.`
      result += ` "${data.songs[0]}"${data.songs.length > 1 ? ` and "${data.songs[1]}"` : ''} got the plays.`
      
      if (data.topGenres.length > 0) {
        result += ` That ${data.topGenres[0]} sound is clearly your thing.`
      }
      
      return result
    }
    
    if (data.uniqueArtists.length > 3) {
      let result = `${data.uniqueArtists.length} different artists today. Explorer mode.`
      result += ` From ${data.uniqueArtists[0]} to ${data.uniqueArtists[data.uniqueArtists.length - 1]}.`
      result += ` "${data.topSong}" stood out.`
      return result
    }
    
    return `${data.topArtist} with "${data.topSong}". Quality pick. ${randomChoice(closingPhrases)(data.topArtist)}`
  },

  // 10. Seasonal + personal
  (data: InsightData) => {
    const seasonPhrase = randomChoice(seasonalPhrases[data.season])
    
    let result = `${seasonPhrase}.`
    result += ` "${data.topSong}" by ${data.topArtist} fits the season.`
    
    if (data.songs.length > 1) {
      result += ` Also played "${data.songs[1]}".`
    }
    
    if (data.peopleTagged.length > 0) {
      result += ` ${data.season.charAt(0).toUpperCase() + data.season.slice(1)} memories with ${data.peopleTagged[0]}.`
    }
    
    return result
  },

  // 11. Duration-aware
  (data: InsightData) => {
    let result = ''
    
    if (data.durationTier === 'short') {
      result = `Quick tracks today. "${data.topSong}" gets straight to the point.`
    } else if (data.durationTier === 'epic' || data.durationTier === 'long') {
      result = `Taking your time with "${data.topSong}". ${data.topArtist} rewards patience.`
    } else {
      result = `"${data.topSong}" by ${data.topArtist}. Perfect length.`
    }
    
    if (data.uniqueArtists.length > 1) {
      result += ` Also: ${data.uniqueArtists.filter(a => a !== data.topArtist).slice(0, 2).join(', ')}.`
    }
    
    if (data.peopleTagged.length > 0) {
      result += ` Listened with ${data.peopleTagged[0]}.`
    }
    
    return result + ' ' + randomChoice(closingPhrases)(data.topArtist)
  },

  // 12. Explicit content aware
  (data: InsightData) => {
    let result = ''
    
    if (data.hasExplicit) {
      result = `Unfiltered listening today. "${data.topSong}" by ${data.topArtist} doesn't hold back.`
    } else {
      result = `Clean picks. "${data.topSong}" by ${data.topArtist} set the tone.`
    }
    
    if (data.topGenres.length > 0) {
      result += ` ${data.topGenres[0]} energy throughout.`
    }
    
    if (data.peopleTagged.length > 0) {
      result += ` Playing for ${data.peopleTagged.slice(0, 2).join(' and ')}.`
    }
    
    return result + ' ' + randomChoice(closingPhrases)(data.topArtist)
  },

  // 13. Song title emphasis
  (data: InsightData) => {
    const hook = randomChoice(openingHooks)(data.topArtist, data.topSong)
    
    let result = hook
    
    if (data.songs.length === 1) {
      result += ` One song, one moment. ${data.topArtist} nailed it.`
    } else if (data.songs.length === 2) {
      result += ` Two songs defined the day: "${data.songs[0]}" and "${data.songs[1]}".`
    } else {
      result += ` "${data.songs[0]}", "${data.songs[1]}", and ${data.songs.length - 2} more.`
    }
    
    if (data.peopleTagged.length > 0) {
      result += ` ${data.peopleTagged[0]} heard it too.`
    }
    
    return result
  },

  // 14. Artist + genre fusion
  (data: InsightData) => {
    let result = `${data.topArtist}`
    
    if (data.topGenres.length > 0) {
      result += ` bringing that ${data.topGenres[0]}`
      if (data.topGenres.length > 1) {
        result += ` and ${data.topGenres[1]}`
      }
      result += ` sound.`
    } else {
      result += ` on the playlist.`
    }
    
    result += ` "${data.topSong}" was the standout.`
    
    if (data.uniqueArtists.length > 1) {
      const others = data.uniqueArtists.filter(a => a !== data.topArtist)
      result += ` Joined by ${others.slice(0, 2).join(' and ')}.`
    }
    
    if (data.peopleTagged.length > 0) {
      result += ` Shared with ${data.peopleTagged[0]}.`
    }
    
    return result + ' ' + randomChoice(closingPhrases)(data.topArtist)
  },

  // 15. Full context summary
  (data: InsightData) => {
    let parts: string[] = []
    
    // Song and artist
    parts.push(`"${data.topSong}" by ${data.topArtist}.`)
    
    // Count
    if (data.trackCount > 1) {
      parts.push(`${data.trackCount} tracks total.`)
    }
    
    // People
    if (data.peopleTagged.length > 0) {
      parts.push(`With ${data.peopleTagged.slice(0, 2).join(' and ')}.`)
    }
    
    // Genre
    if (data.topGenres.length > 0) {
      parts.push(`${data.topGenres[0]} vibes.`)
    }
    
    // Years
    if (data.yearsSpan > 1) {
      parts.push(`${data.yearsSpan} years of memories on this date.`)
    }
    
    // Add closing
    parts.push(randomChoice(closingPhrases)(data.topArtist))
    
    return parts.join(' ')
  },
]

// ============================================================================
// MAIN EXPORT
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
      // Optional extended data for richer insights
      popularity,
      duration, 
      explicit,
      releaseDate,
      notes,
      people,
      years,
    } = await request.json()

    if (!artists || !Array.isArray(artists) || artists.length === 0) {
      return NextResponse.json({ error: 'No artists provided' }, { status: 400 })
    }

    const uniqueArtists = Array.from(new Set(artists))

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
          console.error(`Error fetching genre for ${artist}:`, err)
        }
      }
    } catch (err) {
      console.error('Error fetching Spotify data:', err)
    }

    // Build comprehensive insight data
    const insightData = buildInsightData(
      artists,
      songs,
      date,
      artistGenres,
      genreAnalysis,
      {
        popularity,
        duration,
        explicit,
        releaseDate,
        notes,
        people,
        years,
      }
    )

    // Randomly select a template
    const selectedTemplate = randomChoice(insightTemplates)
    
    // Generate the insight
    const insight = selectedTemplate(insightData)

    return NextResponse.json({ insight })
  } catch (error: any) {
    console.error('Error generating AI insight:', error)
    return NextResponse.json(
      { error: 'Failed to generate insight', message: error?.message },
      { status: 500 }
    )
  }
}
