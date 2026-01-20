import Stripe from 'stripe'

// Validate required environment variables
if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is not set in environment variables')
}

// Initialize Stripe client
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-12-18.acacia',
  typescript: true,
})

// Founding Flock pricing constants
export const FOUNDING_FLOCK_PRICE_CENTS = parseInt(
  process.env.FOUNDING_FLOCK_PRICE_CENTS || '2999',
  10
)
export const FOUNDING_FLOCK_LIMIT = parseInt(
  process.env.FOUNDING_FLOCK_LIMIT || '1000',
  10
)

// App URL for redirects
export const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

