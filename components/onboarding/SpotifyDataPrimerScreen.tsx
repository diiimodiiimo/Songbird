'use client'

import ThemeBird from '@/components/ThemeBird'
import SpotifyAttribution from '@/components/SpotifyAttribution'
import ProgressDots from './ProgressDots'

interface SpotifyDataPrimerScreenProps {
  onContinue: () => void
}

export default function SpotifyDataPrimerScreen({ onContinue }: SpotifyDataPrimerScreenProps) {
  const handleContinue = () => {
    // Track analytics
    fetch('/api/analytics/event', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ event: 'onboarding_spotify_primer_viewed' }),
    }).catch(() => {})
    onContinue()
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
          How SongBird finds songs
        </h1>
        
        <p className="text-text/60 mb-8 text-center">
          SongBird uses Spotify's music database to help you search and log songs.
        </p>

        {/* Explanation */}
        <div className="w-full bg-surface/50 rounded-xl p-5 mb-6">
          <div className="space-y-4 text-sm text-text/70">
            <div>
              <div className="font-semibold text-text mb-2">What SongBird accesses:</div>
              <ul className="space-y-1 ml-4">
                <li className="flex items-start gap-2">
                  <span className="text-accent mt-0.5">•</span>
                  <span>Song search results (when you search for a song)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-accent mt-0.5">•</span>
                  <span>Album artwork and song metadata</span>
                </li>
              </ul>
            </div>
            
            <div className="pt-3 border-t border-text/10">
              <div className="font-semibold text-text mb-2">What SongBird does NOT access:</div>
              <ul className="space-y-1 ml-4">
                <li className="flex items-start gap-2">
                  <span className="text-accent mt-0.5">•</span>
                  <span>Your Spotify listening history</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-accent mt-0.5">•</span>
                  <span>Your Spotify playlists or saved songs</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-accent mt-0.5">•</span>
                  <span>Your Spotify account credentials</span>
                </li>
              </ul>
            </div>

            <div className="pt-3 border-t border-text/10">
              <p className="text-text/60 text-xs">
                SongBird uses Spotify's public API to search for songs. You don't need a Spotify account to use SongBird, 
                and we never access your personal Spotify data.
              </p>
            </div>
          </div>
        </div>

        {/* Spotify attribution */}
        <div className="mb-6">
          <SpotifyAttribution variant="minimal" />
        </div>
      </div>

      {/* Continue button */}
      <div className="w-full max-w-md mx-auto pb-4">
        <button
          onClick={handleContinue}
          className="w-full py-4 px-8 bg-accent text-bg font-semibold rounded-xl text-lg hover:bg-accent/90 transition-all hover:scale-[1.02] active:scale-[0.98]"
        >
          Got it
        </button>
      </div>

      {/* Progress dots */}
      <ProgressDots totalSteps={13} currentStep={5} className="pb-8" />
    </div>
  )
}

