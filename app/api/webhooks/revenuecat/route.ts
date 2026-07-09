import { NextRequest, NextResponse } from 'next/server'
import { updateUserPremiumStatus, createPurchaseNotification } from '@/lib/stripe'
import { getUserIdFromClerk } from '@/lib/clerk-sync'

/**
 * RevenueCat Webhook Handler — syncs iOS In-App Purchases to premium status.
 *
 * Auth: RevenueCat sends the value configured in its dashboard as the
 * Authorization header; it must equal REVENUECAT_WEBHOOK_AUTH. That shared
 * secret IS the auth (mirrors how the Stripe webhook uses signatures).
 *
 * The mobile app must call Purchases.logIn(<clerk user id>) so that
 * event.app_user_id is the Clerk user ID we can map to a database user.
 *
 * Docs: https://www.revenuecat.com/docs/integrations/webhooks
 */

interface RevenueCatEvent {
  type: string
  app_user_id: string
  product_id?: string
  expiration_at_ms?: number
  store?: string
}

// Product IDs containing this marker grant lifetime founding-member status
const FOUNDING_PRODUCT_MARKER = 'founding'

const GRANT_EVENTS = new Set([
  'INITIAL_PURCHASE',
  'RENEWAL',
  'UNCANCELLATION',
  'NON_RENEWING_PURCHASE',
  'PRODUCT_CHANGE',
])

export async function POST(request: NextRequest) {
  const webhookAuth = process.env.REVENUECAT_WEBHOOK_AUTH
  if (!webhookAuth) {
    console.log('[revenuecat/webhook] REVENUECAT_WEBHOOK_AUTH not configured')
    return NextResponse.json({ received: true, message: 'RevenueCat not configured' })
  }

  if (request.headers.get('authorization') !== webhookAuth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const event: RevenueCatEvent | undefined = body?.event
    if (!event?.type || !event.app_user_id) {
      return NextResponse.json({ error: 'Malformed event' }, { status: 400 })
    }

    console.log(`[revenuecat/webhook] Received ${event.type} for ${event.app_user_id}`)

    // RevenueCat anonymous IDs ($RCAnonymousID:...) can't be mapped to a user;
    // the app must log in to RevenueCat with the Clerk user ID before purchase
    if (event.app_user_id.startsWith('$RCAnonymousID')) {
      console.warn('[revenuecat/webhook] Anonymous app_user_id — purchase cannot be linked to a user')
      return NextResponse.json({ received: true, warning: 'anonymous user' })
    }

    const userId = await getUserIdFromClerk(event.app_user_id)
    if (!userId) {
      console.error(`[revenuecat/webhook] No database user for ${event.app_user_id}`)
      // 200 so RevenueCat doesn't retry forever; the event is logged for manual review
      return NextResponse.json({ received: true, warning: 'user not found' })
    }

    const isFoundingProduct = (event.product_id || '').toLowerCase().includes(FOUNDING_PRODUCT_MARKER)

    if (GRANT_EVENTS.has(event.type)) {
      await updateUserPremiumStatus(userId, true, isFoundingProduct)
      if (event.type === 'INITIAL_PURCHASE' || event.type === 'NON_RENEWING_PURCHASE') {
        await createPurchaseNotification(userId)
      }
      console.log(`[revenuecat/webhook] Premium granted to ${userId} (${event.product_id})`)
    } else if (event.type === 'EXPIRATION') {
      // Founding members keep lifetime access, matching Stripe behavior
      await updateUserPremiumStatus(userId, isFoundingProduct, isFoundingProduct)
      console.log(`[revenuecat/webhook] Subscription expired for ${userId}, founding: ${isFoundingProduct}`)
    } else {
      // CANCELLATION (access continues until EXPIRATION), BILLING_ISSUE, TRANSFER, etc.
      console.log(`[revenuecat/webhook] No status change for event type ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('[revenuecat/webhook] Error processing webhook:', error)
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ error: 'Webhook processing failed', message }, { status: 500 })
  }
}
