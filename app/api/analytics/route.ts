import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { getPrismaUserIdFromClerk } from '@/lib/clerk-sync'

export async function GET(request: Request) {
  try {
    const { userId: clerkUserId } = await auth()
    if (!clerkUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Convert Clerk user ID to Prisma user ID
    const prismaUserId = await getPrismaUserIdFromClerk(clerkUserId)
    if (!prismaUserId) {
      return NextResponse.json({ error: 'User not found in database' }, { status: 404 })
    }

    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId') || prismaUserId
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    const where: any = { userId }
    if (startDate && endDate) {
      where.date = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      }
    }

    const entries = await prisma.entry.findMany({
      where,
      select: {
        artist: true,
        songTitle: true,
        date: true,
        albumArt: true,
        people: {
          select: {
            name: true,
          },
        },
      },
    })

    // Calculate top artists
    const artistCounts: Record<string, number> = {}
    entries.forEach((entry) => {
      artistCounts[entry.artist] = (artistCounts[entry.artist] || 0) + 1
    })

    const topArtists = Object.entries(artistCounts)
      .map(([artist, count]) => ({ artist, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)

    // Calculate top songs
    const songCounts: Record<string, number> = {}
    entries.forEach((entry) => {
      const key = `${entry.songTitle} - ${entry.artist}`
      songCounts[key] = (songCounts[key] || 0) + 1
    })

    const topSongs = Object.entries(songCounts)
      .map(([song, count]) => {
        const [songTitle, artist] = song.split(' - ')
        const entry = entries.find(e => e.songTitle === songTitle && e.artist === artist)
        return { 
          songTitle, 
          artist, 
          count,
          albumArt: entry?.albumArt || null
        }
      })
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)

    // Calculate top people
    const peopleCounts: Record<string, number> = {}
    entries.forEach((entry) => {
      entry.people.forEach((person) => {
        peopleCounts[person.name] = (peopleCounts[person.name] || 0) + 1
      })
    })

    const topPeople = Object.entries(peopleCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 20) // Show top 20 people

    return NextResponse.json({ topArtists, topSongs, topPeople })
  } catch (error) {
    console.error('Error fetching analytics:', error)
    return NextResponse.json(
      { error: 'Failed to fetch analytics' },
      { status: 500 }
    )
  }
}


