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

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const artistName = searchParams.get('name')

    if (!artistName) {
      return NextResponse.json(
        { error: 'Artist name parameter is required' },
        { status: 400 }
      )
    }

    await getAccessToken()
    const results = await spotifyApi.searchArtists(artistName, { limit: 1 })

    const artist = results.body.artists?.items[0]
    if (!artist) {
      return NextResponse.json({ image: null })
    }

    return NextResponse.json({
      image: artist.images[0]?.url || null,
      name: artist.name,
    })
  } catch (error) {
    console.error('Error searching artist:', error)
    return NextResponse.json(
      { error: 'Failed to search artist' },
      { status: 500 }
    )
  }
}



