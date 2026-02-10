'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import ThemeBird from '@/components/ThemeBird'

interface FirstEntryCelebrationScreenProps {
  onContinue: () => void
  onViewEntry: () => void
  entry?: {
    songTitle: string
    artist: string
    albumArt: string | null
    date: string
    notes?: string
  }
}

export default function FirstEntryCelebrationScreen({ 
  onContinue, 
  onViewEntry,
  entry 
}: FirstEntryCelebrationScreenProps) {
  const [showConfetti, setShowConfetti] = useState(true)

  useEffect(() => {
    // Auto-dismiss after 5 seconds if user doesn't interact
    const timer = setTimeout(() => {
      setShowConfetti(false)
    }, 5000)
    return () => clearTimeout(timer)
  }, [])

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-6 py-12 bg-bg relative overflow-hidden">
      {/* Confetti animation */}
      {showConfetti && (
        <div className="absolute inset-0 pointer-events-none">
          {Array.from({ length: 20 }).map((_, i) => (
            <div
              key={i}
              className="absolute text-2xl text-accent animate-bounce"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 2}s`,
                animationDuration: `${2 + Math.random() * 2}s`,
              }}
            >
              {['♪', '♫', '♬'][Math.floor(Math.random() * 3)]}
            </div>
          ))}
        </div>
      )}

      <div className="flex-1 flex flex-col items-center justify-center max-w-md mx-auto w-full relative z-10">
        {/* Celebration Bird */}
        <div className="mb-6">
          <ThemeBird size={100} state="sing" />
        </div>

        {/* Headline */}
        <h1 className="text-3xl sm:text-4xl font-bold text-text mb-4 text-center font-title">
          Your first memory is saved
        </h1>

        {/* Entry Preview */}
        {entry && (
          <div className="w-full bg-surface rounded-xl p-6 mb-8 border border-accent/20">
            {entry.albumArt && (
              <Image
                src={entry.albumArt}
                alt={`${entry.songTitle} album art`}
                width={200}
                height={200}
                className="rounded-lg mx-auto mb-4"
                style={{ aspectRatio: '1/1', objectFit: 'cover' }}
              />
            )}
            <div className="text-center">
              <div className="font-bold text-lg mb-1">{entry.songTitle}</div>
              <div className="text-text/70 mb-2">{entry.artist}</div>
              <div className="text-sm text-text/60 mb-2">
                {new Date(entry.date).toLocaleDateString('en-US', {
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric'
                })}
              </div>
              {entry.notes && (
                <div className="text-sm text-text/70 italic mt-3">
                  "{entry.notes}"
                </div>
              )}
            </div>
          </div>
        )}

        {/* Encouragement Text */}
        <p className="text-lg text-text/70 mb-12 text-center leading-relaxed">
          Come back tomorrow to start your streak. Every day you log, you're building something special.
        </p>
      </div>

      {/* CTA buttons */}
      <div className="w-full max-w-sm mx-auto pb-8 space-y-3 relative z-10">
        <button
          onClick={onViewEntry}
          className="w-full py-4 px-8 bg-accent text-bg font-semibold rounded-xl text-lg hover:bg-accent/90 transition-all hover:scale-[1.02] active:scale-[0.98]"
        >
          See My First Entry
        </button>
        <button
          onClick={onContinue}
          className="w-full py-3 text-text/50 hover:text-text/70 transition-colors text-sm"
        >
          Continue Setup
        </button>
      </div>
    </div>
  )
}
