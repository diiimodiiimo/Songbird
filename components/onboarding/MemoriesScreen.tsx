'use client'

import Image from 'next/image'
import ThemeBird from '@/components/ThemeBird'
import ProgressDots from './ProgressDots'

interface MemoriesScreenProps {
  onContinue: () => void
  hasFirstEntry: boolean
}

// Sample/mock data for the preview
const mockMemories = [
  { year: '2023', song: 'Anti-Hero', artist: 'Taylor Swift', albumArt: null },
  { year: '2022', song: 'As It Was', artist: 'Harry Styles', albumArt: null },
  { year: '2021', song: 'drivers license', artist: 'Olivia Rodrigo', albumArt: null },
]

export default function MemoriesScreen({ onContinue, hasFirstEntry }: MemoriesScreenProps) {
  const today = new Date()
  const formattedDate = today.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })

  return (
    <div className="flex flex-col min-h-screen px-6 py-12">
      <div className="flex-1 flex flex-col items-center justify-center max-w-md mx-auto w-full">
        {/* Headline */}
        <h1 className="text-3xl sm:text-4xl font-bold text-text mb-3 text-center font-title">
          Over time, you'll build a musical autobiography
        </h1>
        
        <p className="text-text/60 mb-8 text-center">
          Imagine seeing what song defined this day last year, or three years ago.
        </p>

        {/* Mock On This Day preview */}
        <div className="w-full bg-surface rounded-2xl p-5 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-text">On This Day</h3>
            <span className="text-sm text-accent">{formattedDate}</span>
          </div>

          <div className="space-y-3">
            {mockMemories.map((memory, i) => (
              <div
                key={i}
                className="flex items-center gap-3 p-3 bg-bg/50 rounded-xl opacity-60"
              >
                <div className="w-12 h-12 bg-accent/20 rounded-lg flex items-center justify-center">
                  <span className="text-lg">🎵</span>
                </div>
                <div className="flex-1">
                  <div className="text-xs text-accent mb-0.5">{memory.year}</div>
                  <div className="font-medium text-text text-sm">{memory.song}</div>
                  <div className="text-xs text-text/60">{memory.artist}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Preview label */}
          <div className="mt-4 text-center">
            <span className="inline-block px-3 py-1 bg-accent/10 rounded-full text-xs text-accent">
              Preview — your memories will appear here
            </span>
          </div>
        </div>

        {/* Bird looking at memories */}
        <div className="mb-4">
          <ThemeBird size={60} state="curious" />
        </div>

        {/* Personalized message if they logged a song */}
        {hasFirstEntry ? (
          <p className="text-text/70 text-center text-sm">
            Your first memory is already saved. Keep going and you'll have a year of moments to look back on.
          </p>
        ) : (
          <p className="text-text/70 text-center text-sm">
            Log your first song and start building your musical timeline.
          </p>
        )}
      </div>

      {/* Continue button */}
      <div className="w-full max-w-md mx-auto pb-4">
        <button
          onClick={onContinue}
          className="w-full py-4 px-8 bg-accent text-bg font-semibold rounded-xl text-lg hover:bg-accent/90 transition-all hover:scale-[1.02] active:scale-[0.98]"
        >
          Continue
        </button>
      </div>

      {/* Progress dots */}
      <ProgressDots totalSteps={6} currentStep={3} className="pb-8" />
    </div>
  )
}



