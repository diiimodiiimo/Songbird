import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import SpotifyWebApi from 'spotify-web-api-node'

const spotifyApi = new SpotifyWebApi({
  clientId: process.env.SPOTIPY_CLIENT_ID || 'e419e60b293c4c13b7c67ab86780c2ef',
  clientSecret: process.env.SPOTIPY_CLIENT_SECRET || 'aff4838b31af4d36965b1d84c40d24da',
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
    const { userId } = await auth()
    if (!userId) {
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



