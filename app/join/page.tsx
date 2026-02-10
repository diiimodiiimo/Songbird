'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useTheme } from '@/lib/theme'
import Image from 'next/image'
import { loadStripe } from '@stripe/stripe-js'

/**
 * Simple waitlist page optimized for social media sharing
 * Always accessible - not gated by WAITLIST_MODE_ENABLED
 */
export default function SimpleWaitlistPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { currentTheme } = useTheme()
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [waitlistCount, setWaitlistCount] = useState<number | null>(null)

  const source = searchParams.get('source') || searchParams.get('utm_source') || 'direct'

  useEffect(() => {
    // Fetch waitlist count
    fetch('/api/waitlist/count')
      .then(res => res.json())
      .then(data => {
        if (data.count !== undefined) {
          setWaitlistCount(data.count)
        }
      })
      .catch(() => {})
  }, [])

  const handleJoinWaitlist = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess(false)
    setLoading(true)

    if (!email) {
      setError('Please enter your email')
      setLoading(false)
      return
    }

    try {
      const res = await fetch('/api/waitlist/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email, 
          name: name || null,
          source 
        }),
      })

      const data = await res.json()

      if (res.ok) {
        setSuccess(true)
        setEmail('')
        setName('')
        setWaitlistCount(prev => (prev !== null ? prev + 1 : null))
      } else {
        setError(data.error || 'Failed to join waitlist')
      }
    } catch (error) {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleFoundingFlock = async () => {
    if (!email) {
      setError('Please enter your email first')
      return
    }

    setLoading(true)
    setError('')

    try {
      const stripe = await loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)
      if (!stripe) throw new Error('Stripe not available')

      const res = await fetch('/api/waitlist/founding-flock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, name: name || null, source }),
      })

      const data = await res.json()

      if (res.ok && data.sessionId) {
        await stripe.redirectToCheckout({ sessionId: data.sessionId })
      } else {
        setError(data.error || 'Failed to start checkout')
      }
    } catch (error) {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-bg flex flex-col items-center justify-center px-4 py-12">
      <div className="text-center space-y-8 max-w-md w-full">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <Image
            src={currentTheme.birdLogo}
            alt="SongBird"
            width={120}
            height={120}
            className="object-contain animate-pulse"
            priority
          />
        </div>

        <h1 className="text-4xl sm:text-5xl font-bold text-text mb-2 font-title">
          Join SongBird
        </h1>
        <p className="text-xl text-text/70 mb-2">
          Your personal music journal
        </p>

        {waitlistCount !== null && (
          <p className="text-sm text-text/60 mb-6">
            <span className="font-bold text-accent">{waitlistCount}</span> people are waiting
          </p>
        )}

        {/* Success Message */}
        {success && (
          <div className="bg-green-900/20 border border-green-500/30 rounded-lg p-4 text-green-400 mb-4">
            ✓ You're on the list! We'll email you when we launch.
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-4 text-red-400 mb-4">
            {error}
          </div>
        )}

        {/* Form */}
        {!success && (
          <form onSubmit={handleJoinWaitlist} className="space-y-4">
            <div>
              <input
                type="text"
                placeholder="Your name (optional)"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-3 bg-surface border border-primary/30 rounded-lg text-text placeholder-text/50 focus:ring-2 focus:ring-accent focus:border-transparent"
              />
            </div>
            <div>
              <input
                type="email"
                placeholder="Your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 bg-surface border border-primary/30 rounded-lg text-text placeholder-text/50 focus:ring-2 focus:ring-accent focus:border-transparent"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-6 bg-accent text-bg font-semibold rounded-lg hover:bg-accent/90 transition-colors text-lg disabled:opacity-50"
            >
              {loading ? 'Joining...' : 'Join Waitlist (Free)'}
            </button>
          </form>
        )}

        {/* Founding Flock Option */}
        {!success && (
          <div className="border-t border-primary/20 pt-6">
            <p className="text-text/70 mb-4 text-sm">
              Want premium access at launch?
            </p>
            <button
              onClick={handleFoundingFlock}
              disabled={loading || !email}
              className="w-full py-3 px-6 bg-primary/20 border border-primary/50 text-primary font-semibold rounded-lg hover:bg-primary/30 transition-colors text-lg disabled:opacity-50"
            >
              Reserve Founding Flock ($39.99)
            </button>
          </div>
        )}

        {/* Already have account */}
        <div className="pt-6">
          <button
            onClick={() => router.push('/home')}
            className="text-text/60 hover:text-text text-sm underline"
          >
            Already have an account? Sign in
          </button>
        </div>
      </div>
    </div>
  )
}


