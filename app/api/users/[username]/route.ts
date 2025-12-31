import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ username: string }> }
) {
  try {
    const { username } = await params

    // Find user by username or email (if username is an email)
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { username: username },
          { email: username }, // Allow lookup by email if username is not set
        ],
      },
      select: {
        id: true,
        username: true,
        name: true,
        email: true,
        image: true,
        bio: true,
        favoriteArtists: true,
        favoriteSongs: true,
        entries: {
          select: {
            id: true,
          },
        },
      },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Count accepted friendships
    const friendsCount = await prisma.friendRequest.count({
      where: {
        status: 'accepted',
        OR: [
          { senderId: user.id },
          { receiverId: user.id },
        ],
      },
    })

    // Parse favorite artists and songs (if stored as JSON strings)
    let favoriteArtists: string[] = []
    let favoriteSongs: Array<{ songTitle: string; artist: string }> = []

    if (user.favoriteArtists) {
      try {
        favoriteArtists = typeof user.favoriteArtists === 'string' 
          ? JSON.parse(user.favoriteArtists) 
          : user.favoriteArtists
      } catch (e) {
        favoriteArtists = []
      }
    }

    if (user.favoriteSongs) {
      try {
        favoriteSongs = typeof user.favoriteSongs === 'string'
          ? JSON.parse(user.favoriteSongs)
          : user.favoriteSongs
      } catch (e) {
        favoriteSongs = []
      }
    }

    return NextResponse.json({
      username: user.username || user.email.split('@')[0],
      name: user.name,
      email: user.email,
      image: user.image,
      bio: user.bio,
      favoriteArtists,
      favoriteSongs,
      stats: {
        totalEntries: user.entries.length,
        friendsCount,
      },
    })
  } catch (error) {
    console.error('Error fetching public profile:', error)
    return NextResponse.json(
      { error: 'Failed to fetch profile' },
      { status: 500 }
    )
  }
}
