import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { getPrismaUserIdFromClerk } from '@/lib/clerk-sync'
import { calculateStreak, restoreStreak } from '@/lib/streak'

// Get current streak status
export async function GET() {
  try {
    const { userId: clerkId } = await auth()

    if (!clerkId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = await getPrismaUserIdFromClerk(clerkId)
    if (!userId) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const streakData = await calculateStreak(userId)

    return NextResponse.json(streakData)
  } catch (error) {
    console.error('Error getting streak:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}

// Restore a broken streak
export async function POST(request: Request) {
  try {
    const { userId: clerkId } = await auth()

    if (!clerkId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = await getPrismaUserIdFromClerk(clerkId)
    if (!userId) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const body = await request.json()
    const { action } = body

    if (action === 'restore') {
      const result = await restoreStreak(userId)
      return NextResponse.json(result)
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error) {
    console.error('Error restoring streak:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
