import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import SpotifyWebApi from 'spotify-web-api-node'
import { checkRateLimit, getRateLimitHeaders } from '@/lib/rate-limit'

const spotifyApi = new SpotifyWebApi({
  clientId: process.env.SPOTIPY_CLIENT_ID,
  clientSecret: process.env.SPOTIPY_CLIENT_SECRET,
})

// Get access token using client credentials flow
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

export async function GET(request: Request) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    // Rate limiting - check after auth to avoid unnecessary work
    const rateLimitResult = await checkRateLimit(userId, 'SEARCH')
    if (!rateLimitResult.allowed) {
      return rateLimitResult.response!
    }

    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q')

    if (!query) {
      return NextResponse.json(
        { error: 'Query parameter is required' },
        { status: 400 }
      )
    }

    await getAccessToken()
    const results = await spotifyApi.searchTracks(query, { limit: 5 })

    const tracks = results.body.tracks?.items.map((track: any) => ({
      id: track.id,
      name: track.name,
      artist: track.artists[0]?.name || 'Unknown',
      album: track.album.name,
      albumArt: track.album.images[0]?.url || '',
      durationMs: track.duration_ms,
      explicit: track.explicit,
      popularity: track.popularity,
      releaseDate: track.album.release_date,
      uri: track.uri,
    }))

    return NextResponse.json({ tracks: tracks || [] }, {
      headers: await getRateLimitHeaders(userId, 'SEARCH'),
    })
  } catch (error) {
    console.error('Error searching songs:', error)
    return NextResponse.json(
      { error: 'Failed to search songs' },
      { status: 500 }
    )
  }
}




