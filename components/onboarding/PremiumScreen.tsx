'use client'

import { useState, useEffect } from 'react'
import ThemeBird from '@/components/ThemeBird'
import ProgressDots from './ProgressDots'
import { useRouter } from 'next/navigation'

interface PremiumScreenProps {
  onContinue: () => void
  onSkip: () => void
}

export default function PremiumScreen({ onContinue, onSkip }: PremiumScreenProps) {
  const router = useRouter()
  const [isFoundingMember, setIsFoundingMember] = useState(false)
  const [foundingMembersCount, setFoundingMembersCount] = useState(0)

  useEffect(() => {
    // Check if user is a founding member
    fetch('/api/profile')
      .then(res => res.json())
      .then(data => {
        if (data.user?.isFoundingMember) {
          setIsFoundingMember(true)
        }
      })
      .catch(() => {})

    // Fetch founding members count
    fetch('/api/premium/founding-count')
      .then(res => res.json())
      .then(data => {
        if (data.count !== undefined) {
          setFoundingMembersCount(data.count)
        }
      })
      .catch(() => {
        // Fallback to placeholder if API doesn't exist yet
        setFoundingMembersCount(127)
      })
  }, [])

  return (
    <div className="flex flex-col min-h-screen px-6 py-12">
      <div className="flex-1 flex flex-col items-center justify-center max-w-md mx-auto w-full">
        {/* Badge */}
        <div className="mb-4">
          <span className="px-4 py-1.5 bg-accent/20 border border-accent/40 rounded-full text-accent text-sm font-semibold">
            Limited Time Offer
          </span>
        </div>

        {/* Headline */}
        <h1 className="text-3xl sm:text-4xl font-bold text-text mb-3 text-center font-title">
          Join the Founding Flock
        </h1>

        {/* Offer Card */}
        <div className="w-full bg-accent/10 border-2 border-accent/40 rounded-xl p-6 mb-6">
          <div className="text-center mb-4">
            <div className="flex items-center justify-center gap-2 mb-2">
              <span className="text-text/50 line-through text-lg">$29.99/year</span>
              <span className="text-3xl font-bold text-accent">$39.99</span>
            </div>
            <div className="text-sm text-text/70">one-time • lifetime access</div>
          </div>

          {/* Counter */}
          <div className="mt-4">
            <div className="text-center text-sm text-text/70 mb-2">
              {500 - foundingMembersCount} of 500 spots remaining
            </div>
            <div className="w-full bg-bg rounded-full h-2">
              <div 
                className="bg-accent h-2 rounded-full transition-all"
                style={{ width: `${Math.min(100, (foundingMembersCount / 500) * 100)}%` }}
              />
            </div>
          </div>
        </div>

        {/* Benefits List */}
        <div className="w-full bg-surface/50 rounded-xl p-5 mb-6">
          <div className="space-y-3 text-sm text-text/70">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded bg-accent/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                <svg className="w-4 h-4 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                </svg>
              </div>
              <div>
                <div className="font-semibold text-text">All bird themes unlocked forever</div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded bg-accent/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                <svg className="w-4 h-4 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <div>
                <div className="font-semibold text-text">Unlimited friends</div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded bg-accent/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                <svg className="w-4 h-4 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <div>
                <div className="font-semibold text-text">Full analytics & insights</div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded bg-accent/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                <svg className="w-4 h-4 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                </svg>
              </div>
              <div>
                <div className="font-semibold text-text">B-sides (extra daily songs)</div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded bg-accent/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                <svg className="w-4 h-4 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                </svg>
              </div>
              <div>
                <div className="font-semibold text-text">Exclusive "Founding Flock" badge</div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded bg-accent/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                <svg className="w-4 h-4 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div>
                <div className="font-semibold text-text">All future features included</div>
              </div>
            </div>
          </div>
        </div>

        {/* Testimonial */}
        <div className="w-full bg-surface/30 rounded-xl p-5 mb-6 border border-accent/20">
          <p className="text-sm text-text/80 italic mb-2">
            "I've tracked every song for 4.5 years. SongBird is my most valuable possession—it's literally my life story in music."
          </p>
          <p className="text-xs text-text/60">— Dimitri, Founder</p>
        </div>

        {/* CTA Buttons */}
        <div className="w-full space-y-3">
          <button
            onClick={() => {
              router.push('/settings/premium')
              onContinue()
            }}
            className="w-full py-4 px-6 bg-accent text-bg font-semibold rounded-xl hover:bg-accent/90 transition-all text-lg"
          >
            Join Founding Flock • $39.99
          </button>
          <button
            onClick={onSkip}
            className="w-full py-2 text-text/50 hover:text-text/70 transition-colors text-sm"
          >
            Continue with free version
          </button>
        </div>

        {/* Small Print */}
        <p className="text-xs text-text/40 text-center mt-4">
          After 500 members, price increases to $29.99/year subscription
        </p>
      </div>

      {/* Progress dots */}
      <ProgressDots totalSteps={13} currentStep={12} className="pb-8" />
    </div>
  )
}

