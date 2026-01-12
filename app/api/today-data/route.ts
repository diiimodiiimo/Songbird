import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { getPrismaUserIdFromClerk } from '@/lib/clerk-sync'

/**
 * OPTIMIZED: Combined endpoint for Today page data
 * Combines: streak + on-this-day + existing entry check + friends list
 * Reduces 4-5 API calls to 1
 */
export async function GET(request: Request) {
  try {
    const { userId: clerkUserId } = await auth()
    if (!clerkUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const prismaUserId = await getPrismaUserIdFromClerk(clerkUserId)
    if (!prismaUserId) {
      return NextResponse.json({ error: 'User not found in database' }, { status: 404 })
    }

    const { searchParams } = new URL(request.url)
    const dateParam = searchParams.get('date') // YYYY-MM-DD format

    if (!dateParam || !/^\d{4}-\d{2}-\d{2}$/.test(dateParam)) {
      return NextResponse.json({ error: 'Invalid date format. Use YYYY-MM-DD' }, { status: 400 })
    }

    // Parse date components
    const [year, month, day] = dateParam.split('-')
    const monthNum = parseInt(month)
    const dayNum = parseInt(day)

    // Run all queries in parallel for maximum speed
    const [allEntries, existingEntryResult, friends] = await Promise.all([
      // Get all entries for streak calculation + on-this-day (single query)
      prisma.entry.findMany({
        where: { userId: prismaUserId },
        select: {
          id: true,
          date: true,
          songTitle: true,
          artist: true,
          albumArt: true,
          notes: true,
          people: {
            select: { id: true, name: true },
          },
        },
        orderBy: { date: 'desc' },
      }),

      // Check for existing entry on the selected date
      prisma.entry.findFirst({
        where: {
          userId: prismaUserId,
          date: {
            gte: new Date(`${dateParam}T00:00:00.000Z`),
            lte: new Date(`${dateParam}T23:59:59.999Z`),
          },
        },
        select: {
          id: true,
          songTitle: true,
          artist: true,
          notes: true,
          people: { select: { id: true, name: true } },
          mentions: {
            select: {
              user: { select: { id: true, name: true, email: true } },
            },
          },
        },
      }),

      // Get friends list for mentions
      prisma.friendRequest.findMany({
        where: {
          OR: [
            { senderId: prismaUserId, status: 'accepted' },
            { receiverId: prismaUserId, status: 'accepted' },
          ],
        },
        select: {
          sender: { select: { id: true, name: true, email: true } },
          receiver: { select: { id: true, name: true, email: true } },
        },
      }),
    ])

    // Calculate streak from entries
    let currentStreak = 0
    if (allEntries.length > 0) {
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      const entryDates = new Set(
        allEntries.map((entry) => {
          const date = entry.date instanceof Date ? entry.date : new Date(entry.date)
          date.setHours(0, 0, 0, 0)
          return date.getTime()
        })
      )

      let checkDate = new Date(today)
      // If today doesn't have an entry, start from yesterday
      if (!entryDates.has(checkDate.getTime())) {
        checkDate.setDate(checkDate.getDate() - 1)
      }

      while (entryDates.has(checkDate.getTime())) {
        currentStreak++
        checkDate.setDate(checkDate.getDate() - 1)
      }
    }

    // Filter on-this-day entries (same month/day, different year)
    const onThisDayEntries = allEntries
      .filter((entry) => {
        const entryDate = entry.date instanceof Date ? entry.date : new Date(entry.date)
        const entryYear = entryDate.getFullYear()
        return (
          entryDate.getMonth() + 1 === monthNum &&
          entryDate.getDate() === dayNum &&
          entryYear !== parseInt(year) // Exclude current year
        )
      })
      .slice(0, 3) // Max 3 entries
      .map((entry) => ({
        id: String(entry.id),
        date: entry.date instanceof Date
          ? entry.date.toISOString().split('T')[0]
          : String(entry.date).split('T')[0],
        songTitle: String(entry.songTitle || ''),
        artist: String(entry.artist || ''),
        albumArt: entry.albumArt ? String(entry.albumArt) : null,
      }))

    // Format existing entry if found
    const existingEntry = existingEntryResult
      ? {
          id: existingEntryResult.id,
          songTitle: existingEntryResult.songTitle,
          artist: existingEntryResult.artist,
          notes: existingEntryResult.notes || '',
          people: existingEntryResult.people?.map((p: any) => ({ id: p.id, name: p.name })) || [],
          mentions: existingEntryResult.mentions?.map((m: any) => m.user) || [],
        }
      : null

    // Format friends list
    const friendsList = friends.map((fr) => {
      const friend = fr.sender.id === prismaUserId ? fr.receiver : fr.sender
      return {
        id: friend.id,
        name: friend.name || friend.email?.split('@')[0] || 'Unknown',
        email: friend.email,
      }
    })

    // Return all data in one response with short cache for performance
    const response = NextResponse.json({
      currentStreak,
      onThisDayEntries,
      existingEntry,
      friends: friendsList,
    })
    
    // Cache for 30 seconds on client, revalidate in background
    response.headers.set('Cache-Control', 'private, max-age=30, stale-while-revalidate=60')
    
    return response
  } catch (error: any) {
    console.error('Error in /api/today-data:', error?.message)
    return NextResponse.json(
      { error: 'Failed to fetch today data', message: error?.message },
      { status: 500 }
    )
  }
}

