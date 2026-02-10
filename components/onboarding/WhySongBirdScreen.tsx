'use client'

import ThemeBird from '@/components/ThemeBird'
import ProgressDots from './ProgressDots'

interface WhySongBirdScreenProps {
  onContinue: () => void
}

export default function WhySongBirdScreen({ onContinue }: WhySongBirdScreenProps) {
  return (
    <div className="flex flex-col min-h-screen px-6 py-12">
      <div className="flex-1 flex flex-col items-center justify-center max-w-md mx-auto w-full">
        {/* Bird */}
        <div className="mb-8">
          <ThemeBird size={100} state="sing" />
        </div>

        {/* Headline */}
        <h1 className="text-3xl sm:text-4xl font-bold text-text mb-6 text-center font-title">
          Why SongBird?
        </h1>

        {/* Core message */}
        <div className="w-full space-y-6 mb-8">
          <div className="bg-surface/50 rounded-xl p-5">
            <p className="text-text/80 text-center leading-relaxed">
              Music has a unique power to unlock memories. A single song can transport you back to a moment, a feeling, a person.
            </p>
          </div>

          <div className="space-y-4 text-sm text-text/70">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-accent/20 flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                </svg>
              </div>
              <div>
                <div className="font-semibold text-text mb-1">Music is Memory</div>
                <p className="text-xs text-text/60">
                  Every song you log becomes a time capsule. Years from now, you'll remember exactly where you were, who you were with, and how you felt.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-accent/20 flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <div>
                <div className="font-semibold text-text mb-1">Build Your Story</div>
                <p className="text-xs text-text/60">
                  Over time, your entries create a musical autobiography. See patterns, relive moments, and understand yourself through the songs that shaped you.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-accent/20 flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <div>
                <div className="font-semibold text-text mb-1">Connect Through Music</div>
                <p className="text-xs text-text/60">
                  Share moments with friends. See what songs defined their days. Music brings people together, and SongBird makes those connections visible.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Quote or inspiration */}
        <div className="w-full bg-accent/10 border border-accent/20 rounded-xl p-4 mb-6">
          <p className="text-text/70 text-sm italic text-center">
            "Music is the soundtrack to your life. SongBird helps you remember the songs that mattered."
          </p>
        </div>
      </div>

      {/* Continue button */}
      <div className="w-full max-w-md mx-auto pb-4">
        <button
          onClick={onContinue}
          className="w-full py-4 px-8 bg-accent text-bg font-semibold rounded-xl text-lg hover:bg-accent/90 transition-all hover:scale-[1.02] active:scale-[0.98]"
        >
          Start Your Journey
        </button>
      </div>

      {/* Progress dots - this would be adjusted based on where it fits in the flow */}
      <ProgressDots totalSteps={13} currentStep={3} className="pb-8" />
    </div>
  )
}

