import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { getUserIdFromClerk } from '@/lib/clerk-sync'
import { createFoundingFlockSpecialCheckout, stripe, FOUNDING_FLOCK_LIMIT } from '@/lib/stripe'
import { getSupabase } from '@/lib/supabase'
import { getFoundingMemberCount } from '@/lib/premium'

/**
 * Founding Flock Special Checkout Endpoint
 * Creates a Stripe checkout session for $39.99 one-time Founding Flock lifetime access
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

    // Check founding slots availability
    const foundingCount = await getFoundingMemberCount()
    if (foundingCount >= FOUNDING_FLOCK_LIMIT) {
      return NextResponse.json(
        { error: 'Founding Flock slots are full. Monthly subscription is still available.' },
        { status: 400 }
      )
    }

    // Check if user is on waitlist and eligible
    const supabase = getSupabase()
    const { data: user } = await supabase
      .from('users')
      .select('email')
      .eq('id', userId)
      .single()

    if (user?.email) {
      const { data: waitlistEntry } = await supabase
        .from('waitlist_entries')
        .select('foundingFlockEligible, invitedAt')
        .eq('email', user.email)
        .single()

      // If user is on waitlist but not eligible, return error
      if (waitlistEntry && !waitlistEntry.foundingFlockEligible) {
        return NextResponse.json(
          { error: 'Founding Flock eligibility has expired. Monthly subscription is still available.' },
          { status: 400 }
        )
      }

      // Mark waitlist entry as invited if not already
      if (waitlistEntry && !waitlistEntry.invitedAt) {
        await supabase
          .from('waitlist_entries')
          .update({ invitedAt: new Date().toISOString() })
          .eq('email', user.email)
      }
    }

    // Create checkout session
    const checkout = await createFoundingFlockSpecialCheckout(clerkUserId, userId)

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
    console.error('[checkout/founding-flock-special] Error:', error)
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json(
      { error: 'Failed to create checkout session', message },
      { status: 500 }
    )
  }
}

/**
 * GET - Check checkout status
 */
export async function GET() {
  return NextResponse.json({ 
    message: 'Founding Flock Special checkout endpoint',
    configured: !!stripe,
  })
}


