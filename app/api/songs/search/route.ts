import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { checkRateLimit, getRateLimitHeaders } from '@/lib/rate-limit'
import { searchTracks } from '@/lib/spotify-api'

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

    const tracks = await searchTracks(query)

    return NextResponse.json({ tracks }, {
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
