'use client'

import Image from 'next/image'
import ThemeBird from '@/components/ThemeBird'
import ProgressDots from './ProgressDots'

interface SocialPreviewScreenProps {
  onContinue: () => void
  onSkip: () => void
}

export default function SocialPreviewScreen({ onContinue, onSkip }: SocialPreviewScreenProps) {
  return (
    <div className="flex flex-col min-h-screen px-6 py-12">
      <div className="flex-1 flex flex-col items-center justify-center max-w-md mx-auto w-full">
        {/* Illustration - Mock social feed */}
        <div className="mb-8 w-full space-y-3">
          <div className="bg-surface rounded-xl p-4 border border-accent/20">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-accent/30" />
              <div className="flex-1">
                <div className="font-semibold text-sm">sarah_music</div>
                <div className="text-xs text-text/60">2 hours ago</div>
              </div>
            </div>
            <div className="font-medium mb-1">Superstition - Stevie Wonder</div>
            <div className="flex items-center gap-4 mt-3 text-sm text-text/60">
              <span>❤️ 12</span>
              <span>💬 3</span>
            </div>
          </div>
          <div className="bg-surface rounded-xl p-4 border border-accent/20 opacity-80">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-accent/30" />
              <div className="flex-1">
                <div className="font-semibold text-sm">mike_songs</div>
                <div className="text-xs text-text/60">5 hours ago</div>
              </div>
            </div>
            <div className="font-medium mb-1">Rabiosa - Shakira</div>
            <div className="flex items-center gap-4 mt-3 text-sm text-text/60">
              <span>❤️ 8</span>
              <span>💬 1</span>
            </div>
          </div>
        </div>

        {/* Headline */}
        <h1 className="text-3xl sm:text-4xl font-bold text-text mb-4 text-center font-title">
          Share With Your Flock (Optional)
        </h1>

        {/* Body */}
        <p className="text-lg text-text/70 mb-12 text-center leading-relaxed">
          See what your friends are listening to. Share your moments. Build your musical story together—or keep it private. Your choice.
        </p>
      </div>

      {/* Progress indicator */}
      <ProgressDots totalSteps={5} currentStep={3} className="mb-8" />

      {/* CTA buttons */}
      <div className="w-full max-w-sm mx-auto pb-8 space-y-3">
        <button
          onClick={onContinue}
          className="w-full py-4 px-8 bg-accent text-bg font-semibold rounded-xl text-lg hover:bg-accent/90 transition-all hover:scale-[1.02] active:scale-[0.98]"
        >
          Sounds Good
        </button>
        <button
          onClick={onSkip}
          className="w-full py-3 text-text/50 hover:text-text/70 transition-colors text-sm"
        >
          Skip - I'll add friends later
        </button>
      </div>
    </div>
  )
}


