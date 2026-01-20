'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { useUser } from '@clerk/nextjs'
import FoundingFlockButton from '@/components/FoundingFlockButton'
import Link from 'next/link'

interface PremiumStatus {
  isPremium: boolean
  isFoundingMember: boolean
  premiumSince: string | null
}

interface FoundingSlots {
  total: number
  claimed: number
  remaining: number
  available: boolean
}

export default function PremiumPage() {
  const searchParams = useSearchParams()
  const { user, isLoaded } = useUser()
  const [premiumStatus, setPremiumStatus] = useState<PremiumStatus | null>(null)
  const [slots, setSlots] = useState<FoundingSlots | null>(null)
  const [loading, setLoading] = useState(true)

  const success = searchParams.get('success') === 'true'
  const canceled = searchParams.get('canceled') === 'true'

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch premium status
        const statusRes = await fetch('/api/profile')
        if (statusRes.ok) {
          const data = await statusRes.json()
          setPremiumStatus({
            isPremium: data.user?.isPremium || false,
            isFoundingMember: data.user?.isFoundingMember || false,
            premiumSince: data.user?.premiumSince || null,
          })
        }

        // Fetch founding slots
        const slotsRes = await fetch('/api/founding-slots')
        if (slotsRes.ok) {
          const slotsData = await slotsRes.json()
          setSlots(slotsData)
        }
      } catch (error) {
        console.error('Error fetching premium data:', error)
      } finally {
        setLoading(false)
      }
    }

    if (isLoaded) {
      fetchData()
    }
  }, [isLoaded])

  if (!isLoaded || loading) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <div className="animate-pulse text-text">Loading...</div>
      </div>
    )
  }

  // Already premium - show success state
  if (premiumStatus?.isPremium) {
    return (
      <div className="min-h-screen bg-bg p-6">
        <div className="max-w-md mx-auto">
          <Link
            href="/"
            className="text-text/60 hover:text-text mb-6 inline-flex items-center gap-2"
          >
            ← Back
          </Link>

          <div className="bg-surface rounded-2xl p-8 text-center">
            <div className="text-6xl mb-4">🎉</div>
            <h1 className="text-2xl font-bold text-text mb-2">
              {success ? "Welcome to the Flock!" : "You're a Founding Member!"}
            </h1>
            <p className="text-text/60 mb-6">
              {premiumStatus.isFoundingMember
                ? "You have lifetime premium access to all SongBird features."
                : "You have premium access to all SongBird features."}
            </p>

            {premiumStatus.isFoundingMember && (
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-accent/20 text-accent rounded-full text-sm font-medium">
                🐦 Founding Flock Member
              </div>
            )}

            <div className="mt-8 space-y-3 text-left">
              <h2 className="font-semibold text-text">Your Premium Features:</h2>
              <ul className="space-y-2 text-text/80">
                <li className="flex items-center gap-2">
                  <span className="text-green-500">✓</span> All 9 bird themes unlocked
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-500">✓</span> B-sides (multiple songs per day)
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-500">✓</span> Full analytics history
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-500">✓</span> On This Day (full history)
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-500">✓</span> Wrapped summaries
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-500">✓</span> All future features
                </li>
              </ul>
            </div>

            <Link
              href="/"
              className="mt-8 inline-block px-6 py-3 bg-accent text-bg rounded-xl font-medium hover:opacity-90"
            >
              Start Exploring →
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // Canceled checkout
  if (canceled) {
    return (
      <div className="min-h-screen bg-bg p-6">
        <div className="max-w-md mx-auto">
          <Link
            href="/"
            className="text-text/60 hover:text-text mb-6 inline-flex items-center gap-2"
          >
            ← Back
          </Link>

          <div className="bg-surface rounded-2xl p-8 text-center">
            <div className="text-6xl mb-4">🐦</div>
            <h1 className="text-2xl font-bold text-text mb-2">No worries!</h1>
            <p className="text-text/60 mb-6">
              You can join the Founding Flock anytime. We'll be here when you're ready.
            </p>

            <FoundingFlockButton />

            <p className="mt-4 text-sm text-text/40">
              {slots?.remaining && `Only ${slots.remaining} spots remaining`}
            </p>
          </div>
        </div>
      </div>
    )
  }

  // Default: Show upgrade page
  return (
    <div className="min-h-screen bg-bg p-6">
      <div className="max-w-md mx-auto">
        <Link
          href="/"
          className="text-text/60 hover:text-text mb-6 inline-flex items-center gap-2"
        >
          ← Back
        </Link>

        <div className="bg-surface rounded-2xl p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="text-6xl mb-4">🐦</div>
            <h1 className="text-2xl font-bold text-text mb-2">Join the Founding Flock</h1>
            <p className="text-text/60">
              $29.99 once — premium forever
            </p>
          </div>

          {/* Slots remaining */}
          {slots && slots.available && (
            <div className="bg-accent/10 border border-accent/30 rounded-xl p-4 mb-8 text-center">
              <p className="text-accent font-medium">
                Only {slots.remaining} founding spots remaining
              </p>
              <p className="text-sm text-text/60 mt-1">
                Limited to {slots.total} lifetime members
              </p>
            </div>
          )}

          {/* What you get today */}
          <div className="mb-8">
            <h2 className="font-semibold text-text mb-3">Unlock today:</h2>
            <ul className="space-y-2">
              <li className="flex items-start gap-3 text-text/80">
                <span className="text-accent">🎨</span>
                <span>All 9 bird themes (skip the streak grind)</span>
              </li>
              <li className="flex items-start gap-3 text-text/80">
                <span className="text-accent">🎵</span>
                <span>B-sides — log as many songs as you want</span>
              </li>
              <li className="flex items-start gap-3 text-text/80">
                <span className="text-accent">🏆</span>
                <span>Founding Flock badge on your profile</span>
              </li>
            </ul>
          </div>

          {/* What you get as story grows */}
          <div className="mb-8">
            <h2 className="font-semibold text-text mb-3">Unlock as your story grows:</h2>
            <ul className="space-y-2">
              <li className="flex items-start gap-3 text-text/80">
                <span className="text-accent">📊</span>
                <span>Full analytics across all time</span>
              </li>
              <li className="flex items-start gap-3 text-text/80">
                <span className="text-accent">🎁</span>
                <span>Wrapped — your year in music</span>
              </li>
              <li className="flex items-start gap-3 text-text/80">
                <span className="text-accent">📅</span>
                <span>On This Day — unlimited memory lookback</span>
              </li>
              <li className="flex items-start gap-3 text-text/80">
                <span className="text-accent">✨</span>
                <span>Every future feature we build</span>
              </li>
            </ul>
          </div>

          {/* CTA */}
          <div className="text-center">
            <FoundingFlockButton />
            <p className="mt-4 text-sm text-text/40">
              One-time payment. No subscription. Forever.
            </p>
          </div>
        </div>

        {/* Future You messaging */}
        <div className="mt-8 text-center">
          <p className="text-text/60 text-sm italic">
            "In one year, you'll look back at your first Wrapped and be glad you started today."
          </p>
        </div>
      </div>
    </div>
  )
}

