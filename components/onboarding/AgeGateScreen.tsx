'use client'

import { useState } from 'react'
import ThemeBird from '@/components/ThemeBird'
import ProgressDots from './ProgressDots'

interface DemographicsScreenProps {
  onContinue: () => void
}

export default function DemographicsScreen({ onContinue }: DemographicsScreenProps) {
  const [ageConfirmed, setAgeConfirmed] = useState(false)
  const [gender, setGender] = useState<string>('')

  const handleContinue = () => {
    if (ageConfirmed && gender) {
      // Track analytics
      fetch('/api/analytics/event', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          event: 'onboarding_demographics_completed',
          properties: { gender }
        }),
      }).catch(() => {})

      // Save gender to profile
      fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gender }),
      }).catch(() => {})

      onContinue()
    }
  }

  return (
    <div className="flex flex-col min-h-screen px-6 py-12">
      <div className="flex-1 flex flex-col items-center justify-center max-w-md mx-auto w-full">
        {/* Bird */}
        <div className="mb-8">
          <ThemeBird size={100} state="curious" />
        </div>

        {/* Headline */}
        <h1 className="text-3xl sm:text-4xl font-bold text-text mb-4 text-center font-title">
          Demographics
        </h1>
        
        <p className="text-text/60 mb-8 text-center">
          Help us understand our community better (optional)
        </p>

        {/* Age confirmation checkbox */}
        <div className="w-full mb-6">
          <label className="flex items-start gap-3 p-4 bg-surface rounded-xl cursor-pointer hover:bg-surface/80 transition-colors">
            <input
              type="checkbox"
              checked={ageConfirmed}
              onChange={(e) => setAgeConfirmed(e.target.checked)}
              className="mt-1 w-5 h-5 rounded border-text/20 text-accent focus:ring-accent focus:ring-2"
            />
            <div className="flex-1">
              <div className="font-medium text-text mb-1">
                I confirm I am 13 years or older
              </div>
              <div className="text-sm text-text/60">
                This is required to use SongBird and comply with privacy regulations.
              </div>
            </div>
          </label>
        </div>

        {/* Gender selection */}
        <div className="w-full mb-6">
          <label className="block text-text/70 text-sm mb-3">Gender (optional)</label>
          <div className="grid grid-cols-2 gap-3">
            {['male', 'female', 'non-binary', 'prefer-not-to-say'].map((option) => (
              <button
                key={option}
                onClick={() => setGender(option)}
                className={`p-3 rounded-xl text-sm font-medium transition-all ${
                  gender === option
                    ? 'bg-accent text-bg'
                    : 'bg-surface text-text hover:bg-surface/80'
                }`}
              >
                {option.charAt(0).toUpperCase() + option.slice(1).replace(/-/g, ' ')}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Continue button */}
      <div className="w-full max-w-md mx-auto pb-4">
        <button
          onClick={handleContinue}
          disabled={!ageConfirmed}
          className={`w-full py-4 px-8 font-semibold rounded-xl text-lg transition-all ${
            ageConfirmed
              ? 'bg-accent text-bg hover:bg-accent/90 hover:scale-[1.02] active:scale-[0.98]'
              : 'bg-surface text-text/30 cursor-not-allowed'
          }`}
        >
          Continue
        </button>
      </div>

      {/* Progress dots */}
      <ProgressDots totalSteps={13} currentStep={0} className="pb-8" />
    </div>
  )
}

