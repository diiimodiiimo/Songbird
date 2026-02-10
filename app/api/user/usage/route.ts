import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { getUserUsageStats } from '@/lib/paywall'

/**
 * GET /api/user/usage
 * Returns current usage stats and limits for the user
 */
export async function GET() {
  try {
    const { userId: clerkUserId } = await auth()
    if (!clerkUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const stats = await getUserUsageStats(clerkUserId)

    return NextResponse.json(stats)
  } catch (error: unknown) {
    console.error('[user/usage] Error:', error)
    const message = error instanceof Error ? error.message : 'Failed to get usage stats'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}


