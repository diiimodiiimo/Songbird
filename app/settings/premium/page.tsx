'use client'

import { useState, useEffect } from 'react'
import { useUser } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import ThemeBird from '@/components/ThemeBird'

export default function PremiumPage() {
  const { user, isLoaded } = useUser()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [premiumStatus, setPremiumStatus] = useState<{
    isPremium: boolean
    isFoundingMember: boolean
    stripeCustomerId: string | null
    subscriptionTier: string | null
  } | null>(null)
  const [foundingSlots, setFoundingSlots] = useState<{
    remaining: number
    total: number
    available: boolean
  } | null>(null)

  useEffect(() => {
    if (isLoaded && user) {
      fetchPremiumStatus()
      fetchFoundingSlots()
    }
  }, [isLoaded, user])

  const fetchFoundingSlots = async () => {
    try {
      const res = await fetch('/api/waitlist/stats')
      if (res.ok) {
        const data = await res.json()
        setFoundingSlots({
          remaining: data.foundingSlotsRemaining,
          total: data.foundingSlotsTotal,
          available: data.foundingSlotsAvailable,
        })
      }
    } catch (err) {
      console.error('Error fetching founding slots:', err)
    }
  }

  const fetchPremiumStatus = async () => {
    try {
      const res = await fetch('/api/user/subscription')
      if (res.ok) {
        const data = await res.json()
        setPremiumStatus({
          isPremium: data.isPremium,
          isFoundingMember: data.plan === 'founding_flock',
          stripeCustomerId: data.stripeCustomerId || null,
          subscriptionTier: data.plan || null,
        })
      }
    } catch (err) {
      console.error('Error fetching premium status:', err)
    }
  }

  const handleMonthlyCheckout = async () => {
    if (loading) return
    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/checkout/monthly', {
        method: 'POST',
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to create checkout session')
      }

      if (data.url) {
        window.location.href = data.url
      } else {
        throw new Error('No checkout URL received')
      }
    } catch (err) {
      console.error('Checkout error:', err)
      setError(err instanceof Error ? err.message : 'Something went wrong')
      setLoading(false)
    }
  }

  const handleFoundingFlockSpecialCheckout = async () => {
    if (loading) return
    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/checkout/founding-flock-special', {
        method: 'POST',
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to create checkout session')
      }

      if (data.url) {
        window.location.href = data.url
      } else {
        throw new Error('No checkout URL received')
      }
    } catch (err) {
      console.error('Checkout error:', err)
      setError(err instanceof Error ? err.message : 'Something went wrong')
      setLoading(false)
    }
  }

  const handleFoundingFlockYearlyCheckout = async () => {
    if (loading) return
    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/checkout/founding-flock', {
        method: 'POST',
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to create checkout session')
      }

      if (data.url) {
        window.location.href = data.url
      } else {
        throw new Error('No checkout URL received')
      }
    } catch (err) {
      console.error('Checkout error:', err)
      setError(err instanceof Error ? err.message : 'Something went wrong')
      setLoading(false)
    }
  }

  const handleManageSubscription = async () => {
    if (loading) return
    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/stripe/customer-portal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          returnUrl: window.location.href,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to create portal session')
      }

      if (data.url) {
        // Redirect to Stripe Customer Portal
        window.location.href = data.url
      } else {
        throw new Error('No portal URL received')
      }
    } catch (err) {
      console.error('Portal error:', err)
      setError(err instanceof Error ? err.message : 'Something went wrong')
      setLoading(false)
    }
  }

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-accent/30 border-t-accent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-text/60">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    router.push('/home')
    return null
  }

  const isPremium = premiumStatus?.isPremium || false
  const isFoundingMember = premiumStatus?.isFoundingMember || false
  const hasStripeCustomer = !!premiumStatus?.stripeCustomerId

  return (
    <div className="min-h-screen bg-bg py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Back button */}
        <button
          onClick={() => router.back()}
          className="mb-6 text-text/60 hover:text-text transition-colors flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </button>

        {/* Header */}
        <div className="text-center mb-8">
          <div className="mb-4">
            <ThemeBird size={100} state="sing" />
          </div>
          <h1 className="text-3xl font-bold text-text mb-2">SongBird Premium</h1>
          <p className="text-text/70">Choose your plan and unlock all features</p>
        </div>

        {/* Status */}
        {isFoundingMember && (
          <div className="bg-green-900/20 border border-green-500/30 rounded-xl p-4 mb-6">
            <p className="text-green-400 font-semibold mb-2">✓ You're a Founding Flock member!</p>
            <p className="text-green-400/70 text-sm mb-3">Thank you for your early support. You have lifetime premium access.</p>
            {hasStripeCustomer && (
              <button
                onClick={handleManageSubscription}
                className="text-sm text-green-400 hover:text-green-300 underline"
              >
                Manage Subscription
              </button>
            )}
          </div>
        )}

        {isPremium && !isFoundingMember && (
          <div className="bg-accent/20 border border-accent/30 rounded-xl p-4 mb-6">
            <p className="text-accent font-semibold mb-2">✓ You have premium access</p>
            <p className="text-accent/70 text-sm mb-3">You're subscribed to the monthly plan.</p>
            {hasStripeCustomer && (
              <button
                onClick={handleManageSubscription}
                className="text-sm text-accent hover:text-accent/80 underline mt-2"
              >
                Manage Subscription
              </button>
            )}
          </div>
        )}

        {/* Pricing Options */}
        {!isPremium && (
          <div className="space-y-6 mb-6">
            {/* Founding Flock Special - One-time */}
            <div className="bg-gradient-to-br from-accent/20 to-accent/10 rounded-xl p-8 border-2 border-accent/40">
              <div className="text-center mb-6">
                <div className="inline-block bg-accent text-bg text-xs font-bold px-4 py-2 rounded-full mb-3">
                  BEST VALUE - LIMITED TIME
                </div>
                <div className="text-5xl font-bold text-accent mb-2">$39.99</div>
                <div className="text-text/70 font-semibold">One payment, lifetime access</div>
                {foundingSlots && (
                  <div className="text-sm text-text/50 mt-2">
                    {foundingSlots.remaining} of {foundingSlots.total} spots remaining
                  </div>
                )}
              </div>

              <div className="space-y-3 mb-6">
                <div className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <div>
                    <div className="font-semibold text-text">Lifetime Premium Access</div>
                    <div className="text-sm text-text/60">One payment, never pay again</div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <div>
                    <div className="font-semibold text-text">All Premium Features</div>
                    <div className="text-sm text-text/60">Unlimited entries, full history, analytics</div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <div>
                    <div className="font-semibold text-text">Founding Member Badge</div>
                    <div className="text-sm text-text/60">Exclusive recognition forever</div>
                  </div>
                </div>
              </div>

              {foundingSlots && foundingSlots.available ? (
                <button
                  onClick={handleFoundingFlockSpecialCheckout}
                  disabled={loading}
                  className="w-full py-4 px-6 bg-accent text-bg font-bold rounded-xl hover:bg-accent/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-lg"
                >
                  {loading ? (
                    <>
                      <span className="w-5 h-5 border-2 border-bg/30 border-t-bg rounded-full animate-spin" />
                      Creating checkout...
                    </>
                  ) : (
                    'Claim Lifetime Access - $39.99'
                  )}
                </button>
              ) : (
                <div className="w-full py-4 px-6 bg-text/10 text-text/50 font-semibold rounded-xl text-center">
                  Founding Flock Sold Out
                </div>
              )}
            </div>

            {/* Founding Flock Yearly & Monthly - Side by Side */}
            <div className="grid md:grid-cols-2 gap-6">
              {/* Founding Flock Yearly */}
              <div className="bg-surface rounded-xl p-8 border border-accent/20">
                <div className="text-center mb-6">
                  <div className="inline-block bg-accent/20 text-accent text-xs font-semibold px-3 py-1 rounded-full mb-3">
                    FOUNDING MEMBER
                  </div>
                  <div className="text-4xl font-bold text-accent mb-2">$29.99</div>
                  <div className="text-text/60">per year</div>
                  <div className="text-sm text-text/50 mt-1">Locked rate forever</div>
                </div>

                <div className="space-y-3 mb-6">
                  <div className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <div>
                      <div className="font-semibold text-text">Locked Rate</div>
                      <div className="text-sm text-text/60">$29.99/year forever</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <div>
                      <div className="font-semibold text-text">All Premium Features</div>
                      <div className="text-sm text-text/60">Unlimited entries, full history, analytics</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <div>
                      <div className="font-semibold text-text">Founding Badge</div>
                      <div className="text-sm text-text/60">Exclusive recognition</div>
                    </div>
                  </div>
                </div>

                {foundingSlots && foundingSlots.available ? (
                  <button
                    onClick={handleFoundingFlockYearlyCheckout}
                    disabled={loading}
                    className="w-full py-4 px-6 bg-accent text-bg font-semibold rounded-xl hover:bg-accent/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <span className="w-5 h-5 border-2 border-bg/30 border-t-bg rounded-full animate-spin" />
                        Creating checkout...
                      </>
                    ) : (
                      'Subscribe Yearly - $29.99'
                    )}
                  </button>
                ) : (
                  <div className="w-full py-4 px-6 bg-text/10 text-text/50 font-semibold rounded-xl text-center">
                    Founding Flock Sold Out
                  </div>
                )}
              </div>

              {/* Monthly Subscription */}
              <div className="bg-surface rounded-xl p-8 border border-accent/20">
                <div className="text-center mb-6">
                  <div className="text-4xl font-bold text-accent mb-2">$2.99</div>
                  <div className="text-text/60">per month</div>
                  <div className="text-sm text-text/50 mt-1">Billed monthly</div>
                </div>

                <div className="space-y-3 mb-6">
                  <div className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <div>
                      <div className="font-semibold text-text">All Premium Features</div>
                      <div className="text-sm text-text/60">Unlimited entries, full history, analytics</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <div>
                      <div className="font-semibold text-text">Flexible</div>
                      <div className="text-sm text-text/60">Cancel anytime</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <div>
                      <div className="font-semibold text-text">Auto-Renewal</div>
                      <div className="text-sm text-text/60">Renews monthly until cancelled</div>
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleMonthlyCheckout}
                  disabled={loading}
                  className="w-full py-4 px-6 bg-accent text-bg font-semibold rounded-xl hover:bg-accent/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <span className="w-5 h-5 border-2 border-bg/30 border-t-bg rounded-full animate-spin" />
                      Creating checkout...
                    </>
                  ) : (
                    'Subscribe Monthly - $2.99'
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Features Comparison */}
        <div className="bg-surface rounded-xl p-8 mb-6 border border-accent/20">
          <h2 className="text-2xl font-bold mb-6 text-center">Premium Features</h2>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <div>
                <div className="font-semibold text-text">All Bird Themes Unlocked</div>
                <div className="text-sm text-text/60">Access to all premium bird themes</div>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <div>
                <div className="font-semibold text-text">Full History Access</div>
                <div className="text-sm text-text/60">Unlimited "On This Day" memories</div>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <div>
                <div className="font-semibold text-text">Advanced Analytics</div>
                <div className="text-sm text-text/60">Complete music journey insights</div>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <div>
                <div className="font-semibold text-text">Unlimited Friends</div>
                <div className="text-sm text-text/60">Connect with as many friends as you want</div>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <div>
                <div className="font-semibold text-text">Wrapped Feature</div>
                <div className="text-sm text-text/60">Year-end summary of your music journey</div>
              </div>
            </div>
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-3 mb-4 text-red-400 text-sm">
            {error}
          </div>
        )}

        {/* Test Mode Notice */}
        <div className="bg-yellow-900/20 border border-yellow-500/30 rounded-lg p-4 text-center">
          <p className="text-yellow-400 text-sm font-semibold mb-1">Test Mode</p>
          <p className="text-yellow-400/70 text-xs">
            Use test card: <code className="bg-yellow-900/30 px-1 rounded">4242 4242 4242 4242</code>
          </p>
          <p className="text-yellow-400/70 text-xs mt-1">
            Any future expiry date, any CVC
          </p>
        </div>
      </div>
    </div>
  )
}


