import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { getUserIdFromClerk } from '@/lib/clerk-sync'
import { createMonthlyCheckout, stripe } from '@/lib/stripe'

/**
 * Monthly Subscription Checkout Endpoint
 * Creates a Stripe checkout session for $3/month subscription
 */
export async function POST() {
  try {
    const { userId: clerkUserId } = await auth()
    if (!clerkUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if Stripe is configured
    if (!stripe) {
      return NextResponse.json(
        { error: 'Payment processing is not available. Please contact support.' },
        { status: 503 }
      )
    }

    // Get database user ID
    const userId = await getUserIdFromClerk(clerkUserId)
    if (!userId) {
      return NextResponse.json({ error: 'User not found in database' }, { status: 404 })
    }

    // Create checkout session
    const checkout = await createMonthlyCheckout(clerkUserId, userId)

    if (!checkout) {
      return NextResponse.json(
        { error: 'Failed to create checkout session. Please try again later.' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      sessionId: checkout.sessionId,
      url: checkout.url,
    })
  } catch (error: unknown) {
    console.error('[checkout/monthly] Error:', error)
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json(
      { error: 'Failed to create checkout session', message },
      { status: 500 }
    )
  }
}


