import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { getSupabase } from '@/lib/supabase'
import { unlockAllBirdsForPremium } from '@/lib/birds'
import { trackEvent, AnalyticsEvents } from '@/lib/analytics'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-12-18.acacia',
})

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!

export async function POST(request: NextRequest) {
  try {
    // 1. Get raw body and signature
    const body = await request.text()
    const signature = request.headers.get('stripe-signature')

    if (!signature) {
      console.error('[stripe/webhook] Missing stripe-signature header')
      return NextResponse.json({ error: 'Missing signature' }, { status: 400 })
    }

    // 2. Verify webhook signature
    let event: Stripe.Event
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
    } catch (err) {
      console.error('[stripe/webhook] Signature verification failed:', err)
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
    }

    console.log('[stripe/webhook] Received event:', event.type)

    // 3. Handle events
    switch (event.type) {
      case 'checkout.session.completed':
      case 'checkout.session.async_payment_succeeded': {
        const session = event.data.object as Stripe.Checkout.Session

        // Check if this is a founding flock purchase
        if (session.metadata?.type !== 'founding_flock') {
          console.log('[stripe/webhook] Not a founding flock purchase, skipping')
          break
        }

        // Check payment status
        if (session.payment_status !== 'paid') {
          console.log('[stripe/webhook] Payment not completed:', session.payment_status)
          break
        }

        // Get user ID from metadata
        const songbirdUserId = session.metadata?.songbirdUserId
        if (!songbirdUserId) {
          console.error('[stripe/webhook] Missing songbirdUserId in metadata')
          break
        }

        // Update user to premium using Supabase
        console.log('[stripe/webhook] Upgrading user to Founding Flock:', songbirdUserId)
        const supabase = getSupabase()
        
        const { error: updateError } = await supabase
          .from('users')
          .update({
            isPremium: true,
            isFoundingMember: true,
            premiumSince: new Date().toISOString(),
          })
          .eq('id', songbirdUserId)

        if (updateError) {
          console.error('[stripe/webhook] Error updating user:', updateError)
          break
        }

        // Unlock all birds for premium user
        try {
          await unlockAllBirdsForPremium(songbirdUserId)
          console.log('[stripe/webhook] Unlocked all birds for user:', songbirdUserId)
        } catch (err) {
          console.error('[stripe/webhook] Error unlocking birds:', err)
        }

        // Track analytics
        try {
          await trackEvent({
            userId: songbirdUserId,
            event: AnalyticsEvents.PREMIUM_ACTIVATED,
            properties: { type: 'founding_flock', paymentMethod: 'stripe' },
          })
          await trackEvent({
            userId: songbirdUserId,
            event: AnalyticsEvents.CHECKOUT_COMPLETED,
            properties: { type: 'founding_flock' },
          })
        } catch (err) {
          console.error('[stripe/webhook] Error tracking analytics:', err)
        }

        console.log('[stripe/webhook] User upgraded successfully:', songbirdUserId)
        break
      }

      default:
        console.log('[stripe/webhook] Unhandled event type:', event.type)
    }

    // 4. Return success
    return NextResponse.json({ received: true })
  } catch (error: unknown) {
    console.error('[stripe/webhook] Error:', error)
    const message = error instanceof Error ? error.message : 'Webhook handler failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

// Disable body parsing for webhooks (we need raw body)
export const config = {
  api: {
    bodyParser: false,
  },
}
