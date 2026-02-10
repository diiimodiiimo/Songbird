'use client'

import { useState } from 'react'
import ThemeBird from '@/components/ThemeBird'
import ProgressDots from './ProgressDots'

interface SocialScreenProps {
  onContinue: () => void
  onSkip?: () => void
  inviteCode?: string
}

export default function SocialScreen({ onContinue, onSkip, inviteCode }: SocialScreenProps) {
  const [showInviteFlow, setShowInviteFlow] = useState(false)
  const [copied, setCopied] = useState(false)

  const inviteUrl = inviteCode 
    ? `${typeof window !== 'undefined' ? window.location.origin : ''}/join/${inviteCode}`
    : null

  const handleShare = async () => {
    // Generate invite code and share
    try {
      const res = await fetch('/api/invites', { method: 'POST' })
      if (res.ok) {
        const data = await res.json()
        // Use user profile URL if we have a code/username
        const url = data.code 
          ? `${window.location.origin}/user/${data.code}`
          : window.location.origin
        await shareOrCopy(url)
      } else {
        // Fallback to just sharing the app URL
        await shareOrCopy(window.location.origin)
      }
    } catch (err) {
      console.error('Error generating invite:', err)
      // Fallback to just sharing the app URL
      await shareOrCopy(window.location.origin)
    }
  }

  const shareOrCopy = async (url: string) => {
    // Track analytics
    fetch('/api/analytics/event', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ event: 'onboarding_invite_tapped' }),
    }).catch(() => {})

    // Try native share first
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Join me on SongBird',
          text: "I'm logging my daily songs on SongBird. Join me and let's share our music!",
          url,
        })
        onContinue()
        return
      } catch (err) {
        // User cancelled or share failed, fall back to copy
      }
    }

    // Fall back to copy
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  const handleSolo = () => {
    // Track analytics
    fetch('/api/analytics/event', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ event: 'onboarding_invite_skipped' }),
    }).catch(() => {})
    onContinue()
  }

  return (
    <div className="flex flex-col min-h-screen px-6 py-12">
      <div className="flex-1 flex flex-col items-center justify-center max-w-md mx-auto w-full">
        {/* Bird */}
        <div className="mb-6">
          <ThemeBird size={80} state="bounce" />
        </div>

        {/* Headline */}
        <h1 className="text-3xl sm:text-4xl font-bold text-text mb-3 text-center font-title">
          Share with friends — or keep it private
        </h1>
        
        <p className="text-text/60 mb-10 text-center">
          SongBird can be your personal journal, or you can share moments with close friends. Your call.
        </p>

        {/* Social features explanation */}
        <div className="w-full bg-surface/50 rounded-xl p-5 mb-8">
          <div className="space-y-3 text-sm text-text/70">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded bg-accent/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                <svg className="w-4 h-4 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <p>Add friends and see what they're logging each day</p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded bg-accent/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                <svg className="w-4 h-4 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </div>
              <p>Vibe and comment on songs that resonate with you</p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded bg-accent/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                <svg className="w-4 h-4 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <p>Everything stays private between you and your friends</p>
            </div>
          </div>
        </div>
      </div>

      {/* Action buttons */}
      <div className="w-full max-w-md mx-auto pb-4 space-y-3">
        <button
          onClick={handleShare}
          className="w-full py-4 px-8 bg-accent text-bg font-semibold rounded-xl text-lg hover:bg-accent/90 transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2"
        >
          {copied ? (
            <>
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Link copied!
            </>
          ) : (
            <>
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
              </svg>
              Invite a friend
            </>
          )}
        </button>
        
        <button
          onClick={handleSolo}
          className="w-full py-3 text-text/60 hover:text-text/80 transition-colors"
        >
          I'll journal solo for now
        </button>
      </div>

      {/* Progress dots */}
      <ProgressDots totalSteps={12} currentStep={7} className="pb-8" />
    </div>
  )
}

