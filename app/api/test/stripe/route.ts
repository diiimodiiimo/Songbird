import { NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { getFoundingFlockSpecialPriceId, getFoundingFlockYearlyPriceId, getMonthlyPriceId } from '@/lib/stripe'

/**
 * GET /api/test/stripe
 * Test endpoint to verify Stripe configuration
 */
export async function GET() {
  const results: Record<string, any> = {
    timestamp: new Date().toISOString(),
    checks: {},
    errors: [],
  }

  // Check 1: Stripe client initialized
  try {
    results.checks.stripeClient = {
      configured: !!stripe,
      status: stripe ? 'OK' : 'NOT CONFIGURED',
    }
    if (!stripe) {
      results.errors.push('STRIPE_SECRET_KEY not set or invalid')
    }
  } catch (error) {
    results.checks.stripeClient = {
      configured: false,
      status: 'ERROR',
      error: error instanceof Error ? error.message : 'Unknown error',
    }
    results.errors.push('Failed to initialize Stripe client')
  }

  // Check 2: Environment variables
  results.checks.envVars = {
    STRIPE_SECRET_KEY: !!process.env.STRIPE_SECRET_KEY,
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: !!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
    STRIPE_WEBHOOK_SECRET: !!process.env.STRIPE_WEBHOOK_SECRET,
    STRIPE_FOUNDING_FLOCK_SPECIAL_PRICE_ID: !!process.env.STRIPE_FOUNDING_FLOCK_SPECIAL_PRICE_ID,
    STRIPE_FOUNDING_FLOCK_YEARLY_PRICE_ID: !!process.env.STRIPE_FOUNDING_FLOCK_YEARLY_PRICE_ID,
    STRIPE_MONTHLY_PRICE_ID: !!process.env.STRIPE_MONTHLY_PRICE_ID,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || 'NOT SET',
  }

  // Check 3: Price IDs
  try {
    const foundingSpecialPriceId = await getFoundingFlockSpecialPriceId()
    const foundingYearlyPriceId = await getFoundingFlockYearlyPriceId()
    const monthlyPriceId = await getMonthlyPriceId()
    
    results.checks.priceIds = {
      foundingFlockSpecial: {
        configured: !!foundingSpecialPriceId,
        value: foundingSpecialPriceId || 'NOT SET',
      },
      foundingFlockYearly: {
        configured: !!foundingYearlyPriceId,
        value: foundingYearlyPriceId || 'NOT SET',
      },
      monthly: {
        configured: !!monthlyPriceId,
        value: monthlyPriceId || 'NOT SET',
      },
    }

    if (!foundingSpecialPriceId) {
      results.errors.push('STRIPE_FOUNDING_FLOCK_SPECIAL_PRICE_ID not configured')
    }
    if (!foundingYearlyPriceId) {
      results.errors.push('STRIPE_FOUNDING_FLOCK_YEARLY_PRICE_ID not configured')
    }
    if (!monthlyPriceId) {
      results.errors.push('STRIPE_MONTHLY_PRICE_ID not configured')
    }
  } catch (error) {
    results.checks.priceIds = {
      error: error instanceof Error ? error.message : 'Unknown error',
    }
    results.errors.push('Failed to check price IDs')
  }

  // Check 4: Verify prices exist in Stripe (if Stripe is configured)
  if (stripe) {
    try {
      const foundingSpecialPriceId = await getFoundingFlockSpecialPriceId()
      const foundingYearlyPriceId = await getFoundingFlockYearlyPriceId()
      const monthlyPriceId = await getMonthlyPriceId()

      if (foundingSpecialPriceId) {
        try {
          const price = await stripe.prices.retrieve(foundingSpecialPriceId)
          results.checks.stripePrices = {
            ...results.checks.stripePrices,
            foundingFlockSpecial: {
              exists: true,
              amount: price.unit_amount,
              currency: price.currency,
              type: price.type,
            },
          }
        } catch (error) {
          results.checks.stripePrices = {
            ...results.checks.stripePrices,
            foundingFlockSpecial: {
              exists: false,
              error: error instanceof Error ? error.message : 'Price not found',
            },
          }
          results.errors.push(`Founding Flock Special price ${foundingSpecialPriceId} not found in Stripe`)
        }
      }

      if (foundingYearlyPriceId) {
        try {
          const price = await stripe.prices.retrieve(foundingYearlyPriceId)
          results.checks.stripePrices = {
            ...results.checks.stripePrices,
            foundingFlockYearly: {
              exists: true,
              amount: price.unit_amount,
              currency: price.currency,
              interval: price.recurring?.interval,
            },
          }
        } catch (error) {
          results.checks.stripePrices = {
            ...results.checks.stripePrices,
            foundingFlockYearly: {
              exists: false,
              error: error instanceof Error ? error.message : 'Price not found',
            },
          }
          results.errors.push(`Founding Flock Yearly price ${foundingYearlyPriceId} not found in Stripe`)
        }
      }

      if (monthlyPriceId) {
        try {
          const price = await stripe.prices.retrieve(monthlyPriceId)
          results.checks.stripePrices = {
            ...results.checks.stripePrices,
            monthly: {
              exists: true,
              amount: price.unit_amount,
              currency: price.currency,
              interval: price.recurring?.interval,
            },
          }
        } catch (error) {
          results.checks.stripePrices = {
            ...results.checks.stripePrices,
            monthly: {
              exists: false,
              error: error instanceof Error ? error.message : 'Price not found',
            },
          }
          results.errors.push(`Monthly price ${monthlyPriceId} not found in Stripe`)
        }
      }
    } catch (error) {
      results.checks.stripePrices = {
        error: error instanceof Error ? error.message : 'Failed to verify prices',
      }
      results.errors.push('Failed to verify Stripe prices')
    }
  }

  // Summary
  results.summary = {
    allChecksPassed: results.errors.length === 0,
    totalErrors: results.errors.length,
    status: results.errors.length === 0 ? 'READY' : 'NEEDS CONFIGURATION',
  }

  return NextResponse.json(results, {
    status: results.errors.length === 0 ? 200 : 503,
  })
}

