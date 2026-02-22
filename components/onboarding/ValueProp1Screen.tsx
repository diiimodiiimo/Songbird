'use client'

import ThemeBird from '@/components/ThemeBird'
import ProgressDots from './ProgressDots'

interface ValueProp1ScreenProps {
  onContinue: () => void
}

export default function ValueProp1Screen({ onContinue }: ValueProp1ScreenProps) {
  return (
    <div className="flex flex-col min-h-screen px-6 py-12">
      <div className="flex-1 flex flex-col items-center justify-center max-w-md mx-auto w-full">
        {/* Illustration - Calendar grid mockup */}
        <div className="mb-8 w-full max-w-xs">
          <div className="grid grid-cols-7 gap-1 bg-surface/50 rounded-xl p-4">
            {Array.from({ length: 28 }).map((_, i) => (
              <div
                key={i}
                className={`aspect-square rounded ${
                  i < 15
                    ? 'bg-accent/30 animate-pulse'
                    : 'bg-surface border border-text/10'
                }`}
                style={{ animationDelay: `${i * 50}ms`, animationDuration: '2s' }}
              />
            ))}
          </div>
        </div>

        {/* Headline */}
        <h1 className="text-3xl sm:text-4xl font-bold text-text mb-4 text-center font-title">
          Every Day Has a Song
        </h1>

        {/* Body */}
        <p className="text-lg text-text/70 mb-12 text-center leading-relaxed">
          From first dates to breakups, promotions to lazy Sundays—your music tells your story better than words ever could.
        </p>
      </div>

      {/* Progress indicator */}
      <ProgressDots totalSteps={13} currentStep={1} className="mb-8" />

      {/* Continue button */}
      <div className="w-full max-w-sm mx-auto pb-8">
        <button
          onClick={onContinue}
          className="w-full py-4 px-8 bg-accent text-bg font-semibold rounded-xl text-lg hover:bg-accent/90 transition-all hover:scale-[1.02] active:scale-[0.98]"
        >
          Show Me How
        </button>
      </div>
    </div>
  )
}



