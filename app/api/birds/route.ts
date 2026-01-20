import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { getPrismaUserIdFromClerk } from '@/lib/clerk-sync'
import { 
  getBirdUnlockStatuses, 
  checkAndUnlockBirds,
  getNextUnlockableBird,
  initializeDefaultBird
} from '@/lib/birds'
import { trackEvent, AnalyticsEvents } from '@/lib/analytics'

// Get bird unlock statuses for current user
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

    // Ensure default bird is unlocked
    await initializeDefaultBird(userId)

    // Check for any new unlocks based on current progress
    const newUnlocks = await checkAndUnlockBirds(userId)

    // Track if any birds were unlocked
    for (const birdId of newUnlocks) {
      await trackEvent({
        userId,
        event: AnalyticsEvents.BIRD_UNLOCKED,
        properties: { birdId, method: 'milestone' },
      })
    }

    // Get all bird statuses
    const birds = await getBirdUnlockStatuses(userId)
    const nextUnlock = await getNextUnlockableBird(userId)

    // Calculate summary
    const unlockedCount = birds.filter(b => b.isUnlocked).length
    const totalCount = birds.length

    return NextResponse.json({
      birds,
      summary: {
        unlockedCount,
        totalCount,
        percentage: Math.round((unlockedCount / totalCount) * 100),
      },
      nextUnlock,
      newUnlocks,
    })
  } catch (error) {
    console.error('Error fetching bird statuses:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}

