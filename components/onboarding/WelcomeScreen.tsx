'use client'

import ThemeBird from '@/components/ThemeBird'

interface WelcomeScreenProps {
  onContinue: () => void
}

export default function WelcomeScreen({ onContinue }: WelcomeScreenProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-6 py-12">
      <div className="flex-1 flex flex-col items-center justify-center max-w-md text-center">

        {/* Logo/Bird */}
        <div className="mb-6">
          <ThemeBird size={120} state="bounce" />
        </div>

        {/* Headline */}
        <h1 className="text-4xl sm:text-5xl font-bold text-text mb-4 font-title">
          SongBird
        </h1>

        {/* Tagline */}
        <p className="text-xl text-accent font-medium mb-2">
          Your Musical Autobiography
        </p>

        {/* Subtext */}
        <p className="text-lg text-text/60 mb-12">
          Every day has a soundtrack. Build yours.
        </p>
      </div>

      {/* Continue button */}
      <div className="w-full max-w-sm pb-8">
        <button
          onClick={onContinue}
          className="w-full py-4 px-8 bg-accent text-bg font-semibold rounded-xl text-lg hover:bg-accent/90 transition-all hover:scale-[1.02] active:scale-[0.98]"
        >
          Get Started
        </button>
      </div>
    </div>
  )
}

