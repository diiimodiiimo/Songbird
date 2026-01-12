import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: Request) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const timeFilter = searchParams.get('time') || 'all'

    // Calculate date range based on time filter
    let startDate: Date | undefined
    const now = new Date()

    if (timeFilter === 'week') {
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    } else if (timeFilter === 'month') {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1)
    } else if (timeFilter === 'year') {
      startDate = new Date(now.getFullYear(), 0, 1)
    }

    // Get all entries (filtered by date if applicable)
    const entries = await prisma.entry.findMany({
      where: startDate ? {
        date: {
          gte: startDate,
        },
      } : undefined,
      select: {
        artist: true,
        songTitle: true,
        albumArt: true,
      },
    })

    // Count artists
    const artistCounts: Record<string, number> = {}
    entries.forEach((entry) => {
      artistCounts[entry.artist] = (artistCounts[entry.artist] || 0) + 1
    })

    // Get top 50 artists
    const topArtists = Object.entries(artistCounts)
      .map(([artist, count]) => ({ artist, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 50)

    // Count songs
    const songCounts: Record<string, { songTitle: string; artist: string; albumArt: string | null; count: number }> = {}
    entries.forEach((entry) => {
      const key = `${entry.songTitle}|||${entry.artist}`
      if (!songCounts[key]) {
        songCounts[key] = {
          songTitle: entry.songTitle,
          artist: entry.artist,
          albumArt: entry.albumArt,
          count: 0,
        }
      }
      songCounts[key].count++
    })

    // Get top 50 songs
    const topSongs = Object.values(songCounts)
      .sort((a, b) => b.count - a.count)
      .slice(0, 50)

    // Get total stats
    const totalUsers = await prisma.user.count()
    const totalEntries = entries.length

    return NextResponse.json({
      topArtists,
      topSongs,
      stats: {
        totalUsers,
        totalEntries,
        timeFilter,
      },
    })
  } catch (error) {
    console.error('Error fetching leaderboard data:', error)
    return NextResponse.json(
      { error: 'Failed to fetch leaderboard data' },
      { status: 500 }
    )
  }
}
