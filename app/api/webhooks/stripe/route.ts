import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { updateUserPremiumStatus, createPurchaseNotification } from '@/lib/stripe'
import { getSupabase } from '@/lib/supabase'
import Stripe from 'stripe'

/**
 * Stripe Webhook Handler
 * Handles subscription events from Stripe
 * 
 * Events handled:
 * - checkout.session.completed
 * - customer.subscription.created
 * - customer.subscription.updated
 * - customer.subscription.deleted
 * - invoice.payment_succeeded
 * - invoice.payment_failed
 */

// Get raw body for webhook signature verification
export async function POST(request: NextRequest) {
  if (!stripe) {
    console.log('[stripe/webhook] Stripe not configured')
    return NextResponse.json({ received: true, message: 'Stripe not configured' })
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

  if (!webhookSecret) {
    console.error('[stripe/webhook] STRIPE_WEBHOOK_SECRET not configured')
    return NextResponse.json(
      { error: 'Webhook secret not configured' },
      { status: 500 }
    )
  }

  try {
    // Get raw body for signature verification
    const body = await request.text()
    const signature = request.headers.get('stripe-signature')

    if (!signature) {
      return NextResponse.json(
        { error: 'No signature provided' },
        { status: 400 }
      )
    }

    // Verify webhook signature
    let event: Stripe.Event
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
    } catch (err) {
      console.error('[stripe/webhook] Signature verification failed:', err)
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 400 }
      )
    }

    console.log('[stripe/webhook] Received event:', event.type)

    // Handle different event types
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        
        // Handle waitlist mode payments (no user account yet)
        if (session.metadata?.waitlistMode === 'true') {
          const email = session.metadata.email
          const tier = session.metadata.tier || 'founding_flock_special'
          
          if (email) {
            const supabase = getSupabase()
            
            // Update waitlist entry with Stripe customer ID
            const updateData: any = {
              stripeCustomerId: session.customer as string || null,
            }
            
            // If it's a Founding Flock payment, mark as eligible
            if (tier === 'founding_flock_special' || tier === 'founding_flock') {
              updateData.foundingFlockEligible = true
            }
            
            await supabase
              .from('waitlist_entries')
              .update(updateData)
              .eq('email', email)
            
            console.log(`[stripe/webhook] Waitlist payment completed for ${email}, tier: ${tier}`)
          }
          break
        }
        
        if (session.metadata) {
          const userId = session.metadata.userId
          const tier = session.metadata.tier

          // Handle one-time payment (Founding Flock Special)
          if (session.mode === 'payment' && userId && tier === 'founding_flock_special') {
            await updateUserPremiumStatus(
              userId,
              true, // isPremium
              true, // isFoundingMember
              session.customer as string | undefined
            )

            await createPurchaseNotification(userId)

            // Mark waitlist entry as no longer eligible if exists
            const supabase = getSupabase()
            const { data: user } = await supabase
              .from('users')
              .select('email')
              .eq('id', userId)
              .single()

            if (user?.email) {
              await supabase
                .from('waitlist_entries')
                .update({ foundingFlockEligible: false })
                .eq('email', user.email)
            }

            console.log(`[stripe/webhook] User ${userId} upgraded to Founding Flock Special (one-time)`)
          }
          // Handle subscription payments
          else if (session.mode === 'subscription' && userId) {
            const isFoundingMember = tier === 'founding_flock_yearly' || tier === 'founding_flock'

            if (tier === 'founding_flock_yearly' || tier === 'founding_flock') {
              await updateUserPremiumStatus(
                userId,
                true, // isPremium
                true, // isFoundingMember
                session.customer as string | undefined,
                session.subscription as string | undefined
              )

              await createPurchaseNotification(userId)

              // Mark waitlist entry as no longer eligible if exists
              const supabase = getSupabase()
              const { data: user } = await supabase
                .from('users')
                .select('email')
                .eq('id', userId)
                .single()

              if (user?.email) {
                await supabase
                  .from('waitlist_entries')
                  .update({ foundingFlockEligible: false })
                  .eq('email', user.email)
              }

              console.log(`[stripe/webhook] User ${userId} upgraded to Founding Flock Yearly`)
            } else if (tier === 'monthly') {
              await updateUserPremiumStatus(
                userId,
                true, // isPremium
                false, // isFoundingMember
                session.customer as string | undefined,
                session.subscription as string | undefined
              )

              await createPurchaseNotification(userId)

              console.log(`[stripe/webhook] User ${userId} subscribed to monthly plan`)
            }
          }
        }
        break
      }

      case 'customer.subscription.created': {
        const subscription = event.data.object as Stripe.Subscription
        
          if (subscription.metadata?.userId) {
            const tier = subscription.metadata?.tier
            const isFoundingMember = tier === 'founding_flock_yearly' || tier === 'founding_flock'
            
            await updateUserPremiumStatus(
              subscription.metadata.userId,
              true,
              isFoundingMember,
              subscription.customer as string,
              subscription.id
            )

            console.log(`[stripe/webhook] Subscription created for user ${subscription.metadata.userId}, tier: ${tier}`)
          }
        break
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription
        
        if (subscription.metadata?.userId) {
          // If subscription is active, keep premium
          // If cancelled but user is founding member, keep premium (lifetime access)
          const isActive = subscription.status === 'active' || subscription.status === 'trialing'
          const isFoundingMember = subscription.metadata.tier === 'founding_flock_yearly' || subscription.metadata.tier === 'founding_flock'

          await updateUserPremiumStatus(
            subscription.metadata.userId,
            isActive || isFoundingMember, // Keep premium if active OR founding member
            isFoundingMember,
            subscription.customer as string,
            subscription.id
          )

          console.log(`[stripe/webhook] Subscription updated for user ${subscription.metadata.userId}: ${subscription.status}, tier: ${subscription.metadata.tier}`)
        }
        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription
        
        if (subscription.metadata?.userId) {
          const isFoundingMember = subscription.metadata.tier === 'founding_flock_yearly' || subscription.metadata.tier === 'founding_flock'
          
          // Founding members keep premium even after cancellation
          await updateUserPremiumStatus(
            subscription.metadata.userId,
            isFoundingMember, // Keep premium only if founding member
            isFoundingMember,
            subscription.customer as string,
            subscription.id
          )

          console.log(`[stripe/webhook] Subscription deleted for user ${subscription.metadata.userId}, founding member: ${isFoundingMember}`)
        }
        break
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice
        
        if (invoice.subscription && typeof invoice.subscription === 'string') {
          // Get subscription to check metadata
          const subscription = await stripe.subscriptions.retrieve(invoice.subscription)
          
          if (subscription.metadata?.userId) {
            const tier = subscription.metadata?.tier
            const isFoundingMember = tier === 'founding_flock'
            
            // Ensure user stays premium
            await updateUserPremiumStatus(
              subscription.metadata.userId,
              true,
              isFoundingMember,
              invoice.customer as string,
              subscription.id
            )

            console.log(`[stripe/webhook] Payment succeeded for user ${subscription.metadata.userId}, tier: ${tier}`)
          }
        }
        break
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice
        
        if (invoice.subscription && typeof invoice.subscription === 'string') {
          const subscription = await stripe.subscriptions.retrieve(invoice.subscription)
          
          if (subscription.metadata?.userId) {
            // Founding members keep access even if payment fails
            const isFoundingMember = subscription.metadata.tier === 'founding_flock_yearly' || subscription.metadata.tier === 'founding_flock'
            
            if (!isFoundingMember) {
              // Non-founding members lose premium on payment failure
              await updateUserPremiumStatus(
                subscription.metadata.userId,
                false,
                false,
                invoice.customer as string,
                subscription.id
              )

              console.log(`[stripe/webhook] Payment failed for user ${subscription.metadata.userId}, premium removed`)
            } else {
              console.log(`[stripe/webhook] Payment failed for founding member ${subscription.metadata.userId}, premium retained`)
            }
          }
        }
        break
      }

      default:
        console.log(`[stripe/webhook] Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (error: unknown) {
    console.error('[stripe/webhook] Error processing webhook:', error)
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json(
      { error: 'Webhook processing failed', message },
      { status: 500 }
    )
  }
}

// Note: In Next.js App Router, raw body is automatically available via request.text()
// No need for bodyParser config
