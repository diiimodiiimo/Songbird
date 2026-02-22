'use client'

import { useState } from 'react'
import ThemeBird from '@/components/ThemeBird'
import ProgressDots from './ProgressDots'

interface AttributionScreenProps {
  onContinue: () => void
  onSkip: () => void
}

const attributionOptions = [
  { id: 'tiktok', label: 'TikTok' },
  { id: 'instagram', label: 'Instagram' },
  { id: 'twitter', label: 'Twitter/X' },
  { id: 'friend', label: 'Friend referral' },
  { id: 'reddit', label: 'Reddit' },
  { id: 'youtube', label: 'YouTube' },
  { id: 'other', label: 'Other' },
]

export default function AttributionScreen({ onContinue, onSkip }: AttributionScreenProps) {
  const [selectedSource, setSelectedSource] = useState<string | null>(null)

  const handleContinue = () => {
    if (selectedSource) {
      // Track analytics with attribution
      fetch('/api/analytics/event', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          event: 'onboarding_attribution_selected',
          properties: { source: selectedSource }
        }),
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
          How did you hear about SongBird?
        </h1>
        
        <p className="text-text/60 mb-8 text-center">
          Help us understand how you discovered SongBird (optional)
        </p>

        {/* Attribution options */}
        <div className="w-full space-y-2 mb-6">
          {attributionOptions.map((option) => (
            <button
              key={option.id}
              onClick={() => setSelectedSource(option.id)}
              className={`w-full p-4 rounded-xl text-left transition-all ${
                selectedSource === option.id
                  ? 'bg-accent text-bg font-medium'
                  : 'bg-surface text-text hover:bg-surface/80'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {/* Action buttons */}
      <div className="w-full max-w-md mx-auto pb-4 space-y-3">
        <button
          onClick={handleContinue}
          disabled={!selectedSource}
          className={`w-full py-4 px-8 font-semibold rounded-xl text-lg transition-all ${
            selectedSource
              ? 'bg-accent text-bg hover:bg-accent/90 hover:scale-[1.02] active:scale-[0.98]'
              : 'bg-surface text-text/30 cursor-not-allowed'
          }`}
        >
          Continue
        </button>
        
        <button
          onClick={onSkip}
          className="w-full py-3 text-text/50 hover:text-text/70 transition-colors text-sm"
        >
          Skip
        </button>
      </div>

      {/* Progress dots */}
      <ProgressDots totalSteps={13} currentStep={10} className="pb-8" />
    </div>
  )
}

