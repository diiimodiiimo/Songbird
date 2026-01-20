// Stripe is disabled until fully configured
// All users currently have Founding Flock access

// Founding Flock pricing constants (for future use)
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

// Placeholder stripe export (null until configured)
export const stripe = null
