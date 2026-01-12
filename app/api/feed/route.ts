import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { getFriendIds } from '@/lib/friends'
import { getPrismaUserIdFromClerk } from '@/lib/clerk-sync'

// GET - Get friends feed (entries from friends, showing only song + mentions)
export async function GET(request: Request) {
  try {
    const { userId: clerkUserId } = await auth()
    if (!clerkUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Convert Clerk user ID to Prisma user ID
    const userId = await getPrismaUserIdFromClerk(clerkUserId)
    if (!userId) {
      return NextResponse.json({ error: 'User not found in database' }, { status: 404 })
    }

    // Get all friend IDs
    const friendIds = await getFriendIds(userId)

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

