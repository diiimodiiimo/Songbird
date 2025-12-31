import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getFriendIds } from '@/lib/friends'

// GET - Get friends feed (entries from friends, showing only song + mentions)
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get all friend IDs
    const friendIds = await getFriendIds(session.user.id)

    if (friendIds.length === 0) {
      return NextResponse.json({ entries: [] })
    }

    // Get entries from friends
    const entries = await prisma.entry.findMany({
      where: {
        userId: {
          in: friendIds,
        },
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            username: true,
            image: true,
          },
        },
        mentions: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                name: true,
                username: true,
                image: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 50, // Limit to recent 50 entries
    })

    // Format entries for feed (only song + mentions, no notes/tags)
    const feedEntries = entries.map((entry) => ({
      id: entry.id,
      date: new Date(entry.date).toISOString().split('T')[0], // Format as YYYY-MM-DD
      songTitle: entry.songTitle,
      artist: entry.artist,
      albumTitle: entry.albumTitle,
      albumArt: entry.albumArt,
      user: entry.user,
      mentions: entry.mentions.map((mention) => ({
        id: mention.id,
        user: mention.user,
      })),
      createdAt: entry.createdAt,
    }))

    return NextResponse.json({ entries: feedEntries })
  } catch (error) {
    console.error('Error fetching feed:', error)
    return NextResponse.json(
      { error: 'Failed to fetch feed' },
      { status: 500 }
    )
  }
}

