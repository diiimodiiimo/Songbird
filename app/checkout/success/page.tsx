'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useUser } from '@clerk/nextjs'
import ThemeBird from '@/components/ThemeBird'
import Link from 'next/link'

export default function CheckoutSuccessPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user, isLoaded } = useUser()
  const [premiumStatus, setPremiumStatus] = useState<{
    isPremium: boolean
    isFoundingMember: boolean
  } | null>(null)
  const [loading, setLoading] = useState(true)

  const sessionId = searchParams.get('session_id')

  useEffect(() => {
    if (isLoaded && user) {
      // Wait a moment for webhook to process, then check status
      setTimeout(async () => {
        try {
          const res = await fetch('/api/user/subscription')
          if (res.ok) {
            const data = await res.json()
            setPremiumStatus({
              isPremium: data.isPremium,
              isFoundingMember: data.isFoundingMember,
            })
          }
        } catch (err) {
          console.error('Error fetching premium status:', err)
        } finally {
          setLoading(false)
        }
      }, 2000) // Wait 2 seconds for webhook to process
    } else if (isLoaded && !user) {
      router.push('/home')
    }
  }, [isLoaded, user, router])

  if (!isLoaded || loading) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-accent/30 border-t-accent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-text/60">Processing your purchase...</p>
        </div>
      </div>
    )
  }

  const isFoundingMember = premiumStatus?.isFoundingMember || false
  const isPremium = premiumStatus?.isPremium || false

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center px-4">
      <div className="max-w-2xl w-full">
        <div className="bg-surface rounded-xl p-8 md:p-12 border border-green-500/30 text-center">
          {/* Success Icon */}
          <div className="mb-6 flex justify-center">
            <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center">
              <svg className="w-12 h-12 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>

          {/* Bird Animation */}
          <div className="mb-6 flex justify-center">
            <ThemeBird size={120} state="sing" />
          </div>

          {/* Success Message */}
          <h1 className="text-4xl font-bold text-text mb-4">
            {isFoundingMember ? "Welcome to the Founding Flock!" : isPremium ? "Welcome to Premium!" : "Thank You!"}
          </h1>
          
          <p className="text-xl text-text/70 mb-6">
            {isFoundingMember 
              ? "You now have lifetime premium access. Thank you for being part of the first 1,000 members!"
              : isPremium
              ? "Your premium subscription is now active. Enjoy all premium features!"
              : "Your payment is being processed. You'll receive access shortly."}
          </p>

          {/* Features Unlocked */}
          <div className="bg-bg/50 rounded-lg p-6 mb-6 text-left">
            <h2 className="text-lg font-semibold text-text mb-4">What's Now Unlocked:</h2>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <div>
                  <div className="font-semibold text-text">Unlimited Entries</div>
                  <div className="text-sm text-text/60">Log as many songs as you want</div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <div>
                  <div className="font-semibold text-text">All Bird Themes</div>
                  <div className="text-sm text-text/60">Unlock birds through streaks and entries, or get them all with premium</div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <div>
                  <div className="font-semibold text-text">Full History Access</div>
                  <div className="text-sm text-text/60">See all your "On This Day" memories</div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <div>
                  <div className="font-semibold text-text">Advanced Analytics</div>
                  <div className="text-sm text-text/60">Complete insights into your music journey</div>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/"
              className="px-6 py-3 bg-accent text-bg font-semibold rounded-xl hover:bg-accent/90 transition-all"
            >
              Start Using SongBird
            </Link>
            <Link
              href="/aviary"
              className="px-6 py-3 bg-surface border border-accent/30 text-accent font-semibold rounded-xl hover:bg-surface/80 transition-all"
            >
              View Your Birds
            </Link>
          </div>

          {/* Session ID (for support) */}
          {sessionId && (
            <p className="text-xs text-text/40 mt-6">
              Order ID: {sessionId.substring(0, 20)}...
            </p>
          )}
        </div>
      </div>
    </div>
  )
}


