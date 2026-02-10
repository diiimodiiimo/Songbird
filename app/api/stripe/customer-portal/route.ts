import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { stripe } from '@/lib/stripe'
import { getPrismaUserIdFromClerk } from '@/lib/clerk-sync'
import { getSupabase } from '@/lib/supabase'

/**
 * Stripe Customer Portal Endpoint
 * Creates a session for users to manage their subscriptions
 */
export async function POST(request: Request) {
  try {
    const { userId: clerkUserId } = await auth()
    if (!clerkUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!stripe) {
      return NextResponse.json(
        { error: 'Payment processing is not available' },
        { status: 503 }
      )
    }

    const userId = await getPrismaUserIdFromClerk(clerkUserId)
    if (!userId) {
      return NextResponse.json({ error: 'User not found in database' }, { status: 404 })
    }

    const body = await request.json()
    const { returnUrl } = body

    const supabase = getSupabase()

    // Get user's Stripe customer ID
    const { data: user } = await supabase
      .from('users')
      .select('stripeCustomerId')
      .eq('id', userId)
      .single()

    if (!user?.stripeCustomerId) {
      return NextResponse.json(
        { error: 'No subscription found' },
        { status: 404 }
      )
    }

    // Create portal session
    const session = await stripe.billingPortal.sessions.create({
      customer: user.stripeCustomerId,
      return_url: returnUrl || `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/settings/premium`,
    })

    return NextResponse.json({ url: session.url })
  } catch (error: unknown) {
    console.error('[stripe/customer-portal] Error:', error)
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json(
      { error: 'Failed to create portal session', message },
      { status: 500 }
    )
  }
}


