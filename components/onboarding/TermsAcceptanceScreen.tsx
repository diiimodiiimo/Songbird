'use client'

import { useState } from 'react'
import Link from 'next/link'
import ThemeBird from '@/components/ThemeBird'
import ProgressDots from './ProgressDots'

interface TermsAcceptanceScreenProps {
  onContinue: () => void
}

export default function TermsAcceptanceScreen({ onContinue }: TermsAcceptanceScreenProps) {
  const [termsAccepted, setTermsAccepted] = useState(false)
  const [privacyAccepted, setPrivacyAccepted] = useState(false)

  const allAccepted = termsAccepted && privacyAccepted

  const handleContinue = () => {
    if (allAccepted) {
      // Track analytics
      fetch('/api/analytics/event', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ event: 'onboarding_terms_accepted' }),
      }).catch(() => {})
      onContinue()
    }
  }

  return (
    <div className="flex flex-col min-h-screen px-6 py-12">
      <div className="flex-1 flex flex-col items-center justify-center max-w-md mx-auto w-full">
        {/* Bird */}
        <div className="mb-6">
          <ThemeBird size={80} state="curious" />
        </div>

        {/* Headline */}
        <h1 className="text-3xl sm:text-4xl font-bold text-text mb-3 text-center font-title">
          Terms & Privacy
        </h1>
        
        <p className="text-text/60 mb-8 text-center">
          Please review and accept our Terms of Service and Privacy Policy to continue.
        </p>

        {/* Data collection summary */}
        <div className="w-full bg-surface/50 rounded-xl p-5 mb-6">
          <h3 className="font-semibold text-text mb-3">What we collect:</h3>
          <ul className="space-y-2 text-sm text-text/70">
            <li className="flex items-start gap-2">
              <span className="text-accent mt-0.5">•</span>
              <span>Your song choices and journal entries</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-accent mt-0.5">•</span>
              <span>Your notes and memories</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-accent mt-0.5">•</span>
              <span>Your friends list (if you use social features)</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-accent mt-0.5">•</span>
              <span>Basic account information (email, username)</span>
            </li>
          </ul>
        </div>

        {/* Checkboxes */}
        <div className="w-full space-y-3 mb-6">
          <label className="flex items-start gap-3 p-4 bg-surface rounded-xl cursor-pointer hover:bg-surface/80 transition-colors">
            <input
              type="checkbox"
              checked={termsAccepted}
              onChange={(e) => setTermsAccepted(e.target.checked)}
              className="mt-1 w-5 h-5 rounded border-text/20 text-accent focus:ring-accent focus:ring-2"
            />
            <div className="flex-1">
              <div className="font-medium text-text mb-1">
                I agree to the{' '}
                <Link href="/terms" target="_blank" className="text-accent hover:underline">
                  Terms of Service
                </Link>
              </div>
            </div>
          </label>

          <label className="flex items-start gap-3 p-4 bg-surface rounded-xl cursor-pointer hover:bg-surface/80 transition-colors">
            <input
              type="checkbox"
              checked={privacyAccepted}
              onChange={(e) => setPrivacyAccepted(e.target.checked)}
              className="mt-1 w-5 h-5 rounded border-text/20 text-accent focus:ring-accent focus:ring-2"
            />
            <div className="flex-1">
              <div className="font-medium text-text mb-1">
                I agree to the{' '}
                <Link href="/privacy" target="_blank" className="text-accent hover:underline">
                  Privacy Policy
                </Link>
              </div>
            </div>
          </label>
        </div>
      </div>

      {/* Continue button */}
      <div className="w-full max-w-md mx-auto pb-4">
        <button
          onClick={handleContinue}
          disabled={!allAccepted}
          className={`w-full py-4 px-8 font-semibold rounded-xl text-lg transition-all ${
            allAccepted
              ? 'bg-accent text-bg hover:bg-accent/90 hover:scale-[1.02] active:scale-[0.98]'
              : 'bg-surface text-text/30 cursor-not-allowed'
          }`}
        >
          Continue
        </button>
      </div>

      {/* Progress dots */}
      <ProgressDots totalSteps={12} currentStep={2} className="pb-8" />
    </div>
  )
}

