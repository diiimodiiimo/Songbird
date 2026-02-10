import Stripe from 'stripe'
import { getSupabase } from './supabase'
import { getUserIdFromClerk } from './clerk-sync'

// Initialize Stripe client
export const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2024-12-18.acacia' as any,
    })
  : null

// Founding Flock pricing constants
export const FOUNDING_FLOCK_SPECIAL_PRICE_CENTS = parseInt(
  process.env.FOUNDING_FLOCK_SPECIAL_PRICE_CENTS || '3999', // $39.99 one-time
  10
)
export const FOUNDING_FLOCK_YEARLY_PRICE_CENTS = parseInt(
  process.env.FOUNDING_FLOCK_YEARLY_PRICE_CENTS || '2999', // $29.99/year
  10
)
export const FOUNDING_FLOCK_LIMIT = parseInt(
  process.env.FOUNDING_FLOCK_LIMIT || '1000',
  10
)

// Monthly subscription pricing constants
export const MONTHLY_PRICE_CENTS = parseInt(
  process.env.MONTHLY_PRICE_CENTS || '299', // $2.99/month
  10
)

// App URL for redirects
export function getAppUrl(): string {
  // Server-side: use environment variable or default
  if (typeof window === 'undefined') {
    return process.env.NEXT_PUBLIC_APP_URL || 
           (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000')
  }
  // Client-side: use window location
  return window.location.origin
}

export const APP_URL = getAppUrl()

/**
 * Get Stripe price ID for monthly subscription
 */
export async function getMonthlyPriceId(): Promise<string | null> {
  const priceId = process.env.STRIPE_MONTHLY_PRICE_ID
  
  if (priceId) {
    return priceId
  }

  console.warn('[stripe] STRIPE_MONTHLY_PRICE_ID not configured')
  return null
}

/**
 * Create a checkout session for monthly subscription
 */
export async function createMonthlyCheckout(
  clerkUserId: string,
  userId: string
): Promise<{ sessionId: string; url: string } | null> {
  if (!stripe) {
    throw new Error('Stripe not configured')
  }

  const priceId = await getMonthlyPriceId()
  if (!priceId) {
    throw new Error('Monthly subscription price ID not configured')
  }

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    mode: 'subscription',
    success_url: `${getAppUrl()}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${getAppUrl()}/checkout/cancelled`,
    metadata: {
      userId,
      clerkUserId,
      tier: 'monthly',
    },
    subscription_data: {
      metadata: {
        userId,
        clerkUserId,
        tier: 'monthly',
      },
    },
  })

  return {
    sessionId: session.id,
    url: session.url || '',
  }
}

/**
 * Get Stripe price ID for Founding Flock Special (one-time)
 */
export async function getFoundingFlockSpecialPriceId(): Promise<string | null> {
  const priceId = process.env.STRIPE_FOUNDING_FLOCK_SPECIAL_PRICE_ID
  
  if (priceId) {
    return priceId
  }

  console.warn('[stripe] STRIPE_FOUNDING_FLOCK_SPECIAL_PRICE_ID not configured')
  return null
}

/**
 * Get Stripe price ID for Founding Flock Yearly
 */
export async function getFoundingFlockYearlyPriceId(): Promise<string | null> {
  const priceId = process.env.STRIPE_FOUNDING_FLOCK_YEARLY_PRICE_ID
  
  if (priceId) {
    return priceId
  }

  console.warn('[stripe] STRIPE_FOUNDING_FLOCK_YEARLY_PRICE_ID not configured')
  return null
}

/**
 * Get Stripe price ID for Founding Flock (legacy - for backward compatibility)
 */
export async function getFoundingFlockPriceId(): Promise<string | null> {
  // Default to yearly if special not set
  return getFoundingFlockYearlyPriceId()
}

/**
 * Create a checkout session for Founding Flock Special (one-time payment)
 */
export async function createFoundingFlockSpecialCheckout(
  clerkUserId: string,
  userId: string
): Promise<{ sessionId: string; url: string } | null> {
  if (!stripe) {
    throw new Error('Stripe not configured')
  }

  const priceId = await getFoundingFlockSpecialPriceId()
  if (!priceId) {
    throw new Error('Founding Flock Special price ID not configured')
  }

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    mode: 'payment', // One-time payment, not subscription
    success_url: `${getAppUrl()}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${getAppUrl()}/checkout/cancelled`,
    metadata: {
      userId,
      clerkUserId,
      tier: 'founding_flock_special',
    },
  })

  return {
    sessionId: session.id,
    url: session.url || '',
  }
}

/**
 * Create a checkout session for Founding Flock Yearly membership
 */
export async function createFoundingFlockYearlyCheckout(
  clerkUserId: string,
  userId: string
): Promise<{ sessionId: string; url: string } | null> {
  if (!stripe) {
    throw new Error('Stripe not configured')
  }

  const priceId = await getFoundingFlockYearlyPriceId()
  if (!priceId) {
    throw new Error('Founding Flock Yearly price ID not configured')
  }

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    mode: 'subscription',
    success_url: `${getAppUrl()}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${getAppUrl()}/checkout/cancelled`,
    metadata: {
      userId,
      clerkUserId,
      tier: 'founding_flock_yearly',
    },
    subscription_data: {
      metadata: {
        userId,
        clerkUserId,
        tier: 'founding_flock_yearly',
      },
    },
  })

  return {
    sessionId: session.id,
    url: session.url || '',
  }
}

/**
 * Create a checkout session for Founding Flock membership (legacy - defaults to yearly)
 */
export async function createFoundingFlockCheckout(
  clerkUserId: string,
  userId: string
): Promise<{ sessionId: string; url: string } | null> {
  return createFoundingFlockYearlyCheckout(clerkUserId, userId)
}

/**
 * Update user premium status after successful payment
 */
export async function updateUserPremiumStatus(
  userId: string,
  isPremium: boolean,
  isFoundingMember: boolean,
  stripeCustomerId?: string,
  stripeSubscriptionId?: string
): Promise<void> {
  const supabase = getSupabase()
  
  const updateData: Record<string, any> = {
    isPremium,
    isFoundingMember,
    premiumSince: isPremium ? new Date().toISOString() : null,
    updatedAt: new Date().toISOString(),
  }

  // Set subscription tier
  if (isFoundingMember) {
    updateData.subscriptionTier = 'founding_flock'
  } else if (isPremium && !isFoundingMember) {
    updateData.subscriptionTier = 'monthly'
  } else {
    updateData.subscriptionTier = null
  }

  if (stripeCustomerId) {
    updateData.stripeCustomerId = stripeCustomerId
  }

  const { error } = await supabase
    .from('users')
    .update(updateData)
    .eq('id', userId)

  if (error) {
    console.error('[stripe] Error updating user premium status:', error)
    throw error
  }

  console.log(`[stripe] Updated user ${userId} premium status:`, {
    isPremium,
    isFoundingMember,
    stripeCustomerId,
  })
}

/**
 * Create a notification for successful purchase
 */
export async function createPurchaseNotification(userId: string): Promise<void> {
  const supabase = getSupabase()
  
  const { error } = await supabase
    .from('notifications')
    .insert({
      id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      userId,
      type: 'premium_purchased',
      relatedId: null,
      read: false,
      createdAt: new Date().toISOString(),
    })

  if (error) {
    console.error('[stripe] Error creating purchase notification:', error)
    // Don't throw - notification failure shouldn't break payment flow
  }
}
