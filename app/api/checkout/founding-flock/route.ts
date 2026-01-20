import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { getSupabase } from '@/lib/supabase'
import { stripe, FOUNDING_FLOCK_PRICE_CENTS, FOUNDING_FLOCK_LIMIT, APP_URL } from '@/lib/stripe'
import { getFoundingMemberCount } from '@/lib/premium'

export async function POST() {
  try {
    // 1. Authenticate user via Clerk
    const { userId: clerkUserId } = await auth()
    if (!clerkUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 2. Get user from database using Supabase
    const supabase = getSupabase()
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, email')
      .eq('clerkId', clerkUserId)
      .single()

    if (userError || !user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // 3. Check if already premium (column doesn't exist yet, skip for now)
    // TODO: Add isPremium column to database when implementing premium features
    if (false) {
      return NextResponse.json(
        { error: 'You are already a premium member!' },
        { status: 400 }
      )
    }

    // 4. Check founding slots remaining
    const foundingCount = await getFoundingMemberCount()
    if (foundingCount >= FOUNDING_FLOCK_LIMIT) {
      return NextResponse.json(
        { error: 'Founding Flock slots are sold out. Check back for regular pricing.' },
        { status: 400 }
      )
    }

    // 5. Create or retrieve Stripe customer
    let stripeCustomerId = user.stripeCustomerId

    if (!stripeCustomerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: {
          clerkId: clerkUserId,
          songbirdUserId: user.id,
        },
      })
      stripeCustomerId = customer.id

      // Store customer ID for future use
      await supabase
        .from('users')
        .update({ stripeCustomerId })
        .eq('id', user.id)
    }

    // 6. Create Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      mode: 'payment', // One-time payment, NOT subscription
      customer: stripeCustomerId,
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: 'SongBird Founding Flock',
              description:
                'Lifetime premium access — All birds unlocked, B-sides, full analytics, Wrapped, and all future features forever.',
            },
            unit_amount: FOUNDING_FLOCK_PRICE_CENTS,
          },
          quantity: 1,
        },
      ],
      success_url: `${APP_URL}/settings/premium?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${APP_URL}/settings/premium?canceled=true`,
      metadata: {
        clerkId: clerkUserId,
        songbirdUserId: user.id,
        type: 'founding_flock',
      },
    })

    // 7. Return checkout URL
    return NextResponse.json({ url: session.url })
  } catch (error: unknown) {
    console.error('[checkout/founding-flock] Error:', error)
    const message = error instanceof Error ? error.message : 'Failed to create checkout session'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
