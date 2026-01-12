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

export async function POST(request: Request) {
  try {
    const { userId } = await auth()
    if (!userId) {
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

    // Determine the insight pattern based on data
    let patternData: {
      type: 'single-artist' | 'dominant-artist' | 'genre-focused' | 'curated-mix' | 'eclectic'
      topArtist?: string
      otherArtists?: string[]
      genreDesc?: string
      artistsList?: string
      primaryGenre?: string
    }

    if (uniqueArtists.length === 1) {
      const genres = artistGenres[topArtist || ''] || []
      const genreDesc = genres.length > 0 ? `, blending ${genres.slice(0, 2).join(' and ')}` : ''
      patternData = {
        type: 'single-artist',
        topArtist: topArtist,
        genreDesc,
      }
    } else if (uniqueArtists.length <= 3 && topArtist && artistCounts[topArtist] >= 2) {
      const otherArtists = uniqueArtists.filter(a => a !== topArtist)
      const genres = artistGenres[topArtist || ''] || []
      const genreDesc = genres.length > 0 ? ` (${genres[0]})` : ''
      patternData = {
        type: 'dominant-artist',
        topArtist,
        otherArtists,
        genreDesc,
      }
    } else if (topGenres.length >= 2 && topGenres[0] && genreAnalysis[topGenres[0]] >= 2) {
      patternData = {
        type: 'genre-focused',
        artistsList: uniqueArtists.slice(0, 3).join(', ') + (uniqueArtists.length > 3 ? ' and more' : ''),
        primaryGenre: topGenres[0],
      }
    } else if (uniqueArtists.length <= 5) {
      const genres = topGenres.length > 0 ? ` (${topGenres.join(', ')})` : ''
      patternData = {
        type: 'curated-mix',
        artistsList: uniqueArtists.slice(0, 3).join(', ') + (uniqueArtists.length > 3 ? ' and more' : ''),
        genreDesc: genres,
      }
    } else {
      patternData = {
        type: 'eclectic',
        artistsList: `${uniqueArtists[0]} to ${uniqueArtists[uniqueArtists.length - 1]}`,
      }
    }

    // 10 different format templates
    const formatTemplates = [
      // Template 1: Direct and descriptive
      (data: typeof patternData, artists: string[], tracks: number, themes: string[], genres: string[]) => {
        let base = ''
        if (data.type === 'single-artist') {
          base = `A deep dive into ${data.topArtist}${data.genreDesc || ''}—${tracks} ${tracks === 1 ? 'track' : 'tracks'} showing your connection to their sound.`
        } else if (data.type === 'dominant-artist') {
          base = `${data.topArtist}${data.genreDesc || ''} dominates this day, with ${data.otherArtists?.length === 1 ? data.otherArtists[0] : data.otherArtists?.join(' and ')} adding ${data.otherArtists?.length === 1 ? 'a different flavor' : 'variety'}.`
        } else if (data.type === 'genre-focused') {
          base = `A ${data.primaryGenre}-focused day with ${artists.length} artists—${data.artistsList}—creating a cohesive ${data.primaryGenre} atmosphere.`
        } else if (data.type === 'curated-mix') {
          base = `A curated selection of ${artists.length} artists${data.genreDesc || ''}—${data.artistsList}—showing intentional listening.`
        } else {
          base = `An eclectic journey through ${artists.length} different artists—from ${data.artistsList}—showing a day of musical exploration across genres.`
        }
        if (themes.length > 0) {
          const themeText = themes.length === 1 ? themes[0] : themes.slice(0, 2).join(' and ')
          base += ` The ${themeText} theme${themes.length > 1 ? 's' : ''} ${themes.length > 1 ? 'emerge' : 'emerges'} through the song titles.`
        }
        if (genres.length === 1) {
          base += ` The ${genres[0]} sound ties everything together.`
        } else if (genres.length >= 2) {
          base += ` ${genres[0]} and ${genres[1]} blend throughout.`
        }
        return base
      },
      // Template 2: Conversational
      (data: typeof patternData, artists: string[], tracks: number, themes: string[], genres: string[]) => {
        let base = ''
        if (data.type === 'single-artist') {
          base = `You really dove deep into ${data.topArtist}${data.genreDesc || ''} today—${tracks} ${tracks === 1 ? 'song' : 'songs'} that show how much you connect with their music.`
        } else if (data.type === 'dominant-artist') {
          base = `${data.topArtist}${data.genreDesc || ''} was clearly the star today, while ${data.otherArtists?.length === 1 ? data.otherArtists[0] : data.otherArtists?.join(' and ')} brought ${data.otherArtists?.length === 1 ? 'something different' : 'some variety'} to the mix.`
        } else if (data.type === 'genre-focused') {
          base = `You kept it ${data.primaryGenre} today with ${artists.length} artists like ${data.artistsList}, creating a really cohesive vibe.`
        } else if (data.type === 'curated-mix') {
          base = `You carefully selected ${artists.length} artists${data.genreDesc || ''}—${data.artistsList}—showing you knew exactly what you wanted to hear.`
        } else {
          base = `What an adventure! You explored ${artists.length} different artists, from ${data.artistsList}, taking your ears on quite the journey.`
        }
        if (themes.length > 0) {
          const themeText = themes.length === 1 ? themes[0] : themes.slice(0, 2).join(' and ')
          base += ` There's a real ${themeText} vibe running through these tracks.`
        }
        if (genres.length === 1) {
          base += ` That ${genres[0]} sound really brings it all together.`
        } else if (genres.length >= 2) {
          base += ` You can hear ${genres[0]} and ${genres[1]} mixing throughout.`
        }
        return base
      },
      // Template 3: Reflective
      (data: typeof patternData, artists: string[], tracks: number, themes: string[], genres: string[]) => {
        let base = ''
        if (data.type === 'single-artist') {
          base = `Today was all about ${data.topArtist}${data.genreDesc || ''}—${tracks} ${tracks === 1 ? 'track' : 'tracks'} that reflect your deep appreciation for their artistry.`
        } else if (data.type === 'dominant-artist') {
          base = `While ${data.topArtist}${data.genreDesc || ''} took center stage, ${data.otherArtists?.length === 1 ? data.otherArtists[0] : data.otherArtists?.join(' and ')} provided ${data.otherArtists?.length === 1 ? 'a nice contrast' : 'some interesting contrast'}.`
        } else if (data.type === 'genre-focused') {
          base = `You stayed in the ${data.primaryGenre} lane today, with ${artists.length} artists including ${data.artistsList} all contributing to that signature sound.`
        } else if (data.type === 'curated-mix') {
          base = `This ${artists.length}-artist collection${data.genreDesc || ''}—featuring ${data.artistsList}—reveals a thoughtful approach to your listening.`
        } else {
          base = `Your musical taste took you far and wide today—${artists.length} artists spanning from ${data.artistsList}, showing your love for diversity.`
        }
        if (themes.length > 0) {
          const themeText = themes.length === 1 ? themes[0] : themes.slice(0, 2).join(' and ')
          base += ` The underlying ${themeText} theme${themes.length > 1 ? 's' : ''} add${themes.length > 1 ? '' : 's'} another layer to this collection.`
        }
        if (genres.length === 1) {
          base += ` It's all held together by that distinctive ${genres[0]} energy.`
        } else if (genres.length >= 2) {
          base += ` The fusion of ${genres[0]} and ${genres[1]} creates something special here.`
        }
        return base
      },
      // Template 4: Energetic
      (data: typeof patternData, artists: string[], tracks: number, themes: string[], genres: string[]) => {
        let base = ''
        if (data.type === 'single-artist') {
          base = `You went all-in on ${data.topArtist}${data.genreDesc || ''} today! ${tracks} ${tracks === 1 ? 'song' : 'songs'} that prove you're a true fan.`
        } else if (data.type === 'dominant-artist') {
          base = `${data.topArtist}${data.genreDesc || ''} ruled the day, with ${data.otherArtists?.length === 1 ? data.otherArtists[0] : data.otherArtists?.join(' and ')} keeping things fresh.`
        } else if (data.type === 'genre-focused') {
          base = `Pure ${data.primaryGenre} energy today! ${artists.length} artists—${data.artistsList}—all delivering that ${data.primaryGenre} sound you love.`
        } else if (data.type === 'curated-mix') {
          base = `You handpicked ${artists.length} amazing artists${data.genreDesc || ''}: ${data.artistsList}. This is quality curation!`
        } else {
          base = `You didn't hold back today—${artists.length} artists from ${data.artistsList}? That's musical exploration at its finest!`
        }
        if (themes.length > 0) {
          const themeText = themes.length === 1 ? themes[0] : themes.slice(0, 2).join(' and ')
          base += ` Plus, there's a strong ${themeText} thread connecting these tracks.`
        }
        if (genres.length === 1) {
          base += ` Everything's unified by that ${genres[0]} groove.`
        } else if (genres.length >= 2) {
          base += ` The way ${genres[0]} meets ${genres[1]} here? Perfect.`
        }
        return base
      },
      // Template 5: Analytical
      (data: typeof patternData, artists: string[], tracks: number, themes: string[], genres: string[]) => {
        let base = ''
        if (data.type === 'single-artist') {
          base = `Analysis: ${tracks} ${tracks === 1 ? 'track' : 'tracks'} from ${data.topArtist}${data.genreDesc || ''} indicates a focused listening session centered on this artist's unique style.`
        } else if (data.type === 'dominant-artist') {
          base = `Pattern detected: ${data.topArtist}${data.genreDesc || ''} appears as the primary focus, complemented by ${data.otherArtists?.length === 1 ? data.otherArtists[0] : data.otherArtists?.join(' and ')} for stylistic variation.`
        } else if (data.type === 'genre-focused') {
          base = `Genre consistency observed: ${data.primaryGenre} dominates across ${artists.length} artists (${data.artistsList}), suggesting an intentional thematic approach.`
        } else if (data.type === 'curated-mix') {
          base = `Selection pattern: ${artists.length} artists${data.genreDesc || ''}—${data.artistsList}—demonstrate a deliberate, curated listening strategy.`
        } else {
          base = `Diversity metric: ${artists.length} distinct artists ranging from ${data.artistsList} indicate a broad musical exploration pattern.`
        }
        if (themes.length > 0) {
          const themeText = themes.length === 1 ? themes[0] : themes.slice(0, 2).join(' and ')
          base += ` Thematic analysis reveals ${themeText} ${themes.length > 1 ? 'themes' : 'theme'} present in song titles.`
        }
        if (genres.length === 1) {
          base += ` Genre cohesion factor: ${genres[0]} serves as the unifying element.`
        } else if (genres.length >= 2) {
          base += ` Genre intersection: ${genres[0]} and ${genres[1]} demonstrate significant overlap.`
        }
        return base
      },
      // Template 6: Storytelling
      (data: typeof patternData, artists: string[], tracks: number, themes: string[], genres: string[]) => {
        let base = ''
        if (data.type === 'single-artist') {
          base = `The story of this day begins and ends with ${data.topArtist}${data.genreDesc || ''}. ${tracks} ${tracks === 1 ? 'track' : 'tracks'} tell the tale of your connection to their music.`
        } else if (data.type === 'dominant-artist') {
          base = `Today's musical narrative featured ${data.topArtist}${data.genreDesc || ''} as the main character, with ${data.otherArtists?.length === 1 ? data.otherArtists[0] : data.otherArtists?.join(' and ')} playing supporting roles.`
        } else if (data.type === 'genre-focused') {
          base = `This was a ${data.primaryGenre} story told through ${artists.length} voices—${data.artistsList}—each adding their chapter to the same musical tale.`
        } else if (data.type === 'curated-mix') {
          base = `You wrote today's soundtrack with ${artists.length} carefully chosen artists${data.genreDesc || ''}: ${data.artistsList}. Each selection tells part of the story.`
        } else {
          base = `Today's playlist reads like a musical novel, taking you from ${data.artistsList} across ${artists.length} different chapters of sound.`
        }
        if (themes.length > 0) {
          const themeText = themes.length === 1 ? themes[0] : themes.slice(0, 2).join(' and ')
          base += ` The ${themeText} ${themes.length > 1 ? 'themes' : 'theme'} running through these songs add${themes.length > 1 ? '' : 's'} depth to the narrative.`
        }
        if (genres.length === 1) {
          base += ` It all comes together under the ${genres[0]} umbrella.`
        } else if (genres.length >= 2) {
          base += ` The ${genres[0]} and ${genres[1]} elements create a rich, layered story.`
        }
        return base
      },
      // Template 7: Casual/Relaxed
      (data: typeof patternData, artists: string[], tracks: number, themes: string[], genres: string[]) => {
        let base = ''
        if (data.type === 'single-artist') {
          base = `Just vibing with ${data.topArtist}${data.genreDesc || ''} today—${tracks} ${tracks === 1 ? 'track' : 'tracks'} of pure enjoyment.`
        } else if (data.type === 'dominant-artist') {
          base = `Mostly ${data.topArtist}${data.genreDesc || ''} today, with a bit of ${data.otherArtists?.length === 1 ? data.otherArtists[0] : data.otherArtists?.join(' and ')} mixed in for good measure.`
        } else if (data.type === 'genre-focused') {
          base = `Stayed in that ${data.primaryGenre} zone with ${artists.length} artists including ${data.artistsList}. Nice and consistent.`
        } else if (data.type === 'curated-mix') {
          base = `Put together a nice little mix of ${artists.length} artists${data.genreDesc || ''}—${data.artistsList}. Good choices all around.`
        } else {
          base = `Went all over the place today—${artists.length} artists from ${data.artistsList}. Variety is the spice of life, right?`
        }
        if (themes.length > 0) {
          const themeText = themes.length === 1 ? themes[0] : themes.slice(0, 2).join(' and ')
          base += ` Also noticed some ${themeText} vibes in the song titles.`
        }
        if (genres.length === 1) {
          base += ` That ${genres[0]} sound really ties it all together.`
        } else if (genres.length >= 2) {
          base += ` Nice blend of ${genres[0]} and ${genres[1]} going on.`
        }
        return base
      },
      // Template 8: Poetic
      (data: typeof patternData, artists: string[], tracks: number, themes: string[], genres: string[]) => {
        let base = ''
        if (data.type === 'single-artist') {
          base = `In the realm of ${data.topArtist}${data.genreDesc || ''}, you found ${tracks} ${tracks === 1 ? 'a moment' : 'moments'} of musical truth.`
        } else if (data.type === 'dominant-artist') {
          base = `${data.topArtist}${data.genreDesc || ''} danced in the foreground, while ${data.otherArtists?.length === 1 ? data.otherArtists[0] : data.otherArtists?.join(' and ')} whispered harmony in the spaces between.`
        } else if (data.type === 'genre-focused') {
          base = `A ${data.primaryGenre} symphony played out across ${artists.length} artists—${data.artistsList}—each note finding its place in the greater melody.`
        } else if (data.type === 'curated-mix') {
          base = `You painted with ${artists.length} colors${data.genreDesc || ''}, ${data.artistsList}, each stroke intentional, each choice meaningful.`
        } else {
          base = `Your musical canvas stretched wide today—${artists.length} artists from ${data.artistsList}, each a different shade in your auditory palette.`
        }
        if (themes.length > 0) {
          const themeText = themes.length === 1 ? themes[0] : themes.slice(0, 2).join(' and ')
          base += ` The ${themeText} ${themes.length > 1 ? 'themes' : 'theme'} echo${themes.length > 1 ? '' : 'es'} like a refrain throughout.`
        }
        if (genres.length === 1) {
          base += ` All woven together by the ${genres[0]} thread that binds them.`
        } else if (genres.length >= 2) {
          base += ` Where ${genres[0]} and ${genres[1]} meet, something beautiful emerges.`
        }
        return base
      },
      // Template 9: Observational
      (data: typeof patternData, artists: string[], tracks: number, themes: string[], genres: string[]) => {
        let base = ''
        if (data.type === 'single-artist') {
          base = `Interesting: you dedicated this entire listening session to ${data.topArtist}${data.genreDesc || ''}, with ${tracks} ${tracks === 1 ? 'selection' : 'selections'} from their catalog.`
        } else if (data.type === 'dominant-artist') {
          base = `${data.topArtist}${data.genreDesc || ''} clearly had your attention, though ${data.otherArtists?.length === 1 ? data.otherArtists[0] : data.otherArtists?.join(' and ')} made ${data.otherArtists?.length === 1 ? 'an appearance' : 'appearances'} as well.`
        } else if (data.type === 'genre-focused') {
          base = `Notable pattern: you maintained a ${data.primaryGenre} focus across ${artists.length} artists (${data.artistsList}), showing a preference for this particular sound.`
        } else if (data.type === 'curated-mix') {
          base = `Observation: ${artists.length} artists${data.genreDesc || ''}—${data.artistsList}—suggest a well-considered selection process.`
        } else {
          base = `Wide range observed: ${artists.length} different artists from ${data.artistsList} indicate an exploratory listening approach.`
        }
        if (themes.length > 0) {
          const themeText = themes.length === 1 ? themes[0] : themes.slice(0, 2).join(' and ')
          base += ` Additionally, ${themeText} ${themes.length > 1 ? 'themes' : 'theme'} appear${themes.length > 1 ? '' : 's'} to be present.`
        }
        if (genres.length === 1) {
          base += ` The common thread? ${genres[0]}.`
        } else if (genres.length >= 2) {
          base += ` Genre overlap noted between ${genres[0]} and ${genres[1]}.`
        }
        return base
      },
      // Template 10: Enthusiastic
      (data: typeof patternData, artists: string[], tracks: number, themes: string[], genres: string[]) => {
        let base = ''
        if (data.type === 'single-artist') {
          base = `Wow! You really went all out with ${data.topArtist}${data.genreDesc || ''} today! ${tracks} ${tracks === 1 ? 'amazing track' : 'incredible tracks'} that show your love for their music.`
        } else if (data.type === 'dominant-artist') {
          base = `${data.topArtist}${data.genreDesc || ''} absolutely crushed it today! And ${data.otherArtists?.length === 1 ? data.otherArtists[0] : data.otherArtists?.join(' and ')}? Perfect additions!`
        } else if (data.type === 'genre-focused') {
          base = `Yes! ${data.primaryGenre} all the way! ${artists.length} artists like ${data.artistsList} bringing that ${data.primaryGenre} fire!`
        } else if (data.type === 'curated-mix') {
          base = `What a lineup! ${artists.length} incredible artists${data.genreDesc || ''}—${data.artistsList}—this is top-tier curation!`
        } else {
          base = `Incredible diversity! ${artists.length} artists from ${data.artistsList}? You really covered all the bases today!`
        }
        if (themes.length > 0) {
          const themeText = themes.length === 1 ? themes[0] : themes.slice(0, 2).join(' and ')
          base += ` And those ${themeText} ${themes.length > 1 ? 'themes' : 'theme'}? Absolutely perfect!`
        }
        if (genres.length === 1) {
          base += ` That ${genres[0]} energy? It's everywhere and it's amazing!`
        } else if (genres.length >= 2) {
          base += ` The combo of ${genres[0]} and ${genres[1]}? Pure magic!`
        }
        return base
      },
    ]

    // Randomly select a template format
    const selectedTemplate = formatTemplates[Math.floor(Math.random() * formatTemplates.length)]
    
    // Build the insight using the selected template
    const insight = selectedTemplate(patternData, uniqueArtists, artists.length, detectedThemes, topGenres)

    return NextResponse.json({ insight })
  } catch (error: any) {
    console.error('Error generating AI insight:', error)
    return NextResponse.json(
      { error: 'Failed to generate insight', message: error?.message },
      { status: 500 }
    )
  }
}

