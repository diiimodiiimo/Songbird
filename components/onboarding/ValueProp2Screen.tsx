'use client'

import Image from 'next/image'
import ThemeBird from '@/components/ThemeBird'
import ProgressDots from './ProgressDots'

interface ValueProp2ScreenProps {
  onContinue: () => void
}

export default function ValueProp2Screen({ onContinue }: ValueProp2ScreenProps) {
  return (
    <div className="flex flex-col min-h-screen px-6 py-12">
      <div className="flex-1 flex flex-col items-center justify-center max-w-md mx-auto w-full">
        {/* Illustration - Mock "On This Day" card */}
        <div className="mb-8 w-full">
          <div className="bg-surface rounded-xl p-6 border border-accent/20 shadow-lg">
            <div className="text-xs text-accent mb-3 font-medium">January 25, 2025</div>
            <div className="flex gap-4 mb-4">
              <div className="w-20 h-20 bg-gradient-to-br from-purple-400 to-purple-600 rounded-lg flex-shrink-0" />
              <div className="flex-1">
                <div className="font-bold text-lg mb-1">Hundred</div>
                <div className="text-text/70 text-sm">Khalid</div>
              </div>
            </div>
            <div className="text-sm text-text/70 leading-relaxed bg-bg/50 rounded-lg p-3">
              "Winter and 'Hundred' by Khalid. Something about cold weather makes certain songs hit harder. Looking at your history for this date across 4 years, you can see how your winter soundtrack has evolved."
            </div>
          </div>
        </div>

        {/* Headline */}
        <h1 className="text-3xl sm:text-4xl font-bold text-text mb-4 text-center font-title">
          See Your Story Unfold
        </h1>

        {/* Body */}
        <p className="text-lg text-text/70 mb-12 text-center leading-relaxed">
          Discover patterns you didn't even know existed. Keep logging to get a real 'Wrapped'.
        </p>
      </div>

      {/* Progress indicator */}
      <ProgressDots totalSteps={13} currentStep={2} className="mb-8" />

      {/* Continue button */}
      <div className="w-full max-w-sm mx-auto pb-8">
        <button
          onClick={onContinue}
          className="w-full py-4 px-8 bg-accent text-bg font-semibold rounded-xl text-lg hover:bg-accent/90 transition-all hover:scale-[1.02] active:scale-[0.98]"
        >
          I'm Interested
        </button>
      </div>
    </div>
  )
}



