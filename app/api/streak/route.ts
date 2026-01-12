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

    // Get all entries sorted by date descending
    const entries = await prisma.entry.findMany({
      where: { userId: prismaUserId },
      select: { date: true },
      orderBy: { date: 'desc' },
    })

    if (entries.length === 0) {
      return NextResponse.json({ currentStreak: 0 })
    }

    // Calculate current streak (consecutive days from today backwards)
    let currentStreak = 0
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    const entryDates = new Set(
      entries.map((entry) => {
        const date = entry.date instanceof Date ? entry.date : new Date(entry.date)
        date.setHours(0, 0, 0, 0)
        return date.getTime()
      })
    )

    // Check if today has an entry
    const todayTime = today.getTime()
    if (!entryDates.has(todayTime)) {
      // If today doesn't have an entry, check yesterday
      today.setDate(today.getDate() - 1)
    }

    // Count consecutive days backwards
    let checkDate = new Date(today)
    while (entryDates.has(checkDate.getTime())) {
      currentStreak++
      checkDate.setDate(checkDate.getDate() - 1)
    }

    return NextResponse.json({ currentStreak })
  } catch (error: any) {
    console.error('=== ERROR IN /api/streak ===')
    console.error(error?.message)
    return NextResponse.json(
      {
        error: 'Failed to calculate streak',
        message: error?.message || 'Unknown error',
      },
      { status: 500 }
    )
  }
}

