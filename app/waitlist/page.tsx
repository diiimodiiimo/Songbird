'use client'

import { Suspense, useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useTheme } from '@/lib/theme'
import ThemeBird from '@/components/ThemeBird'

function WaitlistContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { currentTheme } = useTheme()
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [inviteCode, setInviteCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [position, setPosition] = useState<number | null>(null)
  const [checkingInvite, setCheckingInvite] = useState(false)

  // Get source from URL params
  const source = searchParams.get('source') || searchParams.get('utm_source') || null
  const referralCode = searchParams.get('ref') || null

  // Check invite code on mount if provided
  useEffect(() => {
    const codeFromUrl = searchParams.get('code')
    if (codeFromUrl) {
      setInviteCode(codeFromUrl)
      checkInviteCode(codeFromUrl)
    }
  }, [searchParams])

  const checkInviteCode = async (code: string) => {
    if (!code) return

    setCheckingInvite(true)
    try {
      const res = await fetch(`/api/waitlist/check?code=${encodeURIComponent(code)}`)
      const data = await res.json()

      if (data.canSignUp && data.bypassWaitlist) {
        // Invite code is valid - redirect to signup with code
        router.push(`/home?invite=${encodeURIComponent(code)}`)
      } else {
        setError('Invalid invite code')
      }
    } catch (err) {
      console.error('Error checking invite code:', err)
    } finally {
      setCheckingInvite(false)
    }
  }

  const handleJoinWaitlist = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await fetch('/api/waitlist/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          name: name || undefined,
          source: source || undefined,
          referralCode: referralCode || undefined,
        }),
      })

      const data = await res.json()

      if (res.ok) {
        setSuccess(true)
        setPosition(data.position)
      } else {
        setError(data.error || 'Failed to join waitlist')
        if (data.position) {
          setPosition(data.position)
        }
      }
    } catch (err: any) {
      setError(err.message || 'Failed to join waitlist')
    } finally {
      setLoading(false)
    }
  }

  const handleReserveFoundingFlock = async () => {
    if (!email) {
      setError('Please enter your email first')
      return
    }

    setError('')
    setLoading(true)

    try {
      const res = await fetch('/api/waitlist/founding-flock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          name: name || undefined,
          source: source || undefined,
          referralCode: referralCode || undefined,
        }),
      })

      const data = await res.json()

      if (res.ok && data.url) {
        // Redirect to Stripe checkout
        window.location.href = data.url
      } else {
        setError(data.error || 'Failed to create checkout session')
      }
    } catch (err: any) {
      setError(err.message || 'Failed to reserve Founding Flock spot')
    } finally {
      setLoading(false)
    }
  }

  if (checkingInvite) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-accent/30 border-t-accent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-text/60">Checking invite code...</p>
        </div>
      </div>
    )
  }

  if (success) {
    return (
      <div className="min-h-screen bg-bg flex flex-col items-center justify-center px-6 py-12">
        <div className="max-w-md w-full text-center space-y-6">
          <ThemeBird size={120} state="bounce" />
          <h1 className="text-4xl font-bold text-text">You're on the list!</h1>
          {position && (
            <p className="text-xl text-accent">
              You're #{position} on the waitlist
            </p>
          )}
          <p className="text-text/70">
            We'll email you when SongBird launches. Everyone gets access together!
          </p>
          <div className="pt-4">
            <button
              onClick={() => {
                setSuccess(false)
                setEmail('')
                setName('')
              }}
              className="px-6 py-2 bg-surface border border-accent/40 text-accent rounded-lg hover:bg-surface/80 transition-colors"
            >
              Join Another Email
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-bg flex flex-col items-center justify-center px-6 py-12">
      <div className="max-w-2xl w-full space-y-8">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <ThemeBird size={120} state="bounce" />
        </div>

        {/* Headline */}
        <div className="text-center space-y-4">
          <h1 className="text-5xl sm:text-6xl font-bold text-text font-title">
            SongBird
          </h1>
          <p className="text-2xl text-accent font-medium">
            Your Musical Autobiography
          </p>
          <p className="text-lg text-text/70">
            Every day has a soundtrack. Build yours.
          </p>
        </div>

        {/* Value Proposition */}
        <div className="bg-surface/50 border border-accent/20 rounded-xl p-6 space-y-4">
          <h2 className="text-xl font-semibold text-text mb-4">What is SongBird?</h2>
          <div className="space-y-3 text-text/80">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded bg-accent/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                <svg className="w-4 h-4 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                </svg>
              </div>
              <div>
                <div className="font-semibold text-text">Daily Music Journaling</div>
                <div className="text-sm text-text/60">Track your song of the day with notes and memories</div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded bg-accent/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                <svg className="w-4 h-4 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <div>
                <div className="font-semibold text-text">Social Features</div>
                <div className="text-sm text-text/60">Connect with friends, share entries, and discover music together</div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded bg-accent/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                <svg className="w-4 h-4 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <div className="font-semibold text-text">"On This Day" Memories</div>
                <div className="text-sm text-text/60">Relive your musical past with memories from years ago</div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded bg-accent/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                <svg className="w-4 h-4 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <div>
                <div className="font-semibold text-text">Analytics & Insights</div>
                <div className="text-sm text-text/60">Discover your music patterns and top artists</div>
              </div>
            </div>
          </div>
        </div>

        {/* Key Message */}
        <div className="bg-accent/10 border-2 border-accent/40 rounded-xl p-4 text-center">
          <p className="text-text font-medium">
            🎉 Everyone gets access together! Join the waitlist to be notified when we launch.
          </p>
        </div>

        {/* Invite Code Section */}
        {!inviteCode && (
          <div className="bg-surface/30 rounded-xl p-4">
            <label className="block text-sm font-medium text-text mb-2">
              Have an invite code?
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value)}
                placeholder="Enter invite code"
                className="flex-1 px-4 py-2 bg-bg border border-primary rounded text-primary"
              />
              <button
                onClick={() => inviteCode && checkInviteCode(inviteCode)}
                className="px-4 py-2 bg-accent text-bg rounded hover:bg-accent/90 transition-colors"
              >
                Use Code
              </button>
            </div>
          </div>
        )}

        {/* Email Form */}
        <form onSubmit={handleJoinWaitlist} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-text mb-2">
              Email *
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="your@email.com"
              className="w-full px-4 py-3 bg-bg border border-primary rounded-lg text-primary focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-text mb-2">
              Name (optional)
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              className="w-full px-4 py-3 bg-bg border border-primary rounded-lg text-primary focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </div>

          {error && (
            <div className="p-3 bg-red-500/20 border border-red-500/40 text-red-200 rounded-lg">
              {error}
            </div>
          )}

          {/* Options */}
          <div className="space-y-3 pt-4">
            <button
              type="submit"
              disabled={loading}
              className="w-full px-6 py-4 bg-accent text-bg font-semibold rounded-xl hover:bg-accent/90 transition-all text-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Joining...' : 'Join Waitlist (Free)'}
            </button>

            <div className="relative flex items-center py-4">
              <div className="flex-grow border-t border-text/20"></div>
              <span className="px-4 text-sm text-text/60">or</span>
              <div className="flex-grow border-t border-text/20"></div>
            </div>

            <button
              type="button"
              onClick={handleReserveFoundingFlock}
              disabled={loading || !email}
              className="w-full px-6 py-4 bg-surface border-2 border-accent text-accent font-semibold rounded-xl hover:bg-surface/80 transition-all text-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Processing...' : 'Reserve Founding Flock • $39.99'}
            </button>
            <p className="text-xs text-text/50 text-center">
              Pay now to reserve your premium spot. Everyone gets access together when we launch.
            </p>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function WaitlistPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-bg flex items-center justify-center">
          <div className="w-12 h-12 border-4 border-accent/30 border-t-accent rounded-full animate-spin mx-auto" />
        </div>
      }
    >
      <WaitlistContent />
    </Suspense>
  )
}
