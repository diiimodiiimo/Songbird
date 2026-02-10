import { NextResponse } from 'next/server'
import { getSupabase } from '@/lib/supabase'
import { stripe, getFoundingFlockSpecialPriceId, getAppUrl, FOUNDING_FLOCK_LIMIT } from '@/lib/stripe'
import { z } from 'zod'
import { v4 as uuidv4 } from 'uuid'

const foundingFlockWaitlistSchema = z.object({
  email: z.string().email(),
  name: z.string().optional(),
  source: z.string().optional(),
  referralCode: z.string().optional(),
})

/**
 * Founding Flock Waitlist Checkout Endpoint
 * Creates a Stripe checkout session for waitlist users (no auth required)
 * Saves payment info to waitlist, doesn't create account until launch
 */
export async function POST(request: Request) {
  try {
    // Check if Stripe is configured
    if (!stripe) {
      return NextResponse.json(
        { error: 'Payment processing is not available. Please contact support.' },
        { status: 503 }
      )
    }

    const body = await request.json()
    const { email, name, source, referralCode } = foundingFlockWaitlistSchema.parse(body)

    const supabase = getSupabase()

    // Check founding slots availability
    const { count: foundingCount } = await supabase
      .from('waitlist_entries')
      .select('*', { count: 'exact', head: true })
      .eq('foundingFlockEligible', true)

    if ((foundingCount || 0) >= FOUNDING_FLOCK_LIMIT) {
      return NextResponse.json(
        { error: 'Founding Flock slots are full. Please join the regular waitlist.' },
        { status: 400 }
      )
    }

    // Check if email already exists in waitlist
    const { data: existing } = await supabase
      .from('waitlist_entries')
      .select('id, email, name, source, referralCode, foundingFlockEligible')
      .eq('email', email)
      .single()

    // Get source from URL params if not provided
    const url = new URL(request.url)
    const urlSource = url.searchParams.get('source') || url.searchParams.get('utm_source')
    const finalSource = source || urlSource || null

    // Get price ID
    const priceId = await getFoundingFlockSpecialPriceId()
    if (!priceId) {
      return NextResponse.json(
        { error: 'Founding Flock pricing is not configured. Please contact support.' },
        { status: 503 }
      )
    }

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'payment', // One-time payment
      success_url: `${getAppUrl()}/waitlist/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${getAppUrl()}/waitlist?canceled=true`,
      customer_email: email,
      metadata: {
        email,
        name: name || '',
        source: finalSource || '',
        referralCode: referralCode || '',
        waitlistMode: 'true',
        tier: 'founding_flock_special',
      },
    })

    // Save or update waitlist entry
    if (existing) {
      // Update existing entry
      await supabase
        .from('waitlist_entries')
        .update({
          name: name || existing.name || null,
          source: finalSource || existing.source || null,
          referralCode: referralCode || existing.referralCode || null,
          foundingFlockEligible: true,
        })
        .eq('email', email)
    } else {
      // Create new entry
      await supabase
        .from('waitlist_entries')
        .insert({
          id: uuidv4(),
          email,
          name: name || null,
          source: finalSource,
          referralCode: referralCode || null,
          joinedAt: new Date().toISOString(),
          foundingFlockEligible: true,
        })
    }

    return NextResponse.json({
      sessionId: session.id,
      url: session.url,
    })
  } catch (error: any) {
    console.error('[waitlist/founding-flock] Error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { error: 'Failed to create checkout session', message: error?.message },
      { status: 500 }
    )
  }
}

/**
 * GET - Check endpoint status
 */
export async function GET() {
  return NextResponse.json({ 
    message: 'Founding Flock Waitlist checkout endpoint',
    configured: !!stripe,
  })
}

