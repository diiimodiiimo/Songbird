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
    const dateParam = searchParams.get('date') // YYYY-MM-DD format

    if (!dateParam || !/^\d{4}-\d{2}-\d{2}$/.test(dateParam)) {
      return NextResponse.json({ error: 'Invalid date format. Use YYYY-MM-DD' }, { status: 400 })
    }

    // Extract month and day (MM-DD)
    const [, month, day] = dateParam.split('-')
    const monthNum = parseInt(month)
    const dayNum = parseInt(day)

    // For SQLite, we need to fetch and filter in memory
    // This is acceptable since On This Day queries are small (only matching month/day)
    // Fetch entries with a reasonable limit to prevent issues
    const allEntries = await prisma.entry.findMany({
      where: { userId: String(userId) },
      select: {
        id: true,
        date: true,
        songTitle: true,
        artist: true,
        albumArt: true,
        notes: true,
        people: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { date: 'desc' },
      take: 5000, // Reasonable limit - user likely won't have more than 5000 entries matching a specific month/day
    })

    // Filter entries where month/day matches
    const entries = allEntries.filter((entry) => {
      const entryDate = entry.date instanceof Date ? entry.date : new Date(entry.date)
      return entryDate.getMonth() + 1 === monthNum && entryDate.getDate() === dayNum
    })

    // Format entries - include base64 images since this is a small, targeted query
    const formattedEntries = entries.map((entry: any) => ({
      id: String(entry.id),
      date: entry.date instanceof Date
        ? entry.date.toISOString().split('T')[0]
        : String(entry.date).split('T')[0],
      songTitle: String(entry.songTitle || ''),
      artist: String(entry.artist || ''),
      albumArt: entry.albumArt ? String(entry.albumArt) : null, // Include base64 images
      notesPreview: entry.notes
        ? String(entry.notes).substring(0, 160) + (entry.notes.length > 160 ? '...' : '')
        : null,
      people: Array.isArray(entry.people) ? entry.people.map((person: any) => ({
        id: String(person.id),
        name: String(person.name),
      })) : [],
    }))

    return NextResponse.json({ entries: formattedEntries })
  } catch (error: any) {
    console.error('=== ERROR IN /api/on-this-day ===')
    console.error(error?.message)
    return NextResponse.json(
      {
        error: 'Failed to fetch on-this-day entries',
        message: error?.message || 'Unknown error',
      },
      { status: 500 }
    )
  }
}

