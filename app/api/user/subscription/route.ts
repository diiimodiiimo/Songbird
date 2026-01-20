import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { getUserPremiumStatus } from '@/lib/premium'

/**
 * GET /api/user/subscription
 * Returns the current user's premium/subscription status
 */
export async function GET() {
  try {
    const { userId: clerkUserId } = await auth()
    if (!clerkUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const status = await getUserPremiumStatus(clerkUserId)

    return NextResponse.json({
      isPremium: status.isPremium,
      isFoundingMember: status.isFoundingMember,
      premiumSince: status.premiumSince?.toISOString() || null,
      plan: status.isFoundingMember ? 'founding_flock' : status.isPremium ? 'premium' : 'free',
    })
  } catch (error: unknown) {
    console.error('[user/subscription] Error:', error)
    const message = error instanceof Error ? error.message : 'Failed to get subscription status'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

